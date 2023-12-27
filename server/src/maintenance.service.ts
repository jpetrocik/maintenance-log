import {UPCOMING_SERVICE_SQL} from "./sql"
import { BaseService } from './base.service';
import { garageService } from './garage.service';

export interface ServiceRecord {
	id: number;
	carId: number;
	mileage: number;
	serviceDate: Date;
	description: string;
	cost: number;
	note: string;
}

export interface ServiceDueRecord {
	carId: number;
	description: string;
	mileage: number;
	month: number,
	lastServiceDate: Date;
	lastServiceMileage: number;
	dueDays: number;
	dueIn: number;
}

export interface ScheduledMaintenance {
	id: number;
	carId: number;
	mileage: number;
	months: number;
	description: string;
}

class MaintenanceService extends BaseService {

	public serviceDue(objectToken: string) : Promise<ServiceDueRecord> {
		return this.executeQuery(UPCOMING_SERVICE_SQL, [objectToken]);
	};

	public async serviceHistory(objectToken: string) : Promise<ServiceRecord[]|undefined> {
		let results = await this.executeQuery("select sh.* from service_history sh join my_garage g on sh.carId=g.id where g.token=? order by sh.mileage desc", [objectToken]);

		if (!results.length)
			return undefined;

		return results;

	}

	public async serviceRecord(serviceId: number) : Promise<ServiceRecord|undefined> {
		let results = await this.executeQuery("select * from service_history where id=?", [serviceId]);

		if (!results.length)
			return undefined;

		return results[0];

	}

	public async addService(objectToken: string, serviceRecord: ServiceDueRecord) {
		let vehicle = await garageService.vehicleDetails(objectToken);
		if (!vehicle)
			return undefined;

		const serviceHistory = {
        	mileage: vehicle.mileage,
			description: serviceRecord.description,
        	carId: vehicle.id,
        	serviceDate: new Date(),
		};

		await this.executeQuery("INSERT INTO service_history SET ?", serviceHistory);
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

	public async scheduledMaintenance(objectToken) : Promise<ServiceRecord|undefined> {
		let results = await this.executeQuery("SELECT sm.* FROM scheduled_maintenance sm JOIN my_garage g ON sm.carID=g.Id WHERE g.token=?", objectToken);

		if (!results.length)
			return undefined;

		return results;
	};

}

const maintenanceService = new MaintenanceService();

export { maintenanceService }

