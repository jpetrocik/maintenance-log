import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, of } from "rxjs";

export interface Vehicle {
    invitationToken: string;
    name: string;
    token: string;
    mileage: number;
    mileageReportedDays: number;
}
  
@Injectable({
    providedIn: 'root'
  })
export class MaintenanceService {

  private _myGarage = new BehaviorSubject<Vehicle[]>([]);

  myGarage$: Observable<Vehicle[]>;

  constructor(private httpClient: HttpClient
  ) {
    this.myGarage$ = this._myGarage.asObservable();

    this.myGarage().subscribe((data) => {
      this._myGarage.next(data);
    });
  }

  private myGarage() : Observable<Vehicle[]> {
    return this.httpClient.get<Vehicle[]>("/api/vehicle")
  }

  public submitMileage(invitationToken: string, mileage: number) : Observable<any> {
    return this.httpClient.put<Vehicle[]>(`/api/vehicle/${invitationToken}/mileage/${mileage}`, '');
  }

  public login(email: string, authToken: string) : Observable<any> {
    return this.httpClient.get(`/api/login?email=${email}&authToken=${authToken}`);
  }

  public sendAuth(email: string) : Observable<any> {
    return this.httpClient.get(`/api/sendAuth?email=${email}`);
  }

  // public serviceDue(invitationToken: string) : Observable<ServiceRecord> {
  //   return this.httpClient.get(`/vehicle/${invitationToken}/service`)
  // }
}
