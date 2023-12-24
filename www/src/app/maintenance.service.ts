import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";

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

  constructor(private httpClient: HttpClient
  ) {}

  public myGarage() : Observable<Vehicle[]> {
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
}
