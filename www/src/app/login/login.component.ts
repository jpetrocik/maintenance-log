import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';

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
  private authService = inject(AuthService);


  ngOnInit(): void {
    const token = this.activatedRoute.snapshot.queryParamMap.get('token');
    if (token) {
      this.authService.verifyLogin(token).subscribe(() => {
        this.router.navigateByUrl('/home');
      });
    }
  }

  login() {
    this.authService.requestLoginLink(this.loginForm.get('email')?.value).subscribe(() => {
      this.authSent = true;
    });
  }
}
