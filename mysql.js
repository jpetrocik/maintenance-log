var mysql     =    require('mysql');

var pool      =    mysql.createPool({
    connectionLimit : 100, //important
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'personal',
    debug    :  false,
    insecureAuth: true
});

module.exports = {
  loadCar: function(carId, callback){
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

      connection.query("select * from car where id = " + carId + " order by name desc",function(err,rows){
        connection.release();
        callback(err, rows);
      });

    });

  },
  loadCars: function(callback) {
    
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

      connection.query("select * from car order by name desc",function(err,rows){
        connection.release();
        callback(err, rows);
      });

    });
  },
  getMaintenanceLog:  function(id, callback) {
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

      connection.query("select * from maintenance_log where id=" + id,function(err,rows){
          connection.release();
          callback(err, rows);
      });

    });
  },
  loadMaintenanceLogs: function(carId, callback) {
    
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

      connection.query("select * from maintenance_log where car_id='" + carId + "' order by mileage desc, performed_on desc",function(err,rows){
          connection.release();
          callback(err, rows);
      });

    });
  },
  addMaintenanceLog: function(carId, serviceDate, mileage, service, cost, note, callback) {
    
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

        var post  = {car_id: carId, performed_on: serviceDate.trim(), mileage: mileage.trim(), service: service.trim(), cost: cost.trim(), note:note.trim() };
        connection.query('INSERT INTO maintenance_log SET ?', post, function(err, result) {
          connection.release();
          callback(err, result);
          return;
        });

    });
  },
  updateMaintenanceLog: function(id, serviceDate, mileage, service, cost, note, callback) {
    
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

        var post  = [{mileage: mileage.trim(), service: service.trim(), cost: cost.trim(), note:note.trim() }, id];
        connection.query('UPDATE maintenance_log SET ? WHERE id = ?', post, function(err, result) {
          connection.release();
          callback(err, result);
          return;
        });

    });
  }  

}