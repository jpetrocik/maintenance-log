import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ServiceDueRecord, ServiceRecord } from '../../maintenance.service';
import { FormGroup, FormControl } from '@angular/forms';

@Component({
  selector: 'app-service-due',
  templateUrl: './service-due.component.html',
  styleUrls: ['./service-due.component.scss'],
  standalone: false
})
export class ServiceDueComponent {

  @Input() serviceDue!: ServiceDueRecord;
  @Input() invitationToken!: string;
  @Output() serviceCompleted = new EventEmitter<ServiceRecord>();

  serviceCompleteFormGroup: FormGroup = new FormGroup({
    cost: new FormControl("", [
    ]),
    note: new FormControl("", [
    ]),
  });

  public showAdditionalFields = false;

  onServiceCompleted() {
    const serviceRecord: ServiceRecord = {
      description: this.serviceDue.description,
      ...this.serviceCompleteFormGroup.value
    }
      this.serviceCompleted.emit(serviceRecord);
  }

  public toggleShowAdditionalFields() {
    this.showAdditionalFields = !this.showAdditionalFields;
  }
}
