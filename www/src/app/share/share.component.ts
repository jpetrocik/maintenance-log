import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import {MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef} from '@angular/material/legacy-dialog';\nimport { MaintenanceService } from '../maintenance.service';

export interface ShareData {
  invitationToken: string;
}

@Component({
  selector: 'app-share',
  templateUrl: './share.component.html',
  styleUrls: ['./share.component.scss']
})
export class ShareComponent implements OnInit {

  shareForm: UntypedFormGroup;
  emailSent = false;

  constructor(private dialogRef: MatDialogRef<ShareComponent>,
    private maintenanceService: MaintenanceService,
    @Inject(MAT_DIALOG_DATA) public data: ShareData,) { 

    this.shareForm = new UntypedFormGroup({
      email: new UntypedFormControl('', [
        Validators.required
      ]),
    })

  }

  ngOnInit(): void {
  }

  shareVehicle() {
    this.maintenanceService.shareVehicle(this.data.invitationToken, this.shareForm.get('email')?.value).subscribe(() => {
      this.emailSent = true;
    });
  }

  closeDialog() {
    this.dialogRef.close();    
  }
}
