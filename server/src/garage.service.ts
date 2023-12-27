import {tokenGenerator} from './tokens';
import {UPCOMING_SERVICE_SQL} from "./sql"
import { BaseService } from './base.service';

export interface Garage {
	invitationToken: string;
	name: string;
	mileage: string;
	mileageReportedDays: number;
}

export interface Vehicle {
	id: number;
	token: string;
	name: string;
	make: string;
	model: string;
	trim: string;
	year: number;
	inserviceDate: Date;
	status: string;
	mileage: number;
	mileageReportedDays: number;
}

export interface MileageLog {
	id: number;
	carId: number;
	createDate: Date;
	mileage: number;
}

class GarageService extends BaseService {

	public async myGarage(utoken: string) {

		let results = await this.executeQuery("select i.invitationToken, name, max(m.mileage) as mileage, DATEDIFF(now(), max(m.created_date)) as mileageReportedDays \
		 from my_garage c join invitation i ON c.token=i.objectToken \
		 left join  mileage_log m ON c.id=m.carId \
		 where c.status='ACTIVE' and i.userToken=? \
		 group by i.invitationToken, name \
		order by c.year desc, c.make asc, c.model asc, c.id desc", [utoken]);

		return results
	}

	public async addVehicle(params: any) : Promise<Vehicle> {
		let token = tokenGenerator(25);
		let inserviceDate = (params.inserviceDate)?params.inserviceDate:new Date();
		let name = "'" + params.year.substring(2) + " " + params.make + " " + params.model;
		let vehicle  = {
			token: token, 
			name: name, 
			make: params.make, 
			model: params.model, 
			trim: params.trim, 
			year: params.year, 
			inserviceDate: inserviceDate, 
			status: "ACTIVE" } as Vehicle;

		let results = await this.executeQuery("insert into my_garage set ?" , vehicle);

		vehicle.id = results.insertId;

		let mileage = params.mileage;
		if (!mileage) {
			mileage=0;
		}
		
		await this.reportMileage(vehicle.token, mileage);

		return vehicle;
	};

	public async vehicleDetails(objectToken: string): Promise<Vehicle|undefined> {
		let results = await this.executeQuery("select c.*, max(m.mileage) as mileage, DATEDIFF(now(), max(m.created_date)) as mileageReportedDays \
			from my_garage c LEFT JOIN mileage_log m ON c.id=m.carId \
			where c.token=?",
			[objectToken]);

		if (!results.length)
			return undefined;

		return results[0];
	};

	public async reportMileage(objectToken: string, mileage: number) {
		let vehicle = await this.vehicleDetails(objectToken);
		if (!vehicle) {
			return;
		}

		if (vehicle.mileage > mileage) {
			throw new Error("Mileage too low");
		}

		if (vehicle.mileage) {
			let maxApproximateMileage = vehicle.mileage+(50 * vehicle.mileageReportedDays);
			if (maxApproximateMileage < mileage) {
				throw new Error("Mileage too high");
			}
		}

		var sqlParams = {carId: vehicle.id, mileage: mileage};
		await this.executeQuery("INSERT INTO mileage_log SET ?", sqlParams);
	};

}

const garageService = new GarageService();

export { garageService }

