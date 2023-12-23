var express = require('express'),
	bodyParser = require('body-parser'),
	cookieParser = require('cookie-parser')
	serviceLogs = require('./service_logs.js'),
	invitations = require('./invitations.js'),
	apiRoutes = require('./api.js');
	cronRoutes = require('./cron.js');


var app = express();

process.on('uncaughtException', function (err) {
  console.log('Caught exception');
  console.log(err);
});


//disble layouts
app.locals.layout = false;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

//Import api routes under /api
app.use('/api', apiRoutes);
app.use('/cron', cronRoutes);

app.listen(3000, function () {
  console.log('Service Log listening on port 3000!');
});
