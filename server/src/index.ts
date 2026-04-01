// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

import express, { Express, Request, Response } from 'express';
import bodyParser  from 'body-parser';
import { apiRoutes } from './api';
import cookieParser  from 'cookie-parser';
import path from 'path';
import { cronService } from './cron';
import fs from 'fs';


const app = express();

app.get('/firebase-messaging-sw.js', (req, res) => {
    try {
        const templatePath = path.join(__dirname, '../../www/src/firebase-messaging-sw.template.js');
        const template = fs.readFileSync(templatePath, 'utf8');

        const firebaseConfig = {
            apiKey: process.env.FIREBASE_API_KEY,
            authDomain: process.env.FIREBASE_AUTH_DOMAIN,
            projectId: process.env.FIREBASE_PROJECT_ID,
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.FIREBASE_APP_ID,
            measurementId: process.env.FIREBASE_MEASUREMENT_ID
        };

        const renderedScript = template.replace('__FIREBASE_CONFIG__', JSON.stringify(firebaseConfig));

        res.setHeader('Content-Type', 'application/javascript');
        res.send(renderedScript);
    } catch (error) {
        console.error('Error serving dynamic firebase-messaging-sw.js:', error);
        res.status(500).send('Error generating service worker.');
    }
});



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

// Start the scheduler
cronService.startCronJobs();

// //run on startup
// setTimeout(() => {
// 	console.log('Running initial unreported mileage check on startup.');
// 	cronService.unreportedMileage();
// }, 5000); // Delay initial run by 5 seconds to allow server to start up	