
global.SERVICE_LOG_TABLE = "service_history";
global.SCHEDULE_LOG_TABLE = "scheduled_maintenance";
global.MILEAGE_LOG_TABLE = "mileage_log";
global.CAR_DETAILS_TABLE = "my_garage";
global.CAR_INVITATIONS = "invitations";

const serviceDue = require('./serviceDue.sql');
const unreportedMileage = require('./unreportedMileage.sql');

module.exports = { serviceDue, unreportedMileage} ;
