import { Router, Request, Response } from 'express';
import {invitationService} from './invitation.service'
import {accountService, Account} from './acount.service'
import {ServiceRecord, garageService} from './garage.service'

const apiRoutes = Router();
// var express = require('express'),
//     router = router();
// const config = require("./config.json");
// const exceptions = require('./exceptions.js');
// const plivo = require('./plivo.js');

async function validateUser(request: Request, response: Response): Promise<Account|undefined> {
	let authToken = request.query.authToken;
	if (authToken === undefined) {
		authToken = request.cookies._authToken;
		if (authToken === undefined) {
			return undefined;
		}
	}

	const account = await accountService.lookupUserByAuthToken(authToken);
	if (!account) {
		return undefined;
	}

	response.cookie('_authToken', authToken, { maxAge: (90 * 24 * 60 * 60 * 1000) });

	return account;
}


apiRoutes.head('/', async (request: Request, response: Response) => {
	const account = await validateUser(request, response);
	if (!account) {
		response.sendStatus(401);
		return;
	}

	response.sendStatus(200);
});

/**
 * Registers user with a new car
 */
apiRoutes.post('/register', async (request: Request, response: Response) => {
	const authToken = accountService.register(request.body.email, request.body.phone);
	if (!authToken) {
		response.sendStatus(400);
		return;
	}

	response.cookie('_authToken', authToken, { maxAge: (90 * 24 * 60 * 60)});
	response.sendStatus(200);
});

apiRoutes.get('/login', async (request: Request, response: Response) => {
	let email = request.query.email as string;
	let authToken = request.query.authToken as string;
	if (!email || !authToken) {
		response.sendStatus(401);
		return;
	}

	let userToken = await accountService.login(email, authToken);
	if (!userToken) {
		response.sendStatus(401);
		return;
	}
	response.cookie('_authToken', authToken, { maxAge: (90 * 24 * 60 * 60)});
	response.sendStatus(204);
});

apiRoutes.get('/sendAuth', async (request: Request, response: Response) => {
	await accountService.sendAuthToken(request.query.email);
	response.sendStatus(204);
});

apiRoutes.get('/mfa', async(request: Request, response: Response) => {
	let account: Account|undefined;
	if (request.query.phone) {
		account = await accountService.lookupUserByPhone(request.query.phone);
	} else if (request.query.email) {
		account = await accountService.lookupUserByPhone(request.query.phone);
	}

	if (!account)
		response.sendStatus(400);

	let token = await accountService.generateValidationCode(request.query.phone);

	response.json(token);
});

apiRoutes.post('/mfa', async (request: Request, response: Response) => {
	let userToken = await accountService.validateValidationCode(request.body.token, request.body.code);
	if (!userToken) {
		response.sendStatus(401);
		return;
	}

	let account = await accountService.lookupUserByUserToken(userToken);
	if (!account) {
		response.sendStatus(401);
		return;
	}

	response.cookie('_authToken', account.authToken, { maxAge: (90 * 24 * 60 * 60 * 1000) });
});


apiRoutes.post('/car', async (request: Request, response: Response) => {
	const account = await validateUser(request, response);
	if (!account) {
		response.sendStatus(401);
		return;
	}

	let newCar = await garageService.addCar(request.body);
	let invitationToken = await invitationService.createInvitation( account.userToken, newCar.token);
	response.json({token: invitationToken, name: newCar.name});			
});

apiRoutes.get('/car', async (request: Request, response: Response) => {
	const account = await validateUser(request, response);
	if (!account) {
		response.sendStatus(401);
		return;
	}

	let garage = await garageService.myGarage(account.userToken);
	response.json(garage);
});

apiRoutes.get('/car/:iToken', async (request: Request, response: Response) => {
	const account = await validateUser(request, response);
	if (!account) {
		response.sendStatus(401);
		return;
	}

	let objectToken = await invitationService.resolveInvitation(request.params.iToken);
	if (!objectToken) {
		response.sendStatus(401);
		return;
	}

	let car = await garageService.carDetails(objectToken);
	response.json(car);
});

apiRoutes.get('/car/:iToken/service', async (request: Request, response: Response) => {
	const account = await validateUser(request, response);
	if (!account) {
		response.sendStatus(401);
		return;
	}

	let objectToken = await invitationService.resolveInvitation(request.params.iToken);
	if (!objectToken) {
		response.sendStatus(401);
		return;
	}

	let allServiceRecords = garageService.completeServiceLog(objectToken);
	response.json(allServiceRecords);
});

apiRoutes.get('/car/:iToken/service/:serviceId', async (request: Request, response: Response) => {
	const account = await validateUser(request, response);
	if (!account) {
		response.sendStatus(401);
		return;
	}

	let objectToken = await invitationService.resolveInvitation(request.params.iToken);
	if (!objectToken) {
		response.sendStatus(401);
		return;
	}

	let serviceRecord = garageService.serviceLog(objectToken, +request.params.serviceId);
	response.json(serviceRecord);
});

apiRoutes.post('/car/:iToken/service', async (request: Request, response: Response) => {
	const account = await validateUser(request, response);
	if (!account) {
		response.sendStatus(401);
		return;
	}

	let objectToken = await invitationService.resolveInvitation(request.params.iToken);
	if (!objectToken) {
		response.sendStatus(401);
		return;
	}

	await garageService.addServiceLog(objectToken, request.body as ServiceRecord);
	response.sendStatus(204);
});

apiRoutes.put('/car/:iToken/service/:serviceId', async (request: Request, response: Response) => {
	const account = await validateUser(request, response);
	if (!account) {
		response.sendStatus(401);
		return;
	}

	let objectToken = await invitationService.resolveInvitation(request.params.iToken);
	if (!objectToken) {
		response.sendStatus(401);
		return;
	}

	garageService.updateServiceLog(request.body as ServiceRecord);
	response.sendStatus(204);
});

apiRoutes.delete('/car/:iToken/service/:serviceId', async (request: Request, response: Response) => {
	const account = await validateUser(request, response);
	if (!account) {
		response.sendStatus(401);
		return;
	}

	let objectToken = await invitationService.resolveInvitation(request.params.iToken);
	if (!objectToken) {
		response.sendStatus(401);
		return;
	}

	garageService.deleteServiceLog(objectToken, +request.params.serviceId);
	response.sendStatus(204);
});


apiRoutes.put('/car/:iToken/mileage/:mileage', async (request: Request, response: Response) => {
	const account = await validateUser(request, response);
	if (!account) {
		response.sendStatus(401);
		return;
	}

	let objectToken = await invitationService.resolveInvitation(request.params.iToken);
	if (!objectToken) {
		response.sendStatus(401);
		return;
	}

	await garageService.addMileage(objectToken, +request.params.mileage);
	response.sendStatus(204);
});

apiRoutes.get('/car/:iToken/schedule', async (request: Request, response: Response) => {
	const account = await validateUser(request, response);
	if (!account) {
		response.sendStatus(401);
		return;
	}

	let objectToken = await invitationService.resolveInvitation(request.params.iToken);
	if (!objectToken) {
		response.sendStatus(401);
		return;
	}


	let serviceDue = await garageService.serviceDue(objectToken);
	response.json(serviceDue);
});

export { apiRoutes }
