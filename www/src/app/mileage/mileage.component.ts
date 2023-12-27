import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms'
import { Vehicle, MaintenanceService } from '../maintenance.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';


@Component({
  selector: 'app-mileage',
  templateUrl: './mileage.component.html',
  styleUrls: ['./mileage.component.scss']
})
export class MileageComponent implements OnInit, AfterViewInit {
  @ViewChild('mileage') mileageInput! : ElementRef;

  selectedVehicle!: Vehicle | undefined;
  mileageForm!: FormGroup; 

  constructor(public _maintenanceService: MaintenanceService,
    private _snackBar: MatSnackBar,
    private _router: Router
    ) { 
    this.mileageForm = new FormGroup({
      mileage: new FormControl('', [Validators.required]),
    })

    this.mileageForm.disable();
  }

  ngOnInit(): void {
  }

  ngAfterViewInit():void {
  }

  selectVehicle(vehicle: Vehicle) {
    this.selectedVehicle = vehicle;
    this.mileageForm.enable();
    this.mileageInput.nativeElement.focus();
  }

  resetForm() {
    this.selectedVehicle = undefined;
    this.setMileage('');
    this.mileageForm.disable();

  }

  onSubmit() {
    if (!this.selectedVehicle) {
      return
    }

    this._maintenanceService.submitMileage(this.selectedVehicle.invitationToken, this.mileageForm.controls['mileage'].value).subscribe({
      next: () => {

      this.resetForm();
      this._snackBar.open("Service Due", "View", {
        duration: 15000
      }).onAction().subscribe(() => {
        this._router.navigate(['service'])
      });
            // if (results.length > 0) {
      //   $("#service_due").show();
      //   $("#service_due a").attr("href", "service?cToken=" + carToken);
      //   $("service_good").hide();
      // } else {
      //   $("#service_due").hide();
      //   $("service_good").show();
      // }
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
}
