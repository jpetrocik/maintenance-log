var mysql     =    require('mysql');

var pool      =    mysql.createPool({
    connectionLimit : 10, //important
    host     : 'localhost',
    user     : '',
    password : '',
    database : 'personal',
    debug    :  false,
    insecureAuth: true
});

var SERVICE_LOG_TABLE = "maintenance_log";
var SCHEDULE_LOG_TABLE = "service_log";
var MILEAGE_LOG_TABLE = "mileage_log";
var CAR_TABLE = "car";


module.exports = {
  allCars: function(callback) {
    
    pool.getConnection(function(err,connection){
      if (err) {
        connection.release();
        callback(err);
        return;
      }   

      connection.on('error', function(err) {      
        callback(err);
        return;     
      });

      connection.query("select * from " + CAR_TABLE + " where status='ACTIVE' order by year, make, model, id, desc",function(err,rows){
        connection.release();
        callback(err, rows);
      });

    });
  },

  car: function(carId, callback) {
    
    pool.getConnection(function(err,connection){
		if (err) {
			connection.release();
			callback(err);
		}   

		connection.on('error', function(err) {      
			callback(err);
		});

		var sqlParams = [carId];
		connection.query("select * from " + CAR_TABLE + " where id=?", sqlParams, function(err,rows){
			connection.release();
			callback(err, rows);
		});

    });
  },

  serviceLog:  function(carId, callback) {
    pool.getConnection(function(err,connection){
		if (err) {
			connection.release();
			callback(err);
		}   

		connection.on('error', function(err) {      
			callback(err);
		});

		var sqlParams = [carId];
		connection.query("select * from " + SERVICE_LOG_TABLE + " where id=?", sqlParams, function(err,rows){
			connection.release();
			callback(err, rows);
		});

    });
  },

  allServiceLogs: function(carId, callback) {
    
    pool.getConnection(function(err,connection){
      if (err) {
        connection.release();
        callback(err);
        return;
      }   

      connection.on('error', function(err) {      
        callback(err);
        return;     
      });

		var sqlParams = [carId];
      connection.query("select * from " + SERVICE_LOG_TABLE + " where carId=? order by mileage asc, serviceDate asc", sqlParams, function(err,rows){
          connection.release();
          callback(err, rows);
      });

    });
  },

  addServiceLog: function(carId, serviceDate, mileage, service, cost, note, callback) {
    
    pool.getConnection(function(err,connection){
        if (err) {
          connection.release();
          callback(err);
          return;
        }   

        connection.on('error', function(err) {  
          callback;
          return;     
        });

        var sqlParams  = {carId: carId, serviceDate: serviceDate, mileage: mileage, service: service.trim(), cost: cost, note:note.trim() };
        connection.query("INSERT INTO " + SERVICE_LOG_TABLE + " SET ?", sqlParams, function(err, result) {
          connection.release();
          callback(err, result);
          return;
        });

    });
  },

  updateServiceLog: function(carId, serviceId, serviceDate, mileage, service, cost, note, regularService, monthsInterval, mileageInterval, callback) {
    
    pool.getConnection(function(err,connection){
        if (err) {
          connection.release();
          callback(err);
        }   

        connection.on('error', function(err) {  
          callback;
        });

        var sqlParams  = [{mileage: mileage, serviceDate: serviceDate, service: service.trim(), cost: cost, note:note }, serviceId];
        connection.query("UPDATE " + SERVICE_LOG_TABLE + " SET ? WHERE id = ?", sqlParams, function(err, result) {
            connection.release();

            //add a scheduled service
	       	if (regularService === "yes") {
    	   		module.exports.addScheduledService(carId, mileageInterval, monthsInterval, service, callback);
    	   	} else {
           		callback(err, result);
           	}

        });

    });
  } ,

  deleteServiceLog: function(carId, serviceId, callback) {
    
    pool.getConnection(function(err,connection){
        if (err) {
          connection.release();
          callback(err);
        }   

        connection.on('error', function(err) {  
          callback;
        });

        var sqlParams = [serviceId];
        connection.query("DELETE FROM " + SERVICE_LOG_TABLE + " WHERE id = ?", sqlParams, function(err, result) {
            connection.release();
       		callback(err, result);
        });

    });
  } ,

  addScheduledService: function(carId, mileageInterval, monthsInterval, service, callback) {
    pool.getConnection(function(err,connection){
        if (err) {
          connection.release();
          callback(err);
        }   

        connection.on('error', function(err) {  
          callback;
        });

	    var scheduleLog  = {carId: carId, mileage: mileageInterval, months: monthsInterval, service: service};
	    connection.query("INSERT INTO " + SCHEDULE_LOG_TABLE + " SET ?", scheduleLog, function(err, result) {
	    	connection.release();
	      	callback(err, result);
	    });
	});
  },

  addMileage: function(carId, mileage, callback) {
    
    pool.getConnection(function(err,connection){
      if (err) {
        connection.release();
        callback(err);
      }   

      connection.on('error', function(err) {      
        callback(err);
      });

      var mileageLog = {carId: carId, mileage: mileage};

      connection.query("INSERT INTO mileage_log SET ?", mileageLog, function(err,rows){
        connection.release();
        callback(err, rows);
      });

    });
  },


}
