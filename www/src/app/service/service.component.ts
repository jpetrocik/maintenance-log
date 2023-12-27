import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { MaintenanceService, Vehicle } from '../maintenance.service';

@Component({
  selector: 'app-service',
  templateUrl: './service.component.html',
  styleUrls: ['./service.component.scss']
})
export class ServiceComponent {

  selectedVehicle?: Vehicle;

  constructor(public _maintenanceService: MaintenanceService,
    private _snackBar: MatSnackBar,
    private _router: Router
    ) { 
  }

  selectVehicle(vehicle: Vehicle) {
    this.selectedVehicle = vehicle;
  }

}
