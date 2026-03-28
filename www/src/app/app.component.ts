import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Component, Injectable, OnInit, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NavigationStart, Router } from '@angular/router';
import { Observable, of, throwError, catchError } from 'rxjs';
import { MaintenanceService } from './maintenance.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false
})
export class AppComponent implements OnInit {
  title = 'MaintenanceLog';

  showMenu = false;

  public _maintenanceService = inject(MaintenanceService);
  private _snackBar = inject(MatSnackBar);
  private _router = inject(Router);


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
    private router = inject(Router);



    private handleAuthError(err: HttpErrorResponse): Observable<never> {
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