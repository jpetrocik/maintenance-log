import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MaintenanceService, ServiceRecord, ServiceDueRecord, ScheduledMaintenance, VehicleDetails } from '../maintenance.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ShareComponent } from '../share/share.component';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
    selector: 'app-mileage',
    templateUrl: './mileage.component.html',
    styleUrls: ['./mileage.component.scss'],
    standalone: false
})
export class MileageComponent implements OnInit {

  @ViewChild('mileage') mileageInput! : ElementRef;

  iToken!: string;
  vehicle$!: Observable<VehicleDetails | undefined>;
  mileageForm: FormGroup = new FormGroup({
    mileage: new FormControl('', [
      Validators.required
    ]),
  });
  serviceForm: FormGroup = new FormGroup({
    description: new FormControl("", [
      Validators.required,
    ]),
    cost: new FormControl("", [
    ]),
    note: new FormControl("", [
    ]),
  });
  scheduleMaintenanceForm: FormGroup = new FormGroup({
    mileage: new FormControl("", [
      Validators.required,
    ]),
    months: new FormControl("", [
      Validators.required,
    ]),
    description: new FormControl("", [
      Validators.required,
    ]),
  });
  serviceDueAll!: ServiceDueRecord[];
  serviceHistoryAll!: ServiceRecord[];
  scheduledMaintenanceAll!: ScheduledMaintenance[];
  addNote = false;
  additionalFields = false;
  showServiceHistory = false;
  showServiceDue = false;
  showScheduledMaintenance = false;
  pastDueService = false;
  upcomingService = false;

  public _maintenanceService = inject(MaintenanceService);
  private _snackBar = inject(MatSnackBar);
  private _route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);


  ngOnInit(): void {
    this.vehicle$ = this._route.params.pipe(
      switchMap(params => {
        const iToken = params['iToken'];
        if (iToken) {
          this.iToken = iToken; // Keep iToken if needed elsewhere
          this.loadServiceDue(iToken);
          return this._maintenanceService.vehicleDetails(iToken);
        }
        return of(undefined); // Return an observable of undefined if no token
      })
    );
   }

  reportMileage() {
    this._maintenanceService.submitMileage(this.iToken, this.mileageForm.controls['mileage'].value).subscribe({
      next: () => {

      this.mileageForm.reset();
      this._snackBar.open("Service Due", undefined, {
        duration: 15000
      });
    },
    error: (message) => {
      this._snackBar.open(message.statusText, "Ok").onAction().subscribe();
    }});
  };

  setMileage(value : string) {
    this.mileageForm.patchValue({
      mileage: value
    }); 
  }

  loadServiceDue(iToken: string) {
    this._maintenanceService.serviceDue(iToken).subscribe((data) => {
      this.serviceDueAll = data;

      this.serviceDueAll.filter(s => s.dueIn < 0 || s.dueDays < 0).map(s => s.overdue = true);
      this.pastDueService = this.serviceDueAll.filter(s => s.overdue).length > 0;
      this.upcomingService = this.serviceDueAll.filter(s => !s.overdue).length > 0;
    });
  };

  loadServiceHistory(iToken: string) {
    this._maintenanceService.serviceHistory(iToken).subscribe((data) => {
      this.serviceHistoryAll = data;
    });
  };

  loadScheduledMaintenance(iToken: string) {
    this._maintenanceService.scheduledMaintenace(iToken).subscribe((data) => {
      this.scheduledMaintenanceAll = data;
    });
  };

  serviceCompleted(serviceDue: ServiceDueRecord) {
    this._maintenanceService.serviceCompleted(this.iToken, serviceDue).subscribe(() => {
      this.loadServiceDue(this.iToken);
    });
  }

  enableNote() {
    this.addNote = !this.addNote
  }

  toggleSeviceHistory() {
    this.showServiceHistory = !this.showServiceHistory;

    if (this.showServiceHistory) {
      this.loadServiceHistory(this.iToken);
    }
  }

  toggleSeviceDue() {
    this.showServiceDue = !this.showServiceDue;
  }

  toggleScheduledMaintenance() {
    this.showScheduledMaintenance = !this.showScheduledMaintenance;

    if (this.showScheduledMaintenance) {
      this.loadScheduledMaintenance(this.iToken);
    }
  }

  addService() {
    this._maintenanceService.serviceCompleted(this.iToken, this.serviceForm.value).subscribe(() => {
      // formDirective.resetForm();
      this.serviceForm.reset();
      
      // this.loadServiceDue(this.iToken);
      this.loadServiceHistory(this.iToken);
    });
  }

  addScheduledMaintenance() {
    this._maintenanceService.adScheduledMaintenace(this.iToken, this.scheduleMaintenanceForm.value).subscribe(() => {
      // formDirective.resetForm();
      this.scheduleMaintenanceForm.reset();

      this.loadScheduledMaintenance(this.iToken);
      this.loadServiceDue(this.iToken);
    });
  }

  openShareDialog() {
    const dialogRef = this.dialog.open(ShareComponent, {
      data: {invitationToken: this.iToken},
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
  }

  showAdditionalFields() {
    this.additionalFields = !this.additionalFields
  }
}
