import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MaintenanceService, ServiceRecord } from '../../maintenance.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'ml-service-history',
  templateUrl: './service-history.component.html',
  styleUrls: ['./service-history.component.scss']
})
export class ServiceHistoryComponent implements OnInit, OnChanges {

  @Input() serviceRecord!: ServiceRecord;
  @Input() invitationToken!: string;

  showEditForm = false;
  serviceRecordFormGroup: FormGroup;

  constructor(private maintenanceService: MaintenanceService) {
    this.serviceRecordFormGroup = new FormGroup({
      id: new FormControl("", [
        Validators.required,
      ]),
      carId: new FormControl("", [
        Validators.required,
      ]),
      description: new FormControl("", [
        Validators.required,
      ]),
      mileage: new FormControl("", [
        Validators.required,
      ]),
      serviceDate: new FormControl("", [
        Validators.required,
      ]),
      cost: new FormControl("", [
      ]),
      note: new FormControl("", [
      ]),
    });
  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['serviceRecord'].currentValue) {
      this.serviceRecordFormGroup.patchValue(changes['serviceRecord'].currentValue);
    }
  }

  updateServiceRecord() {
    this.maintenanceService.updateServiceRecord(this.invitationToken, this.serviceRecordFormGroup.value ).subscribe(() => {
      this.showEditForm = false;
    })
  }

}
