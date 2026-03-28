import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MileageComponent } from './mileage.component';

const routes: Routes = [
  { path: '', component: MileageComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MileageRoutingModule { }
