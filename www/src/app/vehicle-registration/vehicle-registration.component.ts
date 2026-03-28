import { Component, OnInit } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MaintenanceService } from '../maintenance.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-vehicle-registration',
  templateUrl: './vehicle-registration.component.html',
  styleUrls: ['./vehicle-registration.component.scss']
})
export class VehicleRegistrationComponent implements OnInit {

  registerForm: UntypedFormGroup;

  constructor(public _maintenanceService: MaintenanceService,
    private _router: Router) { 
    this.registerForm = new UntypedFormGroup({
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
  }

  ngOnInit(): void {
  }

  register() {
    this._maintenanceService.registerVehicle(this.registerForm.value).subscribe(() => {
      this._router.navigateByUrl("/home");
    });
  }
}
