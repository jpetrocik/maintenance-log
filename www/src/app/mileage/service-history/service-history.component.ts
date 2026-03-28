import { Component, Input, OnChanges, OnInit, SimpleChanges, inject } from '@angular/core';
import { MaintenanceService, ServiceRecord } from '../../maintenance.service';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-service-history',
  templateUrl: './service-history.component.html',
  styleUrls: ['./service-history.component.scss'],
  standalone: false
})
export class ServiceHistoryComponent implements OnInit, OnChanges {

  @Input() serviceRecord!: ServiceRecord;
  @Input() invitationToken!: string;

  showEditForm = false;
  serviceRecordFormGroup: UntypedFormGroup = new UntypedFormGroup({
    id: new UntypedFormControl("", [
      Validators.required,
    ]),
    carId: new UntypedFormControl("", [
      Validators.required,
    ]),
    description: new UntypedFormControl("", [
      Validators.required,
    ]),
    mileage: new UntypedFormControl("", [
      Validators.required,
    ]),
    serviceDate: new UntypedFormControl("", [
      Validators.required,
    ]),
    cost: new UntypedFormControl("", [
    ]),
    note: new UntypedFormControl("", [
    ]),
  });

  private maintenanceService = inject(MaintenanceService);



  ngOnChanges(changes: SimpleChanges): void {
    if (changes['serviceRecord'].currentValue) {
      this.serviceRecordFormGroup.patchValue(changes['serviceRecord'].currentValue);
    }
  }

  updateServiceRecord() {
    this.maintenanceService.updateServiceRecord(this.invitationToken, this.serviceRecordFormGroup.value ).subscribe(() => {
      this.serviceRecord = this.serviceRecordFormGroup.value;
      this.showEditForm = false;
    })
  }

}