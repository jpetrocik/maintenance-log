import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MaintenanceService } from '../maintenance.service';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  loginForm: UntypedFormGroup;
  authSent = false;

  constructor(private activatedRoute: ActivatedRoute,
    private router: Router,
    private maintenanceService: MaintenanceService) {
      this.loginForm = new UntypedFormGroup({
        email: new UntypedFormControl("", [
          Validators.required,
        ]),
      });
     }

  ngOnInit(): void {

    this.activatedRoute.queryParams.subscribe(params => {
      if (!params['email'] || !params['authToken'])
        return;

      this.maintenanceService.login(params['email'], params['authToken']).subscribe(() => {
        this.router.navigateByUrl(`/home`);
      })
    });

  }

  login() {
    this.maintenanceService.sendAuth(this.loginForm.get('email')?.value).subscribe(() => {
      this.authSent = true;
    });
  }

}
