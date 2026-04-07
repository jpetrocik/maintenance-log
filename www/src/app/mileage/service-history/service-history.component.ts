import { Component, Input, OnChanges, SimpleChanges, inject, Output, EventEmitter } from '@angular/core';
import { ServiceRecord } from '../../maintenance.service';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../../confirmation-dialog/confirmation-dialog.component';


@Component({
  selector: 'app-service-history',
  templateUrl: './service-history.component.html',
  styleUrls: ['./service-history.component.scss'],
  standalone: false
})
export class ServiceHistoryComponent implements OnChanges {

  @Input() serviceRecord!: ServiceRecord;
  @Input() invitationToken!: string;
  @Output() serviceRecordDeleted = new EventEmitter<number>();
  @Output() serviceRecordUpdated = new EventEmitter<ServiceRecord>();


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

  private dialog = inject(MatDialog);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['serviceRecord']?.currentValue) {
      const serviceRecord = changes['serviceRecord'].currentValue;
      if (serviceRecord.serviceDate) {
        const serviceDate = new Date(serviceRecord.serviceDate);
        const formattedDate = serviceDate.toISOString().split('T')[0];
        this.serviceRecordFormGroup.patchValue({
          ...serviceRecord,
          serviceDate: formattedDate
        });
      } else {
        this.serviceRecordFormGroup.patchValue(serviceRecord);
      }
    }
  }

  updateServiceRecord() {
    this.serviceRecordUpdated.emit(this.serviceRecordFormGroup.value);
    this.showEditForm = false;
  }

  deleteServiceRecord(): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '250px',
      data: { title: 'Confirm Delete', message: 'Are you sure you want to delete this service record?' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.serviceRecordDeleted.emit(this.serviceRecord.id);
      }
    });
  }


}