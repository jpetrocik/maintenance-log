import { Component, OnInit, inject } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MaintenanceService } from '../maintenance.service';
import { ActivatedRoute, Router } from '@angular/router';

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
  private _route = inject(ActivatedRoute);

  public buttonLabel = "Register Vehicle";
  public isEditMode = false;
  private iToken?: string;

  ngOnInit(): void {
    this.iToken = this._route.snapshot.params['iToken'];
    if (this.iToken) {
      this.isEditMode = true;
      this.buttonLabel = "Update Registration";
      this._maintenanceService.vehicleDetails(this.iToken).subscribe((vehicle) => {
        this.registerForm.patchValue(vehicle);
      });
    }
  }

  save() {
    if (this.isEditMode && this.iToken) {
      this._maintenanceService.updateVehicle(this.iToken, this.registerForm.value).subscribe(() => {
        this._router.navigateByUrl(`/mileage/${this.iToken}`);
      });
    } else {
      this._maintenanceService.registerVehicle(this.registerForm.value).subscribe(() => {
        this._router.navigateByUrl("/home");
      });
    }
  }
}
