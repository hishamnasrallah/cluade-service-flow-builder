// components/node-dialog/node-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FlowNode } from '../../models/flow.model';

@Component({
  selector: 'app-node-dialog',
  templateUrl: 'node-dialog.component.html',
  styleUrls: ['node-dialog.component.scss']
})
export class NodeDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<NodeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      title: string;
      message: string;
      node?: FlowNode;
      showConfirm?: boolean;
      confirmText?: string;
    }
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
