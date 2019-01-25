var express = require('express'),
    router = express.Router();

/**
 * Registers user with a new car
 */
router.post('/register', function (req, res) {
	invitations.register(req.body.email, function(err, aToken){
		if (err) {
			if (err.code === 'ER_DUP_ENTRY') {
				res.sendStatus(400);
				return;
			}
			res.sendStatus(500);
			return;
		}

		res.cookie('_aToken',aToken, { maxAge: (90 * 24 * 60 * 60)});
		res.sendStatus('200');
	});
});

router.post('/sendAuth', function (req, res) {
	invitations.sendAuth(req.body.email, function(err){
		res.sendStatus('200');
	});
});

router.get('/validate', function (req, res) {
	invitations.validateUser(req, res, (err, uToken) => {
		if (!uToken) {
			res.sendStatus(401);
			return;
		}

		invitations.createValidationCode(uToken, (err, validationCode) => {
			res.json({validationCode: validationCode });
		});
	});
});

router.post('/validate', function (req, res) {
	invitations.validateCode(req.body.validationCode, (err, uToken) => {
		invitations.loginUser(uToken, res, (err, result) => {
			if (!result) {
				res.sendStatus(401);
				return;
			}

			res.sendStatus(200);
		});
	});
});

router.post('/car', function(req, res) {
	invitations.validateUser(req, res, (err, uToken) => {
		if (!uToken) {
			res.sendStatus(401);
			return;
		}

		serviceLogs.addCar(req.body, (err, car) => {
			invitations.createInvitation( uToken, car, (err, iToken) => {
				res.json({token: iToken, name: car.name});			
			});
		});
	});

});

/**
 * Returns list of all car
 */
router.get('/car', function (req, res) {
	invitations.validateUser(req, res, (err, uToken) => {
		if (!uToken) {
			res.sendStatus(401);
			return;
		}

		serviceLogs.myGarage(uToken, function(err, rows){
			res.json(rows);
		});
	});
});

/**
 * Returns the car details
 */
router.get('/car/:iToken', function (req, res) {
	invitations.resolveInvitation(req.params.iToken, (err, carId) => {
		if (!carId) {
			res.sendStatus(401);
			return;
		}
		serviceLogs.carDetails(carId, function(err, rows){
			rows.token = req.params.iToken;
			res.json(rows);
		});
	});
});

/**
 * Returns the service history for a car
 */
router.get('/car/:iToken/service', function (req, res) {
	invitations.resolveInvitation(req.params.iToken, (err, carId) => {
		if (!carId) {
			res.sendStatus(401);
			return;
		}

		serviceLogs.completeServiceLog(carId, function(err, rows){
			res.json(rows);
		});
	});
});

/**
 * Returns a particular service log
 */
router.get('/car/:iToken/service/:serviceId', function (req, res) {
	invitations.resolveInvitation(req.params.iToken, (err, carId) => {
		if (!carId) {
			res.sendStatus(401);
			return;
		}
		serviceLogs.serviceLog(carId, req.params.serviceId, function(err, rows){
			res.json(rows);
		});
	});
});

/**
 * Add service log entry
 */
router.post('/car/:iToken/service', function (req, res) {
	invitations.resolveInvitation(req.params.iToken, (err, carId) => {
		if (!carId) {
			res.sendStatus(401);
			return;
		}

		serviceLogs.addServiceLog(carId, req.body.serviceDate, req.body.mileage, req.body.service, req.body.cost, req.body.note,
			function(err, result){
				if (err) {
					res.status(500).json(err).end()
				} else {
					res.status(200).json({ "id": result.insertId }).end()
				}
		});
	});
});

/**
 * Updates service log entry
 */
router.put('/car/:iToken/service/:serviceId', function (req, res) {
	invitations.resolveInvitation(req.params.iToken, (err, carId) => {
		if (!carId) {
			res.sendStatus(401);
			return;
		}

		serviceLogs.updateServiceLog(carId, req.params.serviceId, req.body.serviceDate, req.body.mileage, req.body.service, req.body.cost, req.body.note, req.body.regularService, req.body.monthsInterval, req.body.mileageInterval,
			function(err, result){
				if (err) {
					res.status(500).json(err).end()
				} else {
					res.status(200).json({ "id": req.params.serviceId }).end()
				}
		});
	});
});

/**
 * Deletes service log entry
 */
router.delete('/car/:iToken/service/:serviceId', function (req, res) {
	invitations.resolveInvitation(req.params.iToken, (err, carId) => {
		if (!carId) {
			res.sendStatus(401);
			return;
		}

		serviceLogs.deleteServiceLog(carId, req.params.serviceId,
			function(err, result){
				if (err) {
					res.status(500).json(err).end()
				} else {
					res.status(200).json({ "id": req.params.serviceId }).end()
				}
		});
	});
});


/**
 * Adds a mileage log
 */
router.put('/car/:iToken/mileage/:mileage', function (req, res) {
	invitations.resolveInvitation(req.params.iToken, (err, carId) => {
		if (!carId) {
			res.sendStatus(401);
			return;
		}

		serviceLogs.addMileage(carId, req.params.mileage, (err, result) => {
			if (err) {
				res.status(500).json(err).end()
			} else {
				serviceLogs.serviceDue(carId, (err, result) => {
					res.json(result);
				});
			}
		});
	});
});

/**
 * Get upcoming/needed service
 */
router.get('/car/:iToken/schedule', function (req, res) {
	invitations.resolveInvitation(req.params.iToken, (err, carId) => {
		if (!carId) {
			res.sendStatus(401);
			return;
		}

		serviceLogs.serviceDue(carId, (err, result) => {
			res.json(result);
		});
	});
});

module.exports = router;
