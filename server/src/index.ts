import express, { Express, Request, Response } from 'express'
import bodyParser  from 'body-parser';
import { apiRoutes } from './api';
import cookieParser  from 'cookie-parser';
// import cronRoutes from './cron';

// var moment = require('moment'),
// 	cookieParser = require('cookie-parser')
// 	apiRoutes = require('./api.js');
// 	cronRoutes = require('./cron.js');


const app = express();


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
// app.use('/cron', cronRoutes);

app.listen(3000, function () {
  console.log('Service Log listening on port 3000!');
});
