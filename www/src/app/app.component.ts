import { Component, inject } from '@angular/core';
import { MaintenanceService } from './maintenance.service';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false
})
export class AppComponent {
  title = 'MaintenanceLog';

  public _maintenanceService = inject(MaintenanceService);
  public authService = inject(AuthService);

  public logout() {
    this.authService.logout();
  }
}
