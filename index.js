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
	mysql.loadCars(function(err, cars) {
		mysql.loadCar(1, function(err, car) {
			mysql.loadMaintenanceLogs(1, function(err, logs){
			  res.render('logs', {car: car[0], logs: logs, cars: cars});
			});
		});
	});
});

app.get('/logs', function (req, res) {
	mysql.loadCars(function(err, cars) {
		mysql.loadCar(req.query.carId, function(err, car) {
			mysql.loadMaintenanceLogs(req.query.carId, function(err, logs){
			  res.render('logs', {car: car[0], logs: logs, cars: cars});
			});
		});
	});
});

app.get('/api/car/:carId/logs', function (req, res) {
	mysql.loadMaintenanceLogs(req.params.carId, function(err, rows){
		res.json(rows);
	});
});

app.get('/api/car/:carId/logs/:id', function (req, res) {
	mysql.getMaintenanceLog(req.query.maintenanceId, function(err, rows){
		res.json(rows);
	});
});

app.post('/api/car/:carId/logs/', function (req, res) {
	mysql.addMaintenanceLog(req.body.carId, req.body.serviceDate, req.body.mileage, req.body.service, req.body.cost, req.body.note,
		function(err, result){
			res.status(200).json({ "id": result.insertId }).end()
	});
});

app.put('/api/car/:carId/logs/:id', function (req, res) {
	console.log(req.body);
	mysql.updateMaintenanceLog(req.query.carId, req.body.id, req.body.serviceDate, req.body.mileage, req.body.service, req.body.cost, req.body.note, req.query.regularService, req.query.monthsInterval, req.query.mileageInterval,
		function(err, result){
			res.status(200).json({ "id": req.query.id }).end()
	});
});


app.listen(3000, function () {
  console.log('MaintenanceLog listening on port 3000!');
});
