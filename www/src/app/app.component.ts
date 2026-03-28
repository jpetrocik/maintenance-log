import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';\nimport { Component, Injectable, OnInit } from '@angular/core';\nimport { MatSnackBar } from '@angular/material/snack-bar';\nimport { NavigationStart, Router } from '@angular/router';\nimport { Observable, of, throwError, catchError } from 'rxjs';\nimport { MaintenanceService } from './maintenance.service';\n
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'MaintenanceLog';

  showMenu = false;

  constructor(public _maintenanceService: MaintenanceService,
    private _snackBar: MatSnackBar,
    private _router: Router
    ) { 
  }

  public ngOnInit() {
    this._router.events.subscribe((event) => {
      if (event instanceof NavigationStart)
        this.showMenu = false;
    });
  }

  public toogleMenu() {
    this.showMenu = !this.showMenu;
  }
}


@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    constructor(private router: Router) { }

    private handleAuthError(err: HttpErrorResponse): Observable<any> {
        if (err.status === 401 || err.status === 403) {
            this.router.navigateByUrl(`/login`);
            return of();
        }
        return throwError(err);
    }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // const authReq = req.clone();
        return next.handle(req).pipe(catchError(x=> this.handleAuthError(x))); 
    }
}
