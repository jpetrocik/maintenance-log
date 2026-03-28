import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MileageRoutingModule } from './mileage-routing.module';
import { MileageComponent } from './mileage.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { ServiceHistoryComponent } from './service-history/service-history.component';


@NgModule({
  declarations: [
    MileageComponent,
    ServiceHistoryComponent
  ],
  imports: [
    CommonModule,
    MileageRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  exports: [
    ServiceHistoryComponent
  ]
})
export class MileageModule { }
