var express = require('express'),
	mysql = require('./mysql.js'),
	moment = require('moment'),
	bodyParser = require('body-parser');

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
	mysql.allCars(function(err, cars) {
		mysql.car(1, function(err, car) {
			mysql.allServiceLogs(1, function(err, logs){
			  res.render('logs', {car: car[0], logs: logs, cars: cars});
			});
		});
	});
});

app.get('/logs', function (req, res) {
	mysql.allCars(function(err, cars) {
		mysql.car(req.query.carId, function(err, car) {
			mysql.allServiceLogs(req.query.carId, function(err, logs){
			  res.render('logs', {car: car[0], logs: logs, cars: cars});
			});
		});
	});
});

app.get('/mileage', function (req, res) {
	mysql.allCars(function(err, cars) {
	  res.render('mileage', {cars: cars});
	});
});


/**
 * Returns the car details
 */
app.get('/api/car/:carId', function (req, res) {
	mysql.car(req.params.carId, function(err, rows){
		res.json(rows);
	});
});

/**
 * Returns the service history for a car
 */
app.get('/api/car/:carId/service', function (req, res) {
	mysql.allServiceLogs(req.params.carId, function(err, rows){
		res.json(rows);
	});
});

/**
 * Adds a mileage log
 */
app.put('/api/car/:carId/mileage/:mileage', function (req, res) {
	mysql.addMileage(req.params.carId, req.params.mileage, 
		function(err, result){
			if (err) {
				res.status(500).json(err).end()
			} else {
				res.json({ "id": result.insertId });
			}
	});
});

/**
 * Returns a particular service log
 */
app.get('/api/car/:carId/service/:serviceId', function (req, res) {
	mysql.serviceLog(req.params.serviceId, function(err, rows){
		res.json(rows);
	});
});

/**
 * Add service log entry
 */
app.post('/api/car/:carId/service/', function (req, res) {
	mysql.addServiceLog(req.params.carId, req.body.serviceDate, req.body.mileage, req.body.service, req.body.cost, req.body.note,
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
	mysql.updateServiceLog(req.params.carId, req.params.serviceId, req.body.serviceDate, req.body.mileage, req.body.service, req.body.cost, req.body.note, req.body.regularService, req.body.monthsInterval, req.body.mileageInterval,
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
	mysql.deleteServiceLog(req.params.carId, req.params.serviceId,
		function(err, result){
			if (err) {
				res.status(500).json(err).end()
			} else {
				res.status(200).json({ "id": req.params.serviceId }).end()
			}
	});
});


app.listen(3000, function () {
  console.log('Service Log listening on port 3000!');
});
