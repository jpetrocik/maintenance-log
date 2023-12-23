const config = require('./config.json');
const mysql = require('mysql');

console.log("Creating mysql connection pool to " + config.database.host)
let _pool = mysql.createPool(config.database);

module.exports = _pool;