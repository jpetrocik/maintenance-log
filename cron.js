var express = require('express'),
    router = express.Router();
const config = require("./config.json");
// const exceptions = require('./exceptions.js');
const plivo = require('./plivo.js');
const pool = require('./mysql');


var executeQuery = function(sqlStatement, sqlParams, callback) {
	// console.log(sqlStatement);
	// console.log(sqlParams);
    pool.query(sqlStatement, sqlParams, (error, results, fields) => {
    	if (error)
    		console.log(error);
		callback(error, results);
    });
};


/**
 * Registers user with a new car
 */
 let sql = 'select my_garage.id, my_garage.name as car,  user_accounts.phone as phone, datediff(now(),max(mileage_log.created_date)) as last_reported from  mileage_log join my_garage on mileage_log.carId = my_garage.id join invitations on invitations.oToken = my_garage.token join user_accounts on invitations.uToken =  user_accounts.uToken where my_garage.status=\'ACTIVE\' and invitations.role=10 group by my_garage.id, user_accounts.phone, my_garage.name having last_reported > ?'

router.get('/unreported', function (req, res) {
	executeQuery(sql, [30], (err, results) => {

		if (err)
			console.log(err);

		Object.keys(results).forEach(function(row) {
	      	var fields = results[row];
			//send sms message
			if (config.plivo.enabled) {
				if (fields['phone']) {
					plivo.messages.create(
						config.plivo.phone,
						fields['phone'],
						'You have not report mileage for your ' + fields['car'] + ' in over ' + fields['last_reported'] + ' days. Follow link to report mileage\n\nh' + config.host + '/mileage'
					).then(function(message_created) {

					});
				}
			} else {
				console.log('You have not report mileage for ' + fields['car'] + ' in over ' + fields['last_reported'] + ' days.  Follow link to report mileage\n\nhttps://cars.petrocik.net/mileage');
			}
		});

		res.sendStatus(200);


	});
});

module.exports = router;
