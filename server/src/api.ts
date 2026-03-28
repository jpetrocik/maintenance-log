import { Router, Request, Response, NextFunction } from 'express';
import { invitationService } from './invitation.service'
import { accountService, Account } from './acount.service'
import { Vehicle, garageService } from './garage.service'
import { maintenanceService, ScheduledMaintenance, ServiceDueRecord, ServiceRecord } from './maintenance.service';
import { jwtService } from './jwt.service';

interface RequestWithAuth extends Request {
    userToken: string;
    invitationTokens: string[];
}

function Authorized(target: Function, context: ClassMethodDecoratorContext) {
    if (context.kind === "method") {
        return async function (...args: any[]) {
            const request = args[0] as RequestWithAuth;
            const response = args[1] as Response;
            const authHeader = request.headers.authorization;
            if (!authHeader) {
                response.sendStatus(401);
                return;
            }

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                response.sendStatus(401).json({ error: 'Missing or malformed authorization header' });
                return
            }

            const token = authHeader.split(' ')[1];

            const payload = jwtService.verifyToken(token);
            if (!payload) {
                response.sendStatus(401);
                return;
            }

            const account = await accountService.lookupUserByUserToken(payload.userToken);
            if (!account) {
                response.sendStatus(401);
                return;
            }

            request.userToken = payload.userToken;
            request.invitationTokens = payload.invitationTokens;
            args.push(account);
            // @ts-ignore
            await target.apply(this, args);
        }
    }
}

function ResolveInvitation(target: Function, context: ClassMethodDecoratorContext) {
    if (context.kind === "method") {
        return async function (...args: any[]) {
            const request = args[0] as RequestWithAuth;
            const response = args[1] as Response;
            const iToken = request.params.iToken;

            if (!request.invitationTokens.includes(iToken)) {
                response.sendStatus(403);
                return;
            }

            let objectToken = await invitationService.resolveInvitation(iToken);
            if (!objectToken) {
                response.sendStatus(404);
                return;
            }

            args.push(objectToken);
            // @ts-ignore
            await target.apply(this, args)
        }
    }
}

function AsyncErrorHandler(target: Function, context: ClassMethodDecoratorContext) {
    if (context.kind === "method") {
        return async function (...args: any[]) {
            try {
                // @ts-ignore
                await target.apply(this, args);
            } catch (error) {
                args[2](error);
            }
        }
    }
}

class ApiHandler {

    headHandler(request: Request, response: Response, next: Function) {
        response.sendStatus(200);
    }

    @AsyncErrorHandler
    async registerHandler(request: Request, response: Response) {
        const userToken = await accountService.register(request.body.email, request.body.phone);
        if (!userToken) {
            response.sendStatus(400);
            return;
        }
        await accountService.sendLoginLink(request.body.email);
        response.sendStatus(204);
    }

    @AsyncErrorHandler
    async loginRequestHandler(request: Request, response: Response) {
        await accountService.sendLoginLink(request.body.email);
        response.sendStatus(204);
    }

    @AsyncErrorHandler
    async loginVerifyHandler(request: Request, response: Response) {
        const token = request.query.token as string;
        const account = await accountService.verifyLoginToken(token);

        if (!account) {
            response.sendStatus(401);
            return;
        }

        const invitationTokens = await invitationService.userInvitations(account.userToken);
        const accessToken = jwtService.generateToken({ userToken: account.userToken, invitationTokens });
        const refreshToken = await accountService.generateRefreshToken(account.userToken);

        response.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 90 * 24 * 60 * 60 * 1000 });
        response.json({ accessToken });
    }

    @AsyncErrorHandler
    async refreshTokenHandler(request: Request, response: Response) {
        const refreshToken = request.cookies.refreshToken;
        if (!refreshToken) {
            response.sendStatus(401);
            return;
        }

        const tokens = await accountService.refreshAccessToken(refreshToken);
        if (!tokens) {
            response.sendStatus(403);
            return;
        }

        response.cookie('refreshToken', tokens.newRefreshToken, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 90 * 24 * 60 * 60 * 1000 });
        response.json({ accessToken: tokens.accessToken });
    }

    @AsyncErrorHandler
    async logoutHandler(request: Request, response: Response) {
        const refreshToken = request.cookies.refreshToken;
        if (refreshToken) {
            await accountService.logout(refreshToken);
        }
        response.cookie('refreshToken', '', { httpOnly: true, expires: new Date(0) });
        response.sendStatus(204);
    }

    @Authorized
    @AsyncErrorHandler
    async vehicleAddHandler(request: RequestWithAuth, response: Response, next: Function, account: Account) {
        let newvehicle = await garageService.addVehicle(request.body);
        let invitationToken = await invitationService.createInvitation(account.userToken, newvehicle.token);
        response.json({ token: invitationToken, name: newvehicle.name });
    }

    @Authorized
    @AsyncErrorHandler
    async vehicleHandler(request: RequestWithAuth, response: Response, next: Function, account: Account) {
        let garage = await garageService.myGarage(account.userToken);
        response.json(garage);
    }


    @Authorized
    @ResolveInvitation
    @AsyncErrorHandler
    async vehicleDetailHandler(request: RequestWithAuth, response: Response, next: NextFunction, account: Account, objectToken: string) {
        let vehicle = await garageService.vehicleDetails(objectToken);
        response.json(vehicle);
    }

    @Authorized
    @ResolveInvitation
    @AsyncErrorHandler
    async serviceDueHandler(request: RequestWithAuth, response: Response, next: NextFunction, account: Account, objectToken: string) {
        let allServiceRecords = await maintenanceService.serviceDue(objectToken);
        response.json(allServiceRecords);
    }

    @Authorized
    @ResolveInvitation
    @AsyncErrorHandler
    async serviceHistoryHandler(request: RequestWithAuth, response: Response, next: NextFunction, account: Account, objectToken: string) {
        let allServiceRecords = await maintenanceService.serviceHistory(objectToken);
        response.json(allServiceRecords);
    }


    @Authorized
    @ResolveInvitation
    @AsyncErrorHandler
    async serviceRecordHandler(request: Request, response: Response) {
        let serviceRecord = await maintenanceService.serviceRecord(+request.params.serviceId);
        response.json(serviceRecord);
    }


    @Authorized
    @ResolveInvitation
    @AsyncErrorHandler
    async serviceDueCompletedHandler(request: RequestWithAuth, response: Response, next: NextFunction, account: Account, objectToken: string) {
        await maintenanceService.addService(objectToken, request.body as ServiceRecord);
        response.sendStatus(204);
    }


    @Authorized
    @ResolveInvitation
    @AsyncErrorHandler
    async serviceRecordUpdateHandler(request: Request, response: Response) {
        await maintenanceService.updateServiceLog(request.body as ServiceRecord);
        response.sendStatus(204);
    }


    @Authorized
    @ResolveInvitation
    @AsyncErrorHandler
    async serviceRecordDeleteHandler(request: Request, response: Response) {
        await maintenanceService.deleteServiceLog(+request.params.serviceId);
        response.sendStatus(204);
    }


    @Authorized
    @ResolveInvitation
    @AsyncErrorHandler
    async reportMileageHandler(request: RequestWithAuth, response: Response, next: NextFunction, account: Account, objectToken: string) {
        try {
            await garageService.reportMileage(objectToken, +request.params.mileage);
            response.sendStatus(204);
        } catch (err) {
            response.statusMessage = err.message;
            response.sendStatus(400);
        }
    }

    @Authorized
    @ResolveInvitation
    async scheduledMaintenanceHandler(request: RequestWithAuth, response: Response, next: NextFunction, account: Account, objectToken: string) {
        try {
            let scheduledMaintenance = await maintenanceService.scheduledMaintenance(objectToken);
            response.json(scheduledMaintenance);
        } catch (err) {
            response.statusMessage = err.message;
            response.sendStatus(400);
        }
    }

    @Authorized
    @ResolveInvitation
    @AsyncErrorHandler
    async addScheduledMaintenanceHandler(request: RequestWithAuth, response: Response, next: NextFunction, account: Account, objectToken: string) {
        try {
            let scheduledMaintenance = await maintenanceService.addScheduledService(objectToken, request.body as ScheduledMaintenance);
            response.json(scheduledMaintenance);
        } catch (err) {
            response.statusMessage = err.message;
            response.sendStatus(400);
        }
    }

    @Authorized
    @ResolveInvitation
    @AsyncErrorHandler
    async shareVehicleHandler(request: RequestWithAuth, response: Response, next: NextFunction, account: Account, objectToken: string) {
        try {
            let shareWith = await accountService.lookupUserByEmail(request.body.email);
            if (!shareWith) {
                await accountService.register(request.body.email, null);
                shareWith = await accountService.lookupUserByEmail(request.body.email);
            }

            if (!shareWith) {
                response.sendStatus(400);
                return;
            }

            await invitationService.createInvitation(shareWith.userToken, objectToken);
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
apiRoutes.post('/login', apiHandler.loginRequestHandler);
apiRoutes.get('/login', apiHandler.loginVerifyHandler);
apiRoutes.post('/token/refresh', apiHandler.refreshTokenHandler);
apiRoutes.post('/logout', apiHandler.logoutHandler);
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
apiRoutes.put('/vehicle/:iToken/history', apiHandler.serviceRecordUpdateHandler);
apiRoutes.delete('/vehicle/:iToken/history/:serviceId', apiHandler.serviceRecordDeleteHandler);
// @ts-ignore
apiRoutes.put('/vehicle/:iToken/mileage/:mileage', apiHandler.reportMileageHandler);
// @ts-ignore
apiRoutes.get('/vehicle/:iToken/maintenance', apiHandler.scheduledMaintenanceHandler);
// @ts-ignore
apiRoutes.post('/vehicle/:iToken/maintenance', apiHandler.addScheduledMaintenanceHandler);
// @ts-ignore
apiRoutes.put('/vehicle/:iToken/share/', apiHandler.shareVehicleHandler);


export { apiRoutes }
