var mysql     =    require('mysql');

var config = require("./config.json");

var pool = mysql.createPool(config.database);

var SERVICE_LOG_TABLE = "service_history";
var SCHEDULE_LOG_TABLE = "scheduled_maintenance";
var MILEAGE_LOG_TABLE = "mileage_log";
var CAR_DETAILS_TABLE = "car";
var CAR_INVITATIONS = "CAR_INVITATIONS";

var executeQuery = function(sqlStatement, sqlParams, callback) {
    console.log(sqlStatement);
    pool.query(sqlStatement, sqlParams, (error, results, fields) => {
    	if (error)
    		console.log(error);
		callback(error, results);
    });
};

//cut & pasted, make statically available
var tokenGenerator = function(tokenSize) {
	let token = "";
	for (i=0; i < tokenSize ; i++) {
		let base = Math.floor(Math.random() * 62)
	if (base > 51 )
		token += (base - 52)
	else if (base > 25 )
		token += String.fromCharCode(39  + base);
	else
		token +=  String.fromCharCode(97 + base);
	}
	return token;
}

var serviceLog = {
  myGarage: function(utoken, callback) {
    executeQuery("select INVITATION_TOKEN as token, name from " + CAR_DETAILS_TABLE + " c left join " + CAR_INVITATIONS + " i ON c.token=i.object_token \
    	where c.status='ACTIVE' and i.user_token=? \
     	order by c.year desc, c.make asc, c.model asc, c.id desc", [utoken], callback);
  },

  addCar: function(make, model, trim, year, inserviceDate, callback) {
  	let token = tokenGenerator(25);
  	let name = "'" + year.substring(2) + " " + make + " " + model;
  	let car  = {token: token, name: name, make: make, model: model, trim: trim, year: year, inserviceDate: inserviceDate, status: "ACTIVE"};
    executeQuery("insert into " + CAR_DETAILS_TABLE + " set ?" , car, (err, results) => { callback(err, token) });
  },

  carDetails: function(oToken, callback) {
	executeQuery("select c.*, max(mileage) as mileage, DATEDIFF(now(), max(created_date)) as mileage_reported_days \
		from " + CAR_DETAILS_TABLE + " c  LEFT JOIN " + MILEAGE_LOG_TABLE + " m ON c.id=m.carId \
		where c.token=? group by c.id",
		[oToken], (err, results) => {callback(err, results[0])});
  },

  completeServiceLog:  function(oToken, callback) {
	executeQuery("select * from " + CAR_DETAILS_TABLE + " c join " + SERVICE_LOG_TABLE + " s on c.id=s.carId where c.token=? order by mileage asc, serviceDate asc", [oToken], callback);
  },

  serviceLog:  function(id, callback) {
	executeQuery("select * from " + SERVICE_LOG_TABLE + " where id=?", [id], callback);
  },

  serviceDue: function(carId, callback) {
	serviceLog.carDetails(carId, (err, carDetails) => {
		let serviceSql = "select ms.carId, ms.id, ms.service, ms.mileage, ms.months, max(s.serviceDate) as last_service_date, max(s.mileage) as last_service_mileage, \
			DATE_ADD(COALESCE(max(s.serviceDate),c.inserviceDate), INTERVAL months  MONTH) as due_by, \
			DATEDIFF(DATE_ADD(COALESCE(max(s.serviceDate),c.inserviceDate), INTERVAL months  MONTH), now()) as  due_in_days, \
			COALESCE(max(s.mileage),ms.mileage)+ms.mileage-? as due_in_miles \
			from car c left join " + SCHEDULE_LOG_TABLE + " ms on c.id=ms.carId left outer join " + SERVICE_LOG_TABLE + " s on s.service=ms.service and s.carId=ms.carId where ms.carId=? \
			group by ms.id, ms.service, ms.mileage, ms.months";
		let upcomingServiceSql = "select * from (" + serviceSql + ") as s where due_in_days<30 or due_in_miles<500";
		executeQuery(upcomingServiceSql, [carDetails.mileage, carId], callback);
	});
  },

  addServiceLog: function(carId, serviceDate, mileage, service, cost, note, callback) {
  	var serviceLog = {carId: carId, serviceDate: serviceDate, mileage: mileage, service: service.trim(), note:note.trim() }
  	if (cost != '') {
  		serviceLog.cost = cost;
  	}

  	console.log(serviceLog);
    var sqlParams  = serviceLog;
    executeQuery("INSERT INTO " + SERVICE_LOG_TABLE + " SET ?", sqlParams, callback);
  },

  updateServiceLog: function(carId, serviceId, serviceDate, mileage, service, cost, note, regularService, monthsInterval, mileageInterval, callback) {
  	var serviceLog = {mileage: mileage, serviceDate: serviceDate, service: service.trim(), cost: cost, note:note }
    var sqlParams  = [serviceLog, serviceId];
    executeQuery("UPDATE " + SERVICE_LOG_TABLE + " SET ? WHERE id = ?", sqlParams, (err, result) => {
            
        //add a scheduled service
       	if (regularService === "yes") {
	   		serviceLog.addScheduledService(carId, mileageInterval, monthsInterval, service, callback);
	   	} else {
       		callback(err, result);
       	}

    });
  } ,

  deleteServiceLog: function(carId, serviceId, callback) {
    var sqlParams = [serviceId];
    executeQuery("DELETE FROM " + SERVICE_LOG_TABLE + " WHERE id = ?", sqlParams, callback);
  } ,

  addScheduledService: function(carId, mileageInterval, monthsInterval, service, callback) {
    var scheduleLog  = {carId: carId, mileage: mileageInterval, months: monthsInterval, service: service};
    executeQuery("INSERT INTO " + SCHEDULE_LOG_TABLE + " SET ?", scheduleLog, callback);
  },

  addMileage: function(carId, mileage, callback) {
      var sqlParams = {carId: carId, mileage: mileage};
      var sql = "INSERT INTO " + MILEAGE_LOG_TABLE + " SET ?";
      executeQuery(sql, sqlParams, callback);
  }

}

module.exports = serviceLog;
