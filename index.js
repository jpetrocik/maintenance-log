var express = require('express'),
	moment = require('moment'),
	bodyParser = require('body-parser'),
	serviceLogs = require('./service_logs.js');


var app = express();
 
var exphbs = require('express-handlebars');

process.on('uncaughtException', function (err) {
  console.log('Caught exception: ' + err);
});

app.engine('.hbs', exphbs({extname: '.hbs', 
	helpers: {
        formatDate: function (date, format) {
            return moment(date).format(format);
        }
    }
}));


app.set('view engine', '.hbs');
app.set('views', './views');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/css', express.static('css'));
app.use('/images', express.static('images'));
app.use('/scripts', express.static('scripts'));

app.get('/', function (req, res) {
	serviceLogs.myGarage(function(err, cars) {
		serviceLogs.carDetails(1, function(err, car) {
			serviceLogs.completeServiceLog(1, function(err, logs){
			  res.render('logs', {car: car, logs: logs, cars: cars});
			});
		});
	});
});

app.get('/logs', function (req, res) {
	serviceLogs.myGarage(function(err, cars) {
		serviceLogs.carDetails(req.query.carId, function(err, car) {
			serviceLogs.completeServiceLog(req.query.carId, function(err, logs){
			  res.render('logs', {car: car, logs: logs, cars: cars});
			});
		});
	});
});

app.get('/mileage', function (req, res) {
	serviceLogs.myGarage(function(err, cars) {
	  res.render('mileage', {cars: cars});
	});
});



/**
 * Returns list of all car
 */
app.get('/api/car/', function (req, res) {
	serviceLogs.myGarage(function(err, rows){
		res.json(rows);
	});
});

/**
 * Returns the car details
 */
app.get('/api/car/:carId', function (req, res) {
	serviceLogs.carDetails(req.params.carId, function(err, rows){
		res.json(rows);
	});
});

/**
 * Returns the service history for a car
 */
app.get('/api/car/:carId/service', function (req, res) {
	serviceLogs.completeServiceLog(req.params.carId, function(err, rows){
		res.json(rows);
	});
});

/**
 * Returns a particular service log
 */
app.get('/api/car/:carId/service/:serviceId', function (req, res) {
	serviceLogs.serviceLog(req.params.serviceId, function(err, rows){
		res.json(rows);
	});
});

/**
 * Add service log entry
 */
app.post('/api/car/:carId/service/', function (req, res) {
	serviceLogs.addServiceLog(req.params.carId, req.body.serviceDate, req.body.mileage, req.body.service, req.body.cost, req.body.note,
		function(err, result){
			if (err) {
				res.status(500).json(err).end()
			} else {
				res.status(200).json({ "id": result.insertId }).end()
			}
	});
});

/**
 * Updates service log entry
 */
app.put('/api/car/:carId/service/:serviceId', function (req, res) {
	serviceLogs.updateServiceLog(req.params.carId, req.params.serviceId, req.body.serviceDate, req.body.mileage, req.body.service, req.body.cost, req.body.note, req.body.regularService, req.body.monthsInterval, req.body.mileageInterval,
		function(err, result){
			if (err) {
				res.status(500).json(err).end()
			} else {
				res.status(200).json({ "id": req.params.serviceId }).end()
			}
	});
});

/**
 * Deletes service log entry
 */
app.delete('/api/car/:carId/service/:serviceId', function (req, res) {
	serviceLogs.deleteServiceLog(req.params.carId, req.params.serviceId,
		function(err, result){
			if (err) {
				res.status(500).json(err).end()
			} else {
				res.status(200).json({ "id": req.params.serviceId }).end()
			}
	});
});


/**
 * Adds a mileage log
 */
app.put('/api/car/:carId/mileage/:mileage', function (req, res) {
	serviceLogs.addMileage(req.params.carId, req.params.mileage, 
		function(err, result){
			if (err) {
				res.status(500).json(err).end()
			} else {
				serviceLogs.serviceDue(req.params.carId, req.params.mileage, (err, result) => {
					res.json(result);
				});
			}
	});
});

/**
 * Get upcoming/needed service
 */
app.get('/api/car/:carId/schedule/', function (req, res) {
	serviceLogs.serviceDue(req.params.carId, (err, result) => {
		res.json(result);
	});
});

app.listen(3000, function () {
  console.log('Service Log listening on port 3000!');
});
