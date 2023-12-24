import {tokenGenerator} from './tokens';
import {UPCOMING_SERVICE_SQL} from "./sql"
import { BaseService } from './base.service';

export class Garage {
	// @ts-ignore: Object is possibly 'null'.
	invitationToken: string;
	// @ts-ignore: Object is possibly 'null'.
	name: string;
	// @ts-ignore: Object is possibly 'null'.
	mileage: string;
	// @ts-ignore: Object is possibly 'null'.
	mileageReportedDays: number;
}

export class Vehicle {
	// @ts-ignore: Object is possibly 'null'.
	id: number;
	// @ts-ignore: Object is possibly 'null'.
	token: string;
	// @ts-ignore: Object is possibly 'null'.
	name: string;
	// @ts-ignore: Object is possibly 'null'.
	make: string;
	// @ts-ignore: Object is possibly 'null'.
	model: string;
	// @ts-ignore: Object is possibly 'null'.
	trim: string;
	// @ts-ignore: Object is possibly 'null'.
	year: number;
	// @ts-ignore: Object is possibly 'null'.
	inserviceDate: Date;
	// @ts-ignore: Object is possibly 'null'.
	status: string;
	// @ts-ignore: Object is possibly 'null'.
	mileage: number;
	// @ts-ignore: Object is possibly 'null'.
	mileageReportedDays: number;
}

export class ServiceRecord {
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

export class MileageLog {
	// @ts-ignore: Object is possibly 'null'.
	id: number;
	// @ts-ignore: Object is possibly 'null'.
	carId: number;
	// @ts-ignore: Object is possibly 'null'.
	createDate: Date;
	// @ts-ignore: Object is possibly 'null'.
	mileage: number;
}

class GarageService extends BaseService {

	public async myGarage(utoken: string) {

		let results = await this.executeQuery("select i.invitationToken, name, max(m.mileage) as mileage, DATEDIFF(now(), max(m.created_date)) as mileageReportedDays \
		 from my_garage c join invitation i ON c.id=i.carId \
		 left join  mileage_log m ON c.id=m.carId \
		 where c.status='ACTIVE' and i.userToken=? \
		order by c.year desc, c.make asc, c.model asc, c.id desc", [utoken]);

		return results[0];
	}

	public async addCar(params: any) : Promise<Vehicle> {
		let token = tokenGenerator(25);
		let inserviceDate = (params.inserviceDate)?params.inserviceDate:new Date();
		let name = "'" + params.year.substring(2) + " " + params.make + " " + params.model;
		let car  = {
			token: token, 
			name: name, 
			make: params.make, 
			model: params.model, 
			trim: params.trim, 
			year: params.year, 
			inserviceDate: inserviceDate, 
			status: "ACTIVE" } as Vehicle;

		let results = await this.executeQuery("insert into my_garage set ?" , car);

		car.id = results.insertId;

		let mileage = params.mileage;
		if (!mileage) {
			mileage=0;
		}
		
		await this.addMileage(car.token, mileage);

		return car;
	};

	public async carDetails(objectToken: string): Promise<Vehicle|undefined> {
		let results = await this.executeQuery("select c.*, max(m.mileage) as mileage, DATEDIFF(now(), max(m.created_date)) as mileageReportedDays \
			from my_garage c LEFT JOIN mileage_log m ON c.id=m.carId \
			where c.token=?",
			[objectToken]);

		if (!results.length)
			return undefined;

		return results[0];
	};

	public completeServiceLog(objectToken: string) : Promise<ServiceRecord[]> {
		return this.executeQuery("select s.* from my_garage c join service_history s on c.id=s.carId where c.token=? \
			order by mileage asc, serviceDate asc", [objectToken]);
	}

	public async serviceLog(objectToken: string, serviceId: number) : Promise<ServiceRecord|undefined> {
		let results = await this.executeQuery("select * from service_history where id=? and carId=?", [serviceId, objectToken]);

		if (!results.length)
			return undefined;

		return results[0];

	}

	public async serviceDue(objectToken: string) {
		return this.executeQuery(UPCOMING_SERVICE_SQL, [objectToken]);
	};

	public async addServiceLog(objectToken: string, serviceRecord: ServiceRecord) {
		let car = await this.carDetails(objectToken);
		if (!car)
			return undefined;

		if (!serviceRecord.mileage) {
			serviceRecord.mileage = car.mileage;
		}

		if (!serviceRecord.serviceDate) {
			serviceRecord.serviceDate = new Date();
		}
		
		await this.executeQuery("INSERT INTO service_history SET ?", serviceRecord);
	};

	public async updateServiceLog(serviceRecord: ServiceRecord) {

		await this.executeQuery("UPDATE service_history SET ? WHERE id=? AND carId=?", [serviceRecord]);

		//add a scheduled maintenance
		// if (regularService) {
		// 	this.addScheduledService(carId, mileageInterval, monthsInterval, description);
		// }
	};

	public async deleteServiceLog(objecToken: string, serviceId: number) {
		var sqlParams = [serviceId, objecToken];
		this.executeQuery("DELETE FROM service_history WHERE id = ? AND token=?", sqlParams);
	};

	public async addScheduledService(carId, mileageInterval, monthsInterval, service) {
		var scheduleLog  = {carId: carId, mileage: mileageInterval, months: monthsInterval, service: service};
		this.executeQuery("INSERT INTO scheduled_maintenance SET ?", scheduleLog);
	};

	public async addMileage(objectToken: string, mileage: number) {
		let vehicle = await this.carDetails(objectToken);
		if (!vehicle) {
			return;
		}

		if (vehicle.mileage > mileage) {
			throw("Mileage too low!");
		}

		if (vehicle.mileage) {
			let maxApproximateMileage = vehicle.mileage+(50 * vehicle.mileageReportedDays);
			if (maxApproximateMileage < mileage) {
				throw("Mileage too high!");
			}
		}

		var sqlParams = {carId: vehicle.id, mileage: mileage};
		await this.executeQuery("INSERT INTO mileage_log SET ?", sqlParams);
	};

}

const garageService = new GarageService();

export { garageService }

