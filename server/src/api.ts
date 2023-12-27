import { Router, Request, Response, NextFunction } from 'express';
import {invitationService} from './invitation.service'
import {accountService, Account} from './acount.service'
import {Vehicle, garageService} from './garage.service'
import { maintenanceService, ServiceDueRecord, ServiceRecord  } from './maintenance.service';

function Authorized(target: Function, context) {
	if (context.kind === "method") {
	  return async function (...args: any[]) {
		let authToken = args[0].query.authToken;
		if (authToken === undefined) {
			authToken = args[0].cookies._authToken;
			if (authToken === undefined) {
				args[1].sendStatus(401);
			}
		}
	
		const account = await accountService.lookupUserByAuthToken(authToken);
		if (!account) {
			args[1].sendStatus(401);
		}
	
		args[1].cookie('_authToken', authToken, { maxAge: (90 * 24 * 60 * 60 * 1000) });
		args.push(account);
		// @ts-ignore
		return target.apply(this, args)
	  }
	}
  }

  function ResolveInvitation(target: Function, context) {
	if (context.kind === "method") {
	  return async function (...args: any[]) {
		let objectToken = await invitationService.resolveInvitation(args[0].params.iToken);
		if (!objectToken) {
			args[1].sendStatus(404);
			return;
		}
			
		args.push(objectToken);
		// @ts-ignore
		return target.apply(this, args)
	  }
	}
  }


class ApiHandler { 


	headHandler(request: Request, response: Response, next: Function) {
		response.sendStatus(200);
	}


	async registerHandler(request: Request, response: Response) {
		const authToken = accountService.register(request.body.email, request.body.phone);
		if (!authToken) {
			response.sendStatus(400);
			return;
		}

		response.cookie('_authToken', authToken, { maxAge: (90 * 24 * 60 * 60)});
		response.sendStatus(200);
	}

	async loginHandler(request: Request, response: Response) {
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

	async sendAuthHandler(request: Request, response: Response) {
		await accountService.sendAuthToken(request.query.email);
		response.sendStatus(204);
	}


	async mfaHandler(request: Request, response: Response) {
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

	async mfaValidateHandler (request: Request, response: Response) {
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


	@Authorized
	async vehicleAddHandler(request: Request, response: Response, next: Function, account: Account) {
		let newvehicle = await garageService.addVehicle(request.body);
		let invitationToken = await invitationService.createInvitation( account.userToken, newvehicle.token);
		response.json({token: invitationToken, name: newvehicle.name});			
	}

	@Authorized
	async vehicleHandler(request: Request, response: Response, next: Function, account: Account) {
		let garage = await garageService.myGarage(account.userToken);
		response.json(garage);
	}


	@Authorized
	@ResolveInvitation
	async vehicleDetailHandler(request: Request, response: Response, next: NextFunction, account: Account, objectToken: string) {
		let vehicle = await garageService.vehicleDetails(objectToken);
		response.json(vehicle);
	}

	@Authorized
	@ResolveInvitation
	async serviceDueHandler(request: Request, response: Response, next: NextFunction, account: Account, objectToken: string) {
		let allServiceRecords = await maintenanceService.serviceDue(objectToken);
		response.json(allServiceRecords);
	}

	@Authorized
	@ResolveInvitation
	async serviceHistoryHandler(request: Request, response: Response, next: NextFunction, account: Account, objectToken: string) {
		let allServiceRecords = await maintenanceService.serviceHistory(objectToken);
		response.json(allServiceRecords);
	}


	@Authorized
	@ResolveInvitation
	async serviceRecordHandler(request: Request, response: Response) {
		let serviceRecord = await maintenanceService.serviceRecord(+request.params.serviceId);
		response.json(serviceRecord);
	}


	@Authorized
	@ResolveInvitation
	async serviceDueCompletedHandler(request: Request, response: Response, next: NextFunction, account: Account, objectToken: string) {
		await maintenanceService.addService(objectToken, request.body as ServiceDueRecord);
		response.sendStatus(204);
	}


	@Authorized
	@ResolveInvitation
	async serviceRecordUpdateHandler(request: Request, response: Response) {
		await maintenanceService.updateServiceLog(request.body as ServiceRecord);
		response.sendStatus(204);
	}


	@Authorized
	@ResolveInvitation
	async serviceRecordDeleteHandler(request: Request, response: Response) {
		await maintenanceService.deleteServiceLog(+request.params.serviceId);
		response.sendStatus(204);
	}


	@Authorized
	@ResolveInvitation
	async reportMileageHandler(request: Request, response: Response, next: NextFunction, account: Account, objectToken: string) {
		try {
			await garageService.reportMileage(objectToken, +request.params.mileage);
			response.sendStatus(204);
		} catch (err) {
			response.statusMessage = err.message;
			response.sendStatus(400);
		}
	}

}

const apiRoutes = Router();
const apiHandler = new ApiHandler();

apiRoutes.head('/', apiHandler.headHandler);
apiRoutes.post('/register', apiHandler.registerHandler);
apiRoutes.get('/login', apiHandler.loginHandler);
apiRoutes.get('/sendAuth', apiHandler.sendAuthHandler);
apiRoutes.get('/mfa', apiHandler.mfaHandler);
apiRoutes.post('/mfa', apiHandler.mfaValidateHandler) ;
// @ts-ignore
apiRoutes.post('/vehicle', apiHandler.vehicleAddHandler);
// @ts-ignore
apiRoutes.get('/vehicle', apiHandler.vehicleHandler);
// @ts-ignore
apiRoutes.get('/vehicle/:iToken', apiHandler.vehicleDetailHandler);
// @ts-ignore
apiRoutes.post('/vehicle/:iToken/service', apiHandler.serviceDueCompletedHandler);
// @ts-ignore
apiRoutes.get('/vehicle/:iToken/service', apiHandler.serviceDueHandler);
// @ts-ignore
apiRoutes.get('/vehicle/:iToken/history', apiHandler.serviceHistoryHandler);
apiRoutes.get('/vehicle/:iToken/history/:serviceId', apiHandler.serviceRecordHandler);
apiRoutes.put('/vehicle/:iToken/history/:serviceId', apiHandler.serviceRecordUpdateHandler);
apiRoutes.delete('/vehicle/:iToken/history/:serviceId', apiHandler.serviceRecordDeleteHandler);
// @ts-ignore
apiRoutes.put('/vehicle/:iToken/mileage/:mileage', apiHandler.reportMileageHandler);


export { apiRoutes }
