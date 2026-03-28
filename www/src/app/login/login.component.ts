import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MaintenanceService } from '../maintenance.service';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    standalone: false
})
export class LoginComponent implements OnInit {

  loginForm: UntypedFormGroup = new UntypedFormGroup({
    email: new UntypedFormControl("", [
      Validators.required,
    ]),
  });
  authSent = false;

  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private maintenanceService = inject(MaintenanceService);


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
