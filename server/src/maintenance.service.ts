import {UPCOMING_SERVICE_SQL} from "./sql"
import { BaseService } from './base.service';
import { garageService } from './garage.service';

export interface ServiceRecord {
	// @ts-ignore: Object is possibly 'null'.
	id: number;
	// @ts-ignore: Object is possibly 'null'.
	carId: number;
	// @ts-ignore: Object is possibly 'null'.
	mileage: number;
	// @ts-ignore: Object is possibly 'null'.
	serviceDate: Date;
	// @ts-ignore: Object is possibly 'null'.
	description: string;
	// @ts-ignore: Object is possibly 'null'.
	cost: number;
	// @ts-ignore: Object is possibly 'null'.
	note: string;
}


class MaintenanceService extends BaseService {

	public upcomingService(objectToken: string) {
		return this.executeQuery(UPCOMING_SERVICE_SQL, [objectToken]);
	};

	public async serviceHistory(objectToken: string) : Promise<ServiceRecord|undefined> {
		let results = await this.executeQuery("select * from service_history sh join my_garage g on sh.carId=g.carId where g.token=?", [objectToken]);

		if (!results.length)
			return undefined;

		return results[0];

	}

	public async serviceRecord(serviceId: number) : Promise<ServiceRecord|undefined> {
		let results = await this.executeQuery("select * from service_history where id=?", [serviceId]);

		if (!results.length)
			return undefined;

		return results[0];

	}

	public async addService(objectToken: string, serviceRecord: ServiceRecord) {
		let vehicle = await garageService.vehicleDetails(objectToken);
		if (!vehicle)
			return undefined;

        serviceRecord.carId = vehicle.id;
        serviceRecord.mileage ??= vehicle.mileage;
        serviceRecord.serviceDate ??= new Date();
		
		await this.executeQuery("INSERT INTO service_history SET ?", serviceRecord);
	};

	public async updateServiceLog(serviceRecord: ServiceRecord) {

		await this.executeQuery("UPDATE service_history SET ? WHERE id=? AND carId=?", [serviceRecord]);

		//add a scheduled maintenance
		// if (regularService) {
		// 	this.addScheduledService(carId, mileageInterval, monthsInterval, description);
		// }
	};

	public async deleteServiceLog(serviceId: number) {
		await this.executeQuery("DELETE FROM service_history WHERE id = ?", [serviceId]);
	};

	public async addScheduledService(objectToken, mileageInterval, monthsInterval, service) {
		var scheduleLog  = {token: objectToken, mileage: mileageInterval, months: monthsInterval, service: service};
		this.executeQuery("INSERT INTO scheduled_maintenance SET ?", scheduleLog);
	};

}

const maintenanceService = new MaintenanceService();

export { maintenanceService }

