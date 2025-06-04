// components/properties-panel/properties-panel.component.ts
import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FlowNode, Field, FieldType } from '../../models/flow.model';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-properties-panel',
  template: `
    <div class="properties-panel">
      <div class="panel-header">
        <h3>Properties</h3>
        <button mat-icon-button (click)="closePanel()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="panel-content" *ngIf="node">
        <form [formGroup]="propertiesForm" (ngSubmit)="saveChanges()">

          <!-- Basic Properties -->
          <mat-card class="properties-section">
            <mat-card-header>
              <mat-card-title>Basic Information</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Label</mat-label>
                <input matInput formControlName="label">
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Type</mat-label>
                <mat-select formControlName="type" (selectionChange)="onTypeChange()">
                  <mat-option value="start">Start</mat-option>
                  <mat-option value="end">End</mat-option>
                  <mat-option value="page">Page</mat-option>
                  <mat-option value="decision">Decision</mat-option>
                  <mat-option value="condition">Condition</mat-option>
                  <mat-option value="field">Field</mat-option>
                  <mat-option value="validation">Validation</mat-option>
                  <mat-option value="calculation">Calculation</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Description</mat-label>
                <textarea matInput formControlName="description" rows="3"></textarea>
              </mat-form-field>
            </mat-card-content>
          </mat-card>

          <!-- Position -->
          <mat-card class="properties-section">
            <mat-card-header>
              <mat-card-title>Position</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="position-inputs">
                <mat-form-field appearance="outline">
                  <mat-label>X</mat-label>
                  <input matInput type="number" formControlName="x">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Y</mat-label>
                  <input matInput type="number" formControlName="y">
                </mat-form-field>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Type-specific Properties -->
          <div [ngSwitch]="propertiesForm.get('type')?.value">

            <!-- Page Properties -->
            <mat-card class="properties-section" *ngSwitchCase="'page'">
              <mat-card-header>
                <mat-card-title>Page Configuration</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Service</mat-label>
                  <mat-select formControlName="service">
                    <mat-option *ngFor="let service of services" [value]="service.id">
                      {{service.name}}
                    </mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Page Name</mat-label>
                  <input matInput formControlName="pageName">
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Page Name (Arabic)</mat-label>
                  <input matInput formControlName="pageNameAra">
                </mat-form-field>

                <mat-slide-toggle formControlName="activeInd">
                  Active Page
                </mat-slide-toggle>
              </mat-card-content>
            </mat-card>

            <!-- Field Properties -->
            <mat-card class="properties-section" *ngSwitchCase="'field'">
              <mat-card-header>
                <mat-card-title>Field Configuration</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Field Name</mat-label>
                  <input matInput formControlName="fieldName">
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Display Name</mat-label>
                  <input matInput formControlName="fieldDisplayName">
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Field Type</mat-label>
                  <mat-select formControlName="fieldType">
                    <mat-option *ngFor="let type of fieldTypes" [value]="type.id">
                      {{type.name}}
                    </mat-option>
                  </mat-select>
                </mat-form-field>

                <div class="field-options">
                  <mat-slide-toggle formControlName="mandatory">
                    Mandatory Field
                  </mat-slide-toggle>

                  <mat-slide-toggle formControlName="hidden">
                    Hidden Field
                  </mat-slide-toggle>

                  <mat-slide-toggle formControlName="disabled">
                    Disabled Field
                  </mat-slide-toggle>
                </div>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Sequence</mat-label>
                  <input matInput type="number" formControlName="sequence">
                </mat-form-field>
              </mat-card-content>
            </mat-card>

            <!-- Condition Properties -->
            <mat-card class="properties-section" *ngSwitchCase="'condition'">
              <mat-card-header>
                <mat-card-title>Condition Logic</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Target Field</mat-label>
                  <mat-select formControlName="targetField">
                    <mat-option *ngFor="let field of availableFields" [value]="field.id">
                      {{field._field_display_name}}
                    </mat-option>
                  </mat-select>
                </mat-form-field>

                <div class="condition-builder">
                  <h4>Condition Rules</h4>
                  <div *ngFor="let rule of conditionRules; let i = index" class="condition-rule">
                    <mat-form-field appearance="outline">
                      <mat-label>Field</mat-label>
                      <input matInput [(ngModel)]="rule.field" [ngModelOptions]="{standalone: true}">
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Operation</mat-label>
                      <mat-select [(ngModel)]="rule.operation" [ngModelOptions]="{standalone: true}">
                        <mat-option value="=">=</mat-option>
                        <mat-option value="!=">!=</mat-option>
                        <mat-option value=">">></mat-option>
                        <mat-option value="<"><</mat-option>
                        <mat-option value=">=">>=</mat-option>
                        <mat-option value="<="><=</mat-option>
                        <mat-option value="contains">Contains</mat-option>
                        <mat-option value="startswith">Starts With</mat-option>
                      </mat-select>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Value</mat-label>
                      <input matInput [(ngModel)]="rule.value" [ngModelOptions]="{standalone: true}">
                    </mat-form-field>

                    <button mat-icon-button color="warn" (click)="removeConditionRule(i)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>

                  <button mat-stroked-button (click)="addConditionRule()">
                    <mat-icon>add</mat-icon>
                    Add Rule
                  </button>
                </div>
              </mat-card-content>
            </mat-card>

          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <button mat-raised-button color="primary" type="submit" [disabled]="propertiesForm.invalid">
              <mat-icon>save</mat-icon>
              Save Changes
            </button>
            <button mat-stroked-button type="button" (click)="resetForm()">
              <mat-icon>refresh</mat-icon>
              Reset
            </button>
            <button mat-stroked-button color="warn" type="button" (click)="deleteNode()">
              <mat-icon>delete</mat-icon>
              Delete Node
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .properties-panel {
      height: 100%;
      display: flex;
      flex-direction: column;
      background-color: white;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid #e0e0e0;
      background-color: #f5f5f5;
    }

    .panel-header h3 {
      margin: 0;
      color: #333;
    }

    .panel-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }

    .properties-section {
      margin-bottom: 16px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .position-inputs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .field-options {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin: 16px 0;
    }

    .condition-builder {
      margin-top: 16px;
    }

    .condition-rule {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr auto;
      gap: 8px;
      align-items: center;
      margin-bottom: 12px;
    }

    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 24px;
    }

    .action-buttons button {
      justify-content: flex-start;
    }
  `]
})
export class PropertiesPanelComponent implements OnInit, OnChanges {
  @Input() node: FlowNode | null = null;
  @Output() nodeUpdated = new EventEmitter<FlowNode>();
  @Output() nodeDeleted = new EventEmitter<string>();
  @Output() panelClosed = new EventEmitter<void>();

  propertiesForm: FormGroup;
  fieldTypes: FieldType[] = [];
  services: any[] = [];
  availableFields: Field[] = [];
  conditionRules: any[] = [];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService
  ) {
    this.propertiesForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadFieldTypes();
    this.loadServices();
    this.loadFields();
  }

  ngOnChanges(): void {
    if (this.node) {
      this.populateForm();
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      label: ['', Validators.required],
      type: ['', Validators.required],
      description: [''],
      x: [0, Validators.required],
      y: [0, Validators.required],

      // Page specific
      service: [''],
      pageName: [''],
      pageNameAra: [''],
      activeInd: [true],

      // Field specific
      fieldName: [''],
      fieldDisplayName: [''],
      fieldType: [''],
      mandatory: [false],
      hidden: [false],
      disabled: [false],
      sequence: [1],

      // Condition specific
      targetField: ['']
    });
  }

  populateForm(): void {
    if (!this.node) return;

    this.propertiesForm.patchValue({
      label: this.node.label,
      type: this.node.type,
      description: this.node.data?.description || '',
      x: this.node.position.x,
      y: this.node.position.y,

      // Page specific
      service: this.node.data?.service || '',
      pageName: this.node.data?.pageName || '',
      pageNameAra: this.node.data?.pageNameAra || '',
      activeInd: this.node.data?.activeInd !== false,

      // Field specific
      fieldName: this.node.data?.fieldName || '',
      fieldDisplayName: this.node.data?.fieldDisplayName || '',
      fieldType: this.node.data?.fieldType || '',
      mandatory: this.node.data?.mandatory || false,
      hidden: this.node.data?.hidden || false,
      disabled: this.node.data?.disabled || false,
      sequence: this.node.data?.sequence || 1,

      // Condition specific
      targetField: this.node.data?.targetField || ''
    });

    // Load condition rules if this is a condition node
    if (this.node.type === 'condition' && this.node.data?.conditionRules) {
      this.conditionRules = [...this.node.data.conditionRules];
    }
  }

  loadFieldTypes(): void {
    this.apiService.getActiveFieldTypes().subscribe({
      next: (types) => {
        this.fieldTypes = types;
      },
      error: (error) => {
        console.error('Failed to load field types:', error);
      }
    });
  }

  loadServices(): void {
    // Load services from lookup API
    // This would depend on your lookup API structure
    this.services = [
      { id: 1, name: 'Driver License Service' },
      { id: 2, name: 'Business Registration' },
      { id: 3, name: 'Permit Application' }
    ];
  }

  loadFields(): void {
    this.apiService.getFields({ active_ind: true }).subscribe({
      next: (response) => {
        this.availableFields = response.results || response;
      },
      error: (error) => {
        console.error('Failed to load fields:', error);
      }
    });
  }

  onTypeChange(): void {
    // Reset type-specific fields when type changes
    const type = this.propertiesForm.get('type')?.value;
    if (type !== 'condition') {
      this.conditionRules = [];
    }
  }

  addConditionRule(): void {
    this.conditionRules.push({
      field: '',
      operation: '=',
      value: ''
    });
  }

  removeConditionRule(index: number): void {
    this.conditionRules.splice(index, 1);
  }

  saveChanges(): void {
    if (this.propertiesForm.invalid || !this.node) return;

    const formData = this.propertiesForm.value;

    const updatedNode: FlowNode = {
      ...this.node,
      label: formData.label,
      type: formData.type,
      position: { x: formData.x, y: formData.y },
      data: {
        ...this.node.data,
        description: formData.description,

        // Page specific
        service: formData.service,
        pageName: formData.pageName,
        pageNameAra: formData.pageNameAra,
        activeInd: formData.activeInd,

        // Field specific
        fieldName: formData.fieldName,
        fieldDisplayName: formData.fieldDisplayName,
        fieldType: formData.fieldType,
        mandatory: formData.mandatory,
        hidden: formData.hidden,
        disabled: formData.disabled,
        sequence: formData.sequence,

        // Condition specific
        targetField: formData.targetField,
        conditionRules: [...this.conditionRules]
      }
    };

    this.nodeUpdated.emit(updatedNode);
  }

  resetForm(): void {
    this.populateForm();
  }

  deleteNode(): void {
    if (this.node) {
      this.nodeDeleted.emit(this.node.id);
    }
  }

  closePanel(): void {
    this.panelClosed.emit();
  }
}
