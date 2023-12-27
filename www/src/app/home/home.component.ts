import { Component, OnInit } from '@angular/core';
import { MaintenanceService } from '../maintenance.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor(public _maintenanceService: MaintenanceService,
    ) { 
  
  }

  ngOnInit(): void {
  }

}
