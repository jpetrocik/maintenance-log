import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { VehicleRegistrationRoutingModule } from './vehicle-registration-routing.module';
import { VehicleRegistrationComponent } from './vehicle-registration.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';


@NgModule({
  declarations: [
    VehicleRegistrationComponent
  ],
  imports: [
    CommonModule,
    VehicleRegistrationRoutingModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ]
})
export class VehicleRegistrationModule { }
