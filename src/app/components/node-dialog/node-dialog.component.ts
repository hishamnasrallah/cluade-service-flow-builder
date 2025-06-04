// components/node-dialog/node-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FlowNode } from '../../models/flow.model';

@Component({
  selector: 'app-node-dialog',
  template: `
    <h2 mat-dialog-title>{{data.title}}</h2>

    <mat-dialog-content>
      <div class="dialog-content">
        <p>{{data.message}}</p>

        <div *ngIf="data.node" class="node-details">
          <h4>Node Details:</h4>
          <div class="detail-row">
            <strong>ID:</strong> {{data.node.id}}
          </div>
          <div class="detail-row">
            <strong>Type:</strong> {{data.node.type}}
          </div>
          <div class="detail-row">
            <strong>Label:</strong> {{data.node.label}}
          </div>
          <div class="detail-row">
            <strong>Position:</strong> ({{data.node.position.x}}, {{data.node.position.y}})
          </div>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onConfirm()" *ngIf="data.showConfirm">
        {{data.confirmText || 'Confirm'}}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-content {
      min-width: 300px;
      padding: 16px 0;
    }

    .node-details {
      margin-top: 16px;
      padding: 16px;
      background-color: #f5f5f5;
      border-radius: 4px;
    }

    .detail-row {
      margin-bottom: 8px;
    }

    .detail-row:last-child {
      margin-bottom: 0;
    }
  `]
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
