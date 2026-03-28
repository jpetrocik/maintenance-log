import { Component, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { MaintenanceService, ServiceDueRecord, Vehicle } from '../maintenance.service';

@Component({
    selector: 'app-service',
    templateUrl: './service.component.html',
    styleUrls: ['./service.component.scss'],
    standalone: false
})
export class ServiceComponent {

  selectedVehicle?: Vehicle;
  serviceRecords?: ServiceDueRecord[];
  
  public _maintenanceService = inject(MaintenanceService);
  private _snackBar = inject(MatSnackBar);
  private _router = inject(Router);
  selectVehicle(vehicle: Vehicle) {
    this.selectedVehicle = vehicle;

    this._maintenanceService.serviceDue(this.selectedVehicle.invitationToken).subscribe((data) => {
      this.serviceRecords = data;
    });
  }

}