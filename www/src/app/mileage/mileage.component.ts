import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms'
import { Vehicle, MaintenanceService, ServiceRecord, ServiceDueRecord, ScheduledMaintenance } from '../maintenance.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { take, map} from 'rxjs';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import { ShareComponent } from '../share/share.component';

@Component({
  selector: 'app-mileage',
  templateUrl: './mileage.component.html',
  styleUrls: ['./mileage.component.scss']
})
export class MileageComponent implements OnInit, AfterViewInit {
  @ViewChild('mileage') mileageInput! : ElementRef;

  iToken!: string;
  vehicle!: Vehicle | undefined;
  mileageForm: FormGroup; 
  serviceForm: FormGroup
  scheduleMaintenanceForm: FormGroup
  serviceDueAll!: ServiceDueRecord[];
  serviceHistoryAll!: ServiceRecord[];
  scheduledMaintenanceAll!: ScheduledMaintenance[];
  addNote = false;
  showServiceHistory = false
  showServiceDue = false;
  showScheduledMaintenance = false;
  pastDueService = false;
  upcomingService = false;

  constructor(public _maintenanceService: MaintenanceService,
    private _snackBar: MatSnackBar,
    private _route: ActivatedRoute,
    private dialog: MatDialog
    ) { 
    this.mileageForm = new FormGroup({
      mileage: new FormControl('', [
        Validators.required
      ]),
    })

    this.serviceForm = new FormGroup({
      description: new FormControl("", [
        Validators.required,
      ]),
    });

    this.scheduleMaintenanceForm = new FormGroup({
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

  }

  ngOnInit(): void {
    this._route.params.subscribe((params) => {
      this.iToken = params['iToken'];
      this._maintenanceService.myGarage$.subscribe((data) =>{
        this.vehicle = data.filter(d => d.invitationToken == this.iToken)[0];
      })
      this.loadServiceDue(this.iToken);
   });
  }

  ngAfterViewInit():void {
  }

  selectVehicle(vehicle: Vehicle) {
    this.vehicle = vehicle;
    this.mileageInput.nativeElement.focus();
  }

  reportMileage() {
    if (!this.vehicle) {
      return
    }

    //TODO Car description does not refersh
    this._maintenanceService.submitMileage(this.vehicle.invitationToken, this.mileageForm.controls['mileage'].value).subscribe({
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
      this.pastDueService = this.serviceDueAll.filter(s => s.dueIn < 0 || s.dueDays < 0).map(s => s.overdue = true).length > 0;
      this.upcomingService = this.serviceDueAll.filter(s => s.dueIn >= 0 || s.dueDays >= 0).length > 0;
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

}
