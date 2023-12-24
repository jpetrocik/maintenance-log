import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MaintenanceService } from '../maintenance.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  constructor(private activatedRoute: ActivatedRoute,
    private router: Router,
    private maintenanceService: MaintenanceService) { }

  ngOnInit(): void {

    this.activatedRoute.queryParams.subscribe(params => {
      if (!params['email'] || !params['authToken'])
        return;

      this.maintenanceService.login(params['email'], params['authToken']).subscribe(() => {
        this.router.navigateByUrl(`/mileage`);
      })
    });

  }

  login() {
    this.maintenanceService.sendAuth('john@petrocik.net').subscribe();
  }

}
