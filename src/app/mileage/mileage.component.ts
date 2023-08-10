import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms'
import { Car, MaintenanceService } from '../maintenance.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';


@Component({
  selector: 'app-mileage',
  templateUrl: './mileage.component.html',
  styleUrls: ['./mileage.component.scss']
})
export class MileageComponent implements OnInit, AfterViewInit {
  @ViewChild('mileage') mileageInput! : ElementRef;

  garage: Car[] = [];
  selectedCar!: Car | undefined;
  mileageForm!: FormGroup; 

  constructor(private _maintenanceService: MaintenanceService,
    private _snackBar: MatSnackBar,
    private _router: Router
    ) { 
    this.mileageForm = new FormGroup({
      mileage: new FormControl('', [Validators.required]),
    })

    this.mileageForm.disable();
  }

  ngOnInit(): void {
    this._maintenanceService.myGarage().subscribe(r => {this.garage = r}); 
  }

  ngAfterViewInit():void {
  }

  selectCar(car: Car) {
    this.selectedCar = car;
    this.mileageForm.enable();
    this.mileageInput.nativeElement.focus();
  }

  resetForm() {
    this.selectedCar = undefined;
    this.setMileage('');
    this.mileageForm.disable();

  }

  onSubmit() {
    this._maintenanceService.submitMileage().subscribe({
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
    error: () => {
      this._snackBar.open("Invalid Mileage", "Ok").onAction().subscribe();
    }});
  };

  setMileage(value : string) {
    this.mileageForm.patchValue({
      mileage: value
    }); 

  }
}
