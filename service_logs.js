var mysql     =    require('mysql');

var pool      =    mysql.createPool({
    connectionLimit : 10, //important
    host     : 'hermes.petrocik.net',
    user     : 'john',
    password : 'oropez',
    database : 'test',
    debug    :  false,
    insecureAuth: true
});

var SERVICE_LOG_TABLE = "service_log";
var SCHEDULE_LOG_TABLE = "maintenance_schedule";
var MILEAGE_LOG_TABLE = "mileage_log";
var CAR_DETAILS_TABLE = "car";

var executeQuery = function(sqlStatement, sqlParams, callback) {
    pool.query(sqlStatement, sqlParams, (error, results, fields) => {
		callback(error, results);
    });
};

var serviceLog = {
  myGarage: function(callback) {
    executeQuery("select id, name from " + CAR_DETAILS_TABLE + " where status='ACTIVE' order by year desc, make asc, model asc, id desc", callback);
  },

  carDetails: function(carId, callback) {
	executeQuery("select c.*, max(mileage) as mileage, DATEDIFF(now(), max(created_date)) as mileage_reported_days from " + CAR_DETAILS_TABLE + " c JOIN " + MILEAGE_LOG_TABLE + " m ON c.id=m.carId where c.id=?",
		[carId], (err, results) => {callback(err, results[0])});
  },

  completeServiceLog:  function(carId, callback) {
	executeQuery("select * from " + SERVICE_LOG_TABLE + " where carId=? order by mileage asc, serviceDate asc", [carId], callback);
  },

  serviceLog:  function(id, callback) {
	executeQuery("select * from " + SERVICE_LOG_TABLE + " where id=?", [id], callback);
  },

  serviceDue: function(carId, callback) {
	serviceLog.carDetails(carId, (err, carDetails) => {
		let serviceSql = "select ms.carId, ms.id, ms.service, ms.mileage, ms.months, max(s.serviceDate) as last_service_date, max(s.mileage) as last_service_mileage, DATE_ADD(max(s.serviceDate), \
			INTERVAL months  MONTH) as due_by, DATEDIFF(DATE_ADD(max(s.serviceDate), INTERVAL months  MONTH), now()) as  due_in_days, \
			max(s.mileage)+ms.mileage-? as due_in_miles from " + SCHEDULE_LOG_TABLE + " ms left join " + SERVICE_LOG_TABLE + " s on s.service=ms.service and s.carId=ms.carId where ms.carId=? \
			group by ms.id, ms.service, ms.mileage, ms.months";
		let upcomingServiceSql = "select * from (" + serviceSql + ") as s where due_in_days<30 or due_in_miles<500";
		executeQuery(upcomingServiceSql, [carDetails.mileage, carId], callback);
	});
  },

  addServiceLog: function(carId, serviceDate, mileage, service, cost, note, callback) {
    var sqlParams  = {carId: carId, serviceDate: serviceDate, mileage: mileage, service: service.trim(), cost: cost, note:note.trim() };
    executeQuery("INSERT INTO " + SERVICE_LOG_TABLE + " SET ?", sqlParams, callback);
  },

  updateServiceLog: function(carId, serviceId, serviceDate, mileage, service, cost, note, regularService, monthsInterval, mileageInterval, callback) {
    var sqlParams  = [{mileage: mileage, serviceDate: serviceDate, service: service.trim(), cost: cost, note:note }, serviceId];
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
