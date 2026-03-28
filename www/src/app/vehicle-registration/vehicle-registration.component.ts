import { Component, OnInit, inject } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MaintenanceService } from '../maintenance.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-vehicle-registration',
    templateUrl: './vehicle-registration.component.html',
    styleUrls: ['./vehicle-registration.component.scss'],
    standalone: false
})
export class VehicleRegistrationComponent implements OnInit {

  registerForm: UntypedFormGroup = new UntypedFormGroup({
    year: new UntypedFormControl("", [
      Validators.required,
    ]),
    make: new UntypedFormControl("", [
      Validators.required,
    ]),
    model: new UntypedFormControl("", [
      Validators.required,
    ]),
    trim: new UntypedFormControl("", []),
    mileage: new UntypedFormControl("", [
      Validators.required,
    ]),
    license: new UntypedFormControl("", []),
    vin: new UntypedFormControl("", []),

  });

  public _maintenanceService = inject(MaintenanceService);
  private _router = inject(Router);



  register() {
    this._maintenanceService.registerVehicle(this.registerForm.value).subscribe(() => {
      this._router.navigateByUrl("/home");
    });
  }
}
