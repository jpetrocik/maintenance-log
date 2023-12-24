const config = require('./config.json');
const plivo = require('plivo');

console.log("Creating plivo client");
let client = new plivo.Client(config.plivo.id, config.plivo.token);

module.exports = client;