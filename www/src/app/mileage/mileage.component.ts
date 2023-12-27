import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms'
import { Vehicle, MaintenanceService, ServiceRecord, ServiceDueRecord } from '../maintenance.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { take, map} from 'rxjs';


@Component({
  selector: 'app-mileage',
  templateUrl: './mileage.component.html',
  styleUrls: ['./mileage.component.scss']
})
export class MileageComponent implements OnInit, AfterViewInit {
  @ViewChild('mileage') mileageInput! : ElementRef;

  iToken!: string;
  vehicle!: Vehicle | undefined;
  mileageForm!: FormGroup; 
  serviceDue!: ServiceDueRecord[];
  addNote = false;

  constructor(public _maintenanceService: MaintenanceService,
    private _snackBar: MatSnackBar,
    private _route: ActivatedRoute
    ) { 
    this.mileageForm = new FormGroup({
      mileage: new FormControl('', [Validators.required]),
    })
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

  resetForm() {
    this.setMileage('');
  }

  onSubmit() {
    if (!this.vehicle) {
      return
    }

    this._maintenanceService.submitMileage(this.vehicle.invitationToken, this.mileageForm.controls['mileage'].value).subscribe({
      next: () => {

      this.resetForm();
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
      this.serviceDue = data;
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
}
