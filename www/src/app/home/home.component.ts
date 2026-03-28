import { Component, OnInit, inject } from '@angular/core';
import { MaintenanceService } from '../maintenance.service';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    standalone: false
})
export class HomeComponent implements OnInit {
  public _maintenanceService = inject(MaintenanceService);


}

