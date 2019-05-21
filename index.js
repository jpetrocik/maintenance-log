var express = require('express'),
	moment = require('moment'),
	bodyParser = require('body-parser'),
	cookieParser = require('cookie-parser')
	serviceLogs = require('./service_logs.js'),
	invitations = require('./invitations.js'),
	apiRoutes = require('./api.js');


var app = express();

var exphbs = require('express-handlebars');

process.on('uncaughtException', function (err) {
  console.log('Caught exception');
  console.log(err);
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
app.use(cookieParser());

app.use(express.static('static'));

//Import api routes under /api
app.use('/api', apiRoutes);

app.get('/', function (req, res) {
	invitations.validateUser(req, res, (err, uToken) => {
		if (!uToken) {
			res.render('register');
			return;
		}


		res.render('logs');
	});
});

app.get('/authorize', function (req, res) {
	res.render('authorize');
});


app.get('/mobile', function (req, res) {
	invitations.validateUser(req, res, (err, uToken) => {
		if (!uToken) {
			res.render('validateCode');
			return;
		}
		res.render('mobile');
	});

});

app.get('/logs', function (req, res) {
	invitations.resolveInvitation(req.query.iToken, (err, oToken) => {
		if (!oToken) {
			res.sendStatus(401);
			return;
		}

		invitations.validateUser(req, res, (err, uToken) => {
			if (!uToken) {
				res.sendStatus(401);
				return;
			}
			serviceLogs.myGarage(uToken, function(err, cars) {
				serviceLogs.carDetails(oToken, function(err, car) {
					res.render('logs', {car: car, cars: cars});
				});
			});
		});
	});
});

app.get('/mileage', function (req, res) {
	invitations.validateUser(req, res, (err, uToken) => {
		if (!uToken) {
			res.sendStatus(401);
			return;
		}

		res.render('mileage');
	});
});

app.get('/service', function (req, res) {
	invitations.validateUser(req, res, (err, uToken) => {
		if (!uToken) {
			res.sendStatus(401);
			return;
		}	
	  	res.render('service');
	});
});

app.listen(3000, function () {
  console.log('Service Log listening on port 3000!');
});
