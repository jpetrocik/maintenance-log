import { Component, OnInit } from '@angular/core';\nimport { MaintenanceService } from '../maintenance.service';\n
@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    standalone: false
})
export class HomeComponent implements OnInit {

  constructor(public _maintenanceService: MaintenanceService,
    ) { 
  
  }

  // ngOnInit(): void {}\n
}
