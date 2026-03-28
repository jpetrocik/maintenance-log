import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VehicleRegistrationComponent } from './vehicle-registration.component';

const routes: Routes = [
  { path: '', component: VehicleRegistrationComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VehicleRegistrationRoutingModule { }
