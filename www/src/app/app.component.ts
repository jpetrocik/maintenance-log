import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { MaintenanceService } from './maintenance.service';
import { AuthService } from './auth.service';
import { PushNotificationService } from './push-notification.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'MaintenanceLog';
  private destroy$ = new Subject<void>();

  public _maintenanceService = inject(MaintenanceService);
  public authService = inject(AuthService);

  constructor(private pushNotificationService: PushNotificationService) {}

  ngOnInit(): void {
    // When authentication status changes, request permission if authenticated
    this.authService.isAuthenticated$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(isAuthenticated => {
      if (isAuthenticated) {
        this.pushNotificationService.requestPermissionAndToken();
      }
    });
    
    // Always listen for foreground messages
    this.pushNotificationService.listenForMessages();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public logout() {
    this.authService.logout();
  }
}
