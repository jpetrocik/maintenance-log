var express = require('express'),
	mysql = require('./mysql.js'),
	moment = require('moment');

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



app.use('/css', express.static('css'));
app.get('/', function (req, res) {
	mysql.loadMaintenanceLogs(req, function(err, rows){
	  res.render('log', {logs: rows});
	});
});

app.get('/api/logs', function (req, res) {
	mysql.loadMaintenanceLogs(req,function(err, rows){
		res.json(rows);
	});
});

app.get('/api/addLog', function (req, res) {
	mysql.addMaintenanceLog(req.query.serviceDate, req.query.mileage, req.query.service, req.query.cost, req.query.note,
		function(err, result){
			console.log(err);
			console.log(result);
			res.status(200).json({ "id": result.insertId }).end()
	});
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
