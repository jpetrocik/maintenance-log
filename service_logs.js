var mysql = require('mysql');
var config = require("./config.json");
var tokenGenerator = require('./tokens.js');

const pool = require('./mysql.js');

var SERVICE_LOG_TABLE = "service_history";
var SCHEDULE_LOG_TABLE = "scheduled_maintenance";
var MILEAGE_LOG_TABLE = "mileage_log";
var CAR_DETAILS_TABLE = "my_garage";
var CAR_INVITATIONS = "invitations";

var executeQuery = function(sqlStatement, sqlParams, callback) {
    console.log(sqlStatement);
    console.log(sqlParams);
    pool.query(sqlStatement, sqlParams, (error, results, fields) => {
    	if (error)
    		console.log(error);
		callback(error, results);
    });
};

var resolveToken = function(oToken, callback) {
	executeQuery("select id from " + CAR_DETAILS_TABLE + " where token=?", [oToken], (err, results) => {
		if (err) {
			callback(exceptions.GENERIC_SQL_ERROR);
			return;
		}
		callback(err, results[0].id);
	});
}

var serviceLog = {

  myGarage: function(uToken, callback) {
    executeQuery("select iToken as token, name from " + CAR_DETAILS_TABLE + " c left join " + CAR_INVITATIONS + " i ON c.token=i.oToken \
    	where c.status='ACTIVE' and i.uToken=? \
     	order by c.year desc, c.make asc, c.model asc, c.id desc", [uToken], callback);
  },

  addCar: function(params, callback) {
  	let token = tokenGenerator(25);
  	let inserviceDate = (params.inserviceDate)?params.inserviceDate:new Date();
  	let name = "'" + params.year.substring(2) + " " + params.make + " " + params.model;
  	let car  = {token: token, name: name, make: params.make, model: params.model, 
  		trim: params.trim, year: params.year, inserviceDate: inserviceDate, status: "ACTIVE"};

    executeQuery("insert into " + CAR_DETAILS_TABLE + " set ?" , car, (err, results) => { 
    	car.id = results.insertId;

    	let mileage = params.mileage;
    	if (!mileage) {
    		mileage=0;
    	}
   		serviceLog.addMileage(car.id, mileage, (err, results) => {
	    	callback(err, car);
	    });
    });
  },

  carDetails: function(oToken, callback) {
   	resolveToken(oToken, (err, carId) => {
		executeQuery("select c.*, max(mileage) as mileage, DATEDIFF(now(), max(created_date)) as mileageReportedDays \
			from " + CAR_DETAILS_TABLE + " c LEFT JOIN " + MILEAGE_LOG_TABLE + " m ON c.id=m.carId \
			where c.id=?",
			[carId], (err, results) => callback(err, results[0])
		);
	});
  },

  completeServiceLog:  function(oToken, callback) {
   	resolveToken(oToken, (err, carId) => {
		executeQuery("select s.* from " + CAR_DETAILS_TABLE + " c join " + SERVICE_LOG_TABLE + " s on c.id=s.carId where c.id=? \
			order by mileage asc, serviceDate asc", [carId], callback);
	});
  },

  serviceLog:  function(oToken, serviceId, callback) {
   	resolveToken(oToken, (err, carId) => {
		executeQuery("select * from " + SERVICE_LOG_TABLE + " where id=? and carId=?", [serviceId, carId], callback);
	});
  },

  serviceLife: function(oToken, callback) {
  	resolveToken(oToken, (err, carId) => {
		serviceLog.carDetails(oToken, (err, carDetails) => {
			let serviceSql = "select ms.carId, ms.id, ms.service, ms.mileage, ms.months, max(s.serviceDate) as last_service_date, max(s.mileage) as last_service_mileage, \
				DATE_ADD(COALESCE(max(s.serviceDate),c.inserviceDate), INTERVAL months  MONTH) as due_by, \
				DATEDIFF(DATE_ADD(COALESCE(max(s.serviceDate),c.inserviceDate), INTERVAL months  MONTH), now()) as  due_in_days, \
				COALESCE(max(s.mileage),0)+ms.mileage-? as due_in_miles \
				from " + CAR_DETAILS_TABLE + " c left join " + SCHEDULE_LOG_TABLE + " ms on c.id=ms.carId left outer join " + SERVICE_LOG_TABLE + " s on s.service=ms.service and \
				s.carId=ms.carId where ms.carId=? \
				group by ms.id, ms.service, ms.mileage, ms.months";
			let upcomingServiceSql = "select max(1-(due_in_miles/mileage)) as serviceLife from (" + serviceSql + ") as s ";
			executeQuery(upcomingServiceSql, [carDetails.mileage, carId], (err, results) => callback(err, results[0]));
		});
	});
  },

  serviceDue: function(oToken, callback) {
  	resolveToken(oToken, (err, carId) => {
		serviceLog.carDetails(oToken, (err, carDetails) => {
			let serviceSql = "select ms.carId, ms.id, ms.service, ms.mileage, ms.months, max(s.serviceDate) as last_service_date, max(s.mileage) as last_service_mileage, \
				DATE_ADD(COALESCE(max(s.serviceDate),c.inserviceDate), INTERVAL months  MONTH) as due_by, \
				DATEDIFF(DATE_ADD(COALESCE(max(s.serviceDate),c.inserviceDate), INTERVAL months  MONTH), now()) as  due_in_days, \
				COALESCE(max(s.mileage),0)+ms.mileage-? as due_in_miles \
				from " + CAR_DETAILS_TABLE + " c left join " + SCHEDULE_LOG_TABLE + " ms on c.id=ms.carId left outer join " + SERVICE_LOG_TABLE + " s on s.service=ms.service and \
				s.carId=ms.carId where ms.carId=? \
				group by ms.id, ms.service, ms.mileage, ms.months";
			let upcomingServiceSql = "select * from (" + serviceSql + ") as s where due_in_days<30 or due_in_miles<500 order by due_in_miles";
			executeQuery(upcomingServiceSql, [carDetails.mileage, carId], callback);
		});
	});
  },

  addServiceLog: function(oToken, serviceDate, mileage, service, cost, note, callback) {
   	resolveToken(oToken, (err, carId) => {
	  	var serviceRecord = {carId: carId, serviceDate: serviceDate, mileage: mileage, service: service.trim() }
	  	if (cost && cost != '') {
	  		serviceRecord.cost = cost;
	  	}

	  	if (note) {
	  		serviceRecord.note = note.trim()
	  	}

	    var sqlParams  = serviceRecord;
	    executeQuery("INSERT INTO " + SERVICE_LOG_TABLE + " SET ?", sqlParams, (err, results) => {
	    	if (err) {
	    		callback(err);
	    		return;
	    	}
	    	serviceLog.addMileage(oToken, mileage, () => { 
	    		callback(err, results);
	    	});
	    });
	});
  },

  updateServiceLog: function(oToken, serviceId, serviceDate, mileage, service, cost, note, regularService, monthsInterval, mileageInterval, callback) {
   	resolveToken(oToken, (err, carId) => {
	  	var serviceRecord = {mileage: mileage, serviceDate: serviceDate, service: service.trim(), note:note }
	  	if (cost == undefined || cost != '') {
	  		serviceRecord.cost = cost;
	  	}

	    var sqlParams  = [serviceRecord, serviceId, carId];
	    executeQuery("UPDATE " + SERVICE_LOG_TABLE + " SET ? WHERE id=? AND carId=?", sqlParams, (err, result) => {
	            
	        //add a scheduled service
	       	if (regularService) {
		   		serviceLog.addScheduledService(carId, mileageInterval, monthsInterval, service, callback);
		   	} else {
	       		callback(err, result);
	       	}

	    });
	});
  },

  deleteServiceLog: function(oToken, serviceId, callback) {
   	resolveToken(oToken, (err, carId) => {
	    var sqlParams = [serviceId, carId];
	    executeQuery("DELETE FROM " + SERVICE_LOG_TABLE + " WHERE id = ? AND carId=?", sqlParams, callback);
	});
  },

  addScheduledService: function(oToken, mileageInterval, monthsInterval, service, callback) {
    resolveToken(oToken, (err, carId) => {
	   	var scheduleLog  = {carId: carId, mileage: mileageInterval, months: monthsInterval, service: service};
	    executeQuery("INSERT INTO " + SCHEDULE_LOG_TABLE + " SET ?", scheduleLog, callback);
	});
  },

  addMileage: function(oToken, mileage, callback) {
   	resolveToken(oToken, (err, carId) => {
		var sqlParams = {carId: carId, mileage: mileage};
		var sql = "INSERT INTO " + MILEAGE_LOG_TABLE + " SET ?";
		executeQuery(sql, sqlParams, callback);
	});
  }

}

module.exports = serviceLog;
