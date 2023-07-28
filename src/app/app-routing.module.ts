import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MileageComponent } from './mileage/mileage.component';
import { ServiceComponent } from './service/service.component';
import { HomeComponent } from './home/home.component';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full'},
  { path: 'service', component: ServiceComponent },
  { path: 'mileage', component: MileageComponent },
  { path: 'home', component: HomeComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
