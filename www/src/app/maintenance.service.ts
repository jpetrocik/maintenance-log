import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { AuthService } from './auth.service';

export interface Vehicle {
    invitationToken: string;
    name: string;
    mileage: number;
    mileageReportedDays: number;
}

export interface VehicleDetails extends Vehicle {
	make: string;
	model: string;
	trim: string;
	year: number;
	inserviceDate: Date;
	status: string;
	vin: string;
	license: string;
}

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
  overdue: boolean;
}

export interface ScheduledMaintenance {
	id: number;
	carId: number;
	mileage: number;
	months: number;
	description: string;
}

@Injectable({
    providedIn: 'root'
  })
export class MaintenanceService {

  private _myGarage = new BehaviorSubject<Vehicle[]>([]);

  myGarage$: Observable<Vehicle[]> = this._myGarage.asObservable();

  private httpClient = inject(HttpClient);
  private authService = inject(AuthService);

  constructor() {
    this.authService.isAuthenticated$.subscribe((isAuthenticated) => {
      if (isAuthenticated) {
        this.loadMyGarage();
      } else {
        this._myGarage.next([]);
      }
    });
  }

  private loadMyGarage() {
    this.httpClient.get<Vehicle[]>("/api/vehicle").subscribe((data) => {
      this._myGarage.next(data);
    });
  }

  public submitMileage(invitationToken: string, mileage: number) : Observable<Vehicle[]> {
    return this.httpClient.put<Vehicle[]>(`/api/vehicle/${invitationToken}/mileage/${mileage}`, '');
  }

  public serviceDue(invitationToken: string) : Observable<ServiceDueRecord[]> {
    return this.httpClient.get<ServiceDueRecord[]>(`/api/vehicle/${invitationToken}/service`)
  }

  public serviceCompleted(invitationToken: string, serviceDue: ServiceDueRecord) : Observable<ServiceDueRecord[]> {
    return this.httpClient.post<ServiceDueRecord[]>(`/api/vehicle/${invitationToken}/service`, serviceDue)
  }

  public registerVehicle(vehicle: VehicleDetails) : Observable<ServiceDueRecord[]> {
    return this.httpClient.post<ServiceDueRecord[]>(`/api/vehicle`, vehicle).pipe(
      map((data) => {
        this.loadMyGarage();
        return data;
      }));
  }

  public serviceHistory(invitationToken: string) : Observable<ServiceRecord[]> {
    return this.httpClient.get<ServiceRecord[]>(`/api/vehicle/${invitationToken}/history`)
  }

  public scheduledMaintenace(invitationToken: string) : Observable<ScheduledMaintenance[]> {
    return this.httpClient.get<ScheduledMaintenance[]>(`/api/vehicle/${invitationToken}/maintenance`)
  }

  public adScheduledMaintenace(invitationToken: string, scheduledMaintenace: ScheduledMaintenance) : Observable<ScheduledMaintenance[]> {
    return this.httpClient.post<ScheduledMaintenance[]>(`/api/vehicle/${invitationToken}/maintenance`, scheduledMaintenace)
  }

  public shareVehicle(invitationToken: string, email: string) : Observable<ScheduledMaintenance[]> {
    return this.httpClient.put<ScheduledMaintenance[]>(`/api/vehicle/${invitationToken}/share`, { email: email });
  }

  public vehicleDetails(invitationToken: string) : Observable<VehicleDetails> {
    return this.httpClient.get<VehicleDetails>(`/api/vehicle/${invitationToken}`);
  }

  public updateServiceRecord(invitationToken: string, serviceRecord: ServiceRecord) : Observable<VehicleDetails> {
    return this.httpClient.put<VehicleDetails>(`/api/vehicle/${invitationToken}/history`, serviceRecord);
  }

  public getServiceDescriptions(invitationToken: string): Observable<string[]> {
    return this.httpClient.get<string[]>(`/api/vehicle/${invitationToken}/maintenance/list`);
  }

  public updateVehicle(invitationToken: string, vehicle: VehicleDetails) : Observable<any> {
    return this.httpClient.put(`/api/vehicle/${invitationToken}`, vehicle);
  }
}
