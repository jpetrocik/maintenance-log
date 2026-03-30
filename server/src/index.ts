import express, { Express, Request, Response } from 'express';
import bodyParser  from 'body-parser';
import { apiRoutes } from './api';
import cookieParser  from 'cookie-parser';
import path from 'path';
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

// Serve static files from the Angular app
app.use(express.static(path.join(__dirname, '../../www/dist/maintenance-log/browser')));

//Import api routes under /api
app.use('/api', apiRoutes);
// app.use('/cron', cronRoutes);

// For all other routes, serve the Angular app's index.html
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../../www/dist/maintenance-log/browser/index.html'));
});

app.listen(3000, function () {
  console.log('Service Log listening on port 3000!');
});
