import { Component, OnInit, inject } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MaintenanceService } from '../maintenance.service';


export interface ShareData {
  invitationToken: string;
}

@Component({
    selector: 'app-share',
    templateUrl: './share.component.html',
    styleUrls: ['./share.component.scss'],
    standalone: false
})
export class ShareComponent implements OnInit {

  shareForm: UntypedFormGroup = new UntypedFormGroup({
    email: new UntypedFormControl('', [
      Validators.required
    ]),
  });
  emailSent = false;

  private dialogRef = inject(MatDialogRef<ShareComponent>);
  private maintenanceService = inject(MaintenanceService);
  



  shareVehicle() {
    this.maintenanceService.shareVehicle(this.data.invitationToken, this.shareForm.get('email')?.value).subscribe(() => {
      this.emailSent = true;
    });
  }

  closeDialog() {
    this.dialogRef.close();    
  }
}
