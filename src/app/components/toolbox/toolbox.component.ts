
// components/toolbox/toolbox.component.ts
import { Component, EventEmitter, Output } from '@angular/core';

interface ToolboxItem {
  type: string;
  label: string;
  icon: string;
  description: string;
  category: string;
}

@Component({
  selector: 'app-toolbox',
  template: `
    <div class="toolbox-container">
      <div class="toolbox-header">
        <h3>Toolbox</h3>
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search...</mat-label>
          <input matInput [(ngModel)]="searchTerm" (input)="filterItems()">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
      </div>

      <div class="toolbox-content">
        <mat-accordion multi="true">
          <mat-expansion-panel
            *ngFor="let category of filteredCategories"
            [expanded]="true"
            class="category-panel">
            <mat-expansion-panel-header>
              <mat-panel-title>{{category}}</mat-panel-title>
            </mat-expansion-panel-header>

            <div class="items-grid">
              <div
                *ngFor="let item of getItemsByCategory(category)"
                class="toolbox-item"
                [matTooltip]="item.description"
                draggable="true"
                (dragstart)="onDragStart($event, item)"
                (click)="addToCanvas(item)">
                <mat-icon class="item-icon">{{item.icon}}</mat-icon>
                <span class="item-label">{{item.label}}</span>
              </div>
            </div>
          </mat-expansion-panel>
        </mat-accordion>
      </div>
    </div>
  `,
  styles: [`
    .toolbox-container {
      height: 100%;
      display: flex;
      flex-direction: column;
      background-color: white;
    }

    .toolbox-header {
      padding: 16px;
      border-bottom: 1px solid #e0e0e0;
    }

    .toolbox-header h3 {
      margin: 0 0 16px 0;
      color: #333;
      font-weight: 500;
    }

    .search-field {
      width: 100%;
    }

    .toolbox-content {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    }

    .category-panel {
      margin-bottom: 8px;
    }

    .items-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      padding: 8px 0;
    }

    .toolbox-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px 8px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      cursor: grab;
      transition: all 0.2s ease-in-out;
      background-color: white;
    }

    .toolbox-item:hover {
      border-color: #2196F3;
      background-color: #f5f5f5;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }

    .toolbox-item:active {
      cursor: grabbing;
      transform: scale(0.95);
    }

    .item-icon {
      color: #2196F3;
      margin-bottom: 4px;
    }

    .item-label {
      font-size: 11px;
      text-align: center;
      color: #666;
      font-weight: 500;
    }
  `]
})
export class ToolboxComponent {
  @Output() nodeDropped = new EventEmitter<any>();

  searchTerm = '';

  toolboxItems: ToolboxItem[] = [
    // Flow Control
    { type: 'start', label: 'Start', icon: 'play_circle', description: 'Flow start point', category: 'Flow Control' },
    { type: 'end', label: 'End', icon: 'stop_circle', description: 'Flow end point', category: 'Flow Control' },
    { type: 'decision', label: 'Decision', icon: 'help', description: 'Decision branch', category: 'Flow Control' },
    { type: 'condition', label: 'Condition', icon: 'rule', description: 'Conditional logic', category: 'Flow Control' },

    // Form Elements
    { type: 'page', label: 'Page', icon: 'description', description: 'Form page/step', category: 'Form Elements' },
    { type: 'field', label: 'Field', icon: 'input', description: 'Form field', category: 'Form Elements' },
    { type: 'category', label: 'Category', icon: 'category', description: 'Field category', category: 'Form Elements' },

    // Actions
    { type: 'validation', label: 'Validation', icon: 'verified', description: 'Data validation', category: 'Actions' },
    { type: 'calculation', label: 'Calculate', icon: 'calculate', description: 'Perform calculation', category: 'Actions' },
    { type: 'notification', label: 'Notify', icon: 'notifications', description: 'Send notification', category: 'Actions' },

    // Integration
    { type: 'api_call', label: 'API Call', icon: 'api', description: 'External API call', category: 'Integration' },
    { type: 'database', label: 'Database', icon: 'storage', description: 'Database operation', category: 'Integration' },
    { type: 'service', label: 'Service', icon: 'settings', description: 'External service', category: 'Integration' }
  ];

  filteredItems: ToolboxItem[] = [...this.toolboxItems];
  filteredCategories: string[] = [];

  constructor() {
    this.updateCategories();
  }

  filterItems(): void {
    if (!this.searchTerm.trim()) {
      this.filteredItems = [...this.toolboxItems];
    } else {
      this.filteredItems = this.toolboxItems.filter(item =>
        item.label.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
    this.updateCategories();
  }

  updateCategories(): void {
    this.filteredCategories = [...new Set(this.filteredItems.map(item => item.category))];
  }

  getItemsByCategory(category: string): ToolboxItem[] {
    return this.filteredItems.filter(item => item.category === category);
  }

  onDragStart(event: DragEvent, item: ToolboxItem): void {
    if (event.dataTransfer) {
      event.dataTransfer.setData('application/json', JSON.stringify(item));
      event.dataTransfer.effectAllowed = 'copy';
    }
  }

  addToCanvas(item: ToolboxItem): void {
    const nodeData = {
      type: item.type,
      label: item.label,
      position: { x: 400, y: 300 }, // Default position
      data: {
        description: item.description,
        icon: item.icon
      }
    };

    this.nodeDropped.emit(nodeData);
  }
}
