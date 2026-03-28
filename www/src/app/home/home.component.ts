import { Component, inject } from '@angular/core';
import { MaintenanceService } from '../maintenance.service';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    standalone: false
})
export class HomeComponent {
  public _maintenanceService = inject(MaintenanceService);


}

