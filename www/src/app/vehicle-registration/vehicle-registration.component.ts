import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MaintenanceService } from '../maintenance.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-vehicle-registration',
  templateUrl: './vehicle-registration.component.html',
  styleUrls: ['./vehicle-registration.component.scss']
})
export class VehicleRegistrationComponent implements OnInit {

  registerForm: FormGroup;

  constructor(public _maintenanceService: MaintenanceService,
    private _router: Router) { 
    this.registerForm = new FormGroup({
      year: new FormControl("", [
        Validators.required,
      ]),
      make: new FormControl("", [
        Validators.required,
      ]),
      model: new FormControl("", [
        Validators.required,
      ]),
      trim: new FormControl("", [
        Validators.required,
      ]),
      mileage: new FormControl("", [
        Validators.required,
      ]),

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
