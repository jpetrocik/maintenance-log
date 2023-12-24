import { Router, Request, Response, NextFunction } from 'express';
import {invitationService} from './invitation.service'
import {accountService, Account} from './acount.service'
import {ServiceRecord, garageService} from './garage.service'
import { maintenanceService  } from './maintenance.service';

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


apiRoutes.head('/', headHandler);
apiRoutes.post('/register', registerHandler);
apiRoutes.get('/login', loginHandler);
apiRoutes.get('/sendAuth', sendAuthHandler);
apiRoutes.get('/mfa', mfaHandler);
apiRoutes.post('/mfa', mfaValidateHandler) ;
apiRoutes.post('/vehicle', vehicleAddHandler);
apiRoutes.get('/vehicle', vehicleHandler);
apiRoutes.get('/vehicle/:iToken', vehicleDetailHandler);
apiRoutes.post('/vehicle/:iToken/service', serviceRecordAddHisotry);
apiRoutes.get('/vehicle/:iToken/service', serviceHistoryHandler);
apiRoutes.get('/vehicle/:iToken/service/:serviceId', serviceRecordHandler);
apiRoutes.put('/vehicle/:iToken/service/:serviceId', serviceRecordUpdateHandler);
apiRoutes.delete('/vehicle/:iToken/service/:serviceId', serviceRecordDeleteHandler);
apiRoutes.put('/vehicle/:iToken/mileage/:mileage', reportMileageHandler);

async function headHandler(request: Request, response: Response) {
	const account = await validateUser(request, response);
	if (!account) {
		response.sendStatus(401);
		return;
	}

	response.sendStatus(200);
}

async function registerHandler(request: Request, response: Response) {
	const authToken = accountService.register(request.body.email, request.body.phone);
	if (!authToken) {
		response.sendStatus(400);
		return;
	}

	response.cookie('_authToken', authToken, { maxAge: (90 * 24 * 60 * 60)});
	response.sendStatus(200);
}

async function loginHandler(request: Request, response: Response) {
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
}

async function sendAuthHandler(request: Request, response: Response) {
	await accountService.sendAuthToken(request.query.email);
	response.sendStatus(204);
}


async function mfaHandler(request: Request, response: Response) {
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
}

async function mfaValidateHandler (request: Request, response: Response) {
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
}


async function vehicleAddHandler(request: Request, response: Response) {
	const account = await validateUser(request, response);
	if (!account) {
		response.sendStatus(401);
		return;
	}

	let newvehicle = await garageService.addVehicle(request.body);
	let invitationToken = await invitationService.createInvitation( account.userToken, newvehicle.token);
	response.json({token: invitationToken, name: newvehicle.name});			
}

async function vehicleHandler(request: Request, response: Response) {
	const account = await validateUser(request, response);
	if (!account) {
		response.sendStatus(401);
		return;
	}

	let garage = await garageService.myGarage(account.userToken);
	response.json(garage);
}


async function vehicleDetailHandler(request: Request, response: Response) {
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

	let vehicle = await garageService.vehicleDetails(objectToken);
	response.json(vehicle);
}

async function serviceHistoryHandler(request: Request, response: Response) {
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

	let allServiceRecords = await garageService.completeServiceLog(objectToken);
	response.json(allServiceRecords);
}


async function serviceRecordHandler(request: Request, response: Response) {
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

	let serviceRecord = await garageService.serviceLog(objectToken, +request.params.serviceId);
	response.json(serviceRecord);
}


async function serviceRecordAddHisotry(request: Request, response: Response) {
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

	await maintenanceService.addServiceLog(objectToken, request.body as ServiceRecord);
	response.sendStatus(204);
}


async function serviceRecordUpdateHandler(request: Request, response: Response) {
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

	await maintenanceService.updateServiceLog(request.body as ServiceRecord);
	response.sendStatus(204);
}


async function serviceRecordDeleteHandler(request: Request, response: Response) {
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

	await maintenanceService.deleteServiceLog(+request.params.serviceId);
	response.sendStatus(204);
}


async function reportMileageHandler(request: Request, response: Response, next: NextFunction) {
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

	try {
	await garageService.reportMileage(objectToken, +request.params.mileage);
	response.sendStatus(204);
	} catch (err) {
		response.statusMessage = err.message;
		response.sendStatus(404);
	}
}


export { apiRoutes }
