// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface DialogData {
  name: string;
  agentId: string;
  agentAliasId: string;
}

@Component({
  selector: 'app-add-agent',
  templateUrl: './add-agent.component.html',
  styleUrls: ['./add-agent.component.scss']
})
export class AddAgentComponent {

  constructor(public dialogRef: MatDialogRef<AddAgentComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,) { }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
