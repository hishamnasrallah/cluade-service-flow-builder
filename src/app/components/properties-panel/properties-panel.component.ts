// components/properties-panel/properties-panel.component.ts
import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FlowNode, Field, FieldType } from '../../models/flow.model';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-properties-panel',
  templateUrl: 'properties-panel.component.html',
  styleUrls: ['properties-panel.component.scss']
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
