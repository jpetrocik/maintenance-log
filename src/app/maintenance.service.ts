import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";

export interface Car {
    name: string;
    token: string;
    lastReported: number;
}
  
@Injectable({
    providedIn: 'root'
  })
export class MaintenanceService {

  constructor(
  ) {
  }

  public myGarage() : Observable<Car[]> {
    return of([
        { name: "'05 Volvo s60 T5", token: "1232", lastReported: 180},
        { name: "'23 Chevy Colorafo", token: "3232", lastReported: 61}
    ]);
  }

  public submitMileage() : Observable<Car[]> {
    return of([{ name: "'05 Volvo s60 T5", token: "1232", lastReported: 180}]);
  }

}
