// src/app/components/flow-designer/flow-designer.component.ts - FIXED VERSION
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { FlowService } from '../../services/flow.service';
import { ApiService } from '../../services/api.service';
import { ServiceFlow, FlowNode, FlowConnection } from '../../models/flow.model';

@Component({
  selector: 'app-flow-designer',
  templateUrl: './flow-designer.component.html',
  styleUrls: ['./flow-designer.component.scss']
})
export class FlowDesignerComponent implements OnInit, OnDestroy {
  currentFlow: ServiceFlow | null = null;
  selectedNode: FlowNode | null = null;
  zoomLevel = 100;
  isSaved = true;

  private subscriptions: Subscription[] = [];
  private autoSaveTimer: any;

  constructor(
    private route: ActivatedRoute,
    private flowService: FlowService,
    private apiService: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.setupSubscriptions();
    this.loadFlowFromRoute();
    this.setupAutoSave();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
  }

  private setupSubscriptions(): void {
    // Subscribe to flow changes
    this.subscriptions.push(
      this.flowService.currentFlow$.subscribe(flow => {
        this.currentFlow = flow;
        this.markAsUnsaved();
      })
    );

    // Subscribe to selected node changes
    this.subscriptions.push(
      this.flowService.selectedNode$.subscribe(node => {
        this.selectedNode = node;
      })
    );
  }

  private loadFlowFromRoute(): void {
    const flowId = this.route.snapshot.paramMap.get('id');
    if (flowId) {
      this.loadFlow(parseInt(flowId));
    } else {
      this.createNewFlow();
    }
  }

  private setupAutoSave(): void {
    // Auto-save every 30 seconds if there are unsaved changes
    this.autoSaveTimer = setInterval(() => {
      if (!this.isSaved && this.currentFlow) {
        this.saveFlow(true); // Silent save
      }
    }, 30000);
  }

  loadFlow(pageId: number): void {
    this.apiService.getPageWithFields(pageId).subscribe({
      next: (pageData) => {
        const flow: ServiceFlow = {
          id: pageId.toString(),
          name: pageData.name,
          description: pageData.description,
          nodes: this.convertPageToNodes(pageData),
          connections: [],
          metadata: {
            pageId: pageId,
            loaded: new Date(),
            version: '1.0'
          }
        };
        this.flowService.setCurrentFlow(flow);
        this.isSaved = true;
      },
      error: (error) => {
        console.error('Failed to load flow:', error);
        this.showSnackBar('Failed to load flow', 'error');
      }
    });
  }

  createNewFlow(): void {
    const newFlow = this.flowService.createNewFlow();
    this.flowService.setCurrentFlow(newFlow);
    this.isSaved = false;
  }

  convertPageToNodes(pageData: any): FlowNode[] {
    const nodes: FlowNode[] = [];

    // Add start node
    nodes.push({
      id: 'start-1',
      type: 'start',
      label: 'Start',
      position: { x: 100, y: 100 },
      data: { description: 'Flow entry point' },
      connections: []
    });

    // Add nodes for categories and fields
    let yOffset = 200;
    let xOffset = 300;

    pageData.categories?.forEach((category: any, index: number) => {
      const categoryNode: FlowNode = {
        id: `category-${category.id}`,
        type: 'page',
        label: category.name,
        position: { x: xOffset + (index * 200), y: yOffset },
        data: {
          categoryId: category.id,
          description: `Category: ${category.name}`,
          fields: category.all_fields || []
        },
        connections: []
      };
      nodes.push(categoryNode);

      // Add field nodes for each category
      category.all_fields?.forEach((field: any, fieldIndex: number) => {
        const fieldNode: FlowNode = {
          id: `field-${field.id}`,
          type: 'field',
          label: field._field_display_name || field._field_name,
          position: {
            x: xOffset + (index * 200),
            y: yOffset + 120 + (fieldIndex * 80)
          },
          data: {
            fieldId: field.id,
            fieldName: field._field_name,
            fieldType: field._field_type,
            mandatory: field._mandatory,
            description: `Input field: ${field._field_display_name || field._field_name}`
          },
          connections: []
        };
        nodes.push(fieldNode);
      });
    });

    return nodes;
  }

  onNodeDropped(nodeData: any): void {
    const newNode: FlowNode = {
      id: this.flowService.generateNodeId(nodeData.type),
      type: nodeData.type,
      label: nodeData.label,
      position: nodeData.position || { x: 400, y: 300 },
      data: nodeData.data || { description: nodeData.description },
      connections: []
    };

    this.flowService.addNode(newNode);
    this.showSnackBar(`${nodeData.label} added to flow`, 'success');
  }

  onNodeSelected(node: FlowNode): void {
    this.flowService.setSelectedNode(node);
  }

  onNodeDeleted(nodeId: string): void {
    this.flowService.removeNode(nodeId);
    this.showSnackBar('Node deleted', 'info');
  }

  onConnectionCreated(connection: FlowConnection): void {
    this.flowService.addConnection(connection);
    this.markAsUnsaved();
  }

  onNodeUpdated(updatedNode: FlowNode): void {
    this.flowService.updateNode(updatedNode.id, updatedNode);
    this.markAsUnsaved();
  }

  onCanvasUpdated(event: any): void {
    if (event.type === 'zoom') {
      this.zoomLevel = Math.round(event.level * 100);
    }
    // Don't mark as unsaved for view changes like zoom/pan
  }

  closePropertiesPanel(): void {
    this.flowService.setSelectedNode(null);
  }

  saveFlow(silent = false): void {
    if (!this.currentFlow) return;

    const saveData = {
      name: this.currentFlow.name,
      description: this.currentFlow.description,
      flow_data: {
        nodes: this.currentFlow.nodes,
        connections: this.currentFlow.connections,
        metadata: this.currentFlow.metadata
      }
    };

    // Simulate API save - replace with actual API call
    setTimeout(() => {
      this.isSaved = true;
      if (!silent) {
        this.showSnackBar('Flow saved successfully', 'success');
      }
    }, 500);

    // Actual API implementation would be:
    // this.apiService.updatePage(this.currentFlow.metadata.pageId, saveData).subscribe({
    //   next: () => {
    //     this.isSaved = true;
    //     if (!silent) {
    //       this.showSnackBar('Flow saved successfully', 'success');
    //     }
    //   },
    //   error: (error) => {
    //     console.error('Save failed:', error);
    //     this.showSnackBar('Failed to save flow', 'error');
    //   }
    // });
  }

  exportFlow(): void {
    if (!this.currentFlow) return;

    const dataStr = JSON.stringify(this.currentFlow, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `${this.currentFlow.name.replace(/\s+/g, '-')}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    this.showSnackBar('Flow exported successfully', 'success');
  }

  importFlow(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          try {
            const flow = JSON.parse(e.target.result);
            this.flowService.setCurrentFlow(flow);
            this.showSnackBar('Flow imported successfully', 'success');
          } catch (error) {
            console.error('Import failed:', error);
            this.showSnackBar('Invalid flow file', 'error');
          }
        };
        reader.readAsText(file);
      }
    };

    input.click();
  }

  validateFlow(): void {
    if (!this.currentFlow) return;

    const issues: string[] = [];

    // Check for nodes without connections
    const connectedNodeIds = new Set();
    this.currentFlow.connections.forEach(conn => {
      connectedNodeIds.add(conn.sourceId);
      connectedNodeIds.add(conn.targetId);
    });

    const isolatedNodes = this.currentFlow.nodes.filter(node =>
      !connectedNodeIds.has(node.id) && node.type !== 'start' && node.type !== 'end'
    );

    if (isolatedNodes.length > 0) {
      issues.push(`${isolatedNodes.length} isolated nodes found`);
    }

    // Check for start and end nodes
    const hasStart = this.currentFlow.nodes.some(node => node.type === 'start');
    const hasEnd = this.currentFlow.nodes.some(node => node.type === 'end');

    if (!hasStart) issues.push('No start node found');
    if (!hasEnd) issues.push('No end node found');

    if (issues.length === 0) {
      this.showSnackBar('Flow validation passed!', 'success');
    } else {
      this.showSnackBar(`Validation issues: ${issues.join(', ')}`, 'warning');
    }
  }

  previewFlow(): void {
    this.showSnackBar('Preview functionality coming soon', 'info');
  }

  private markAsUnsaved(): void {
    this.isSaved = false;
  }

  private showSnackBar(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    const config = {
      duration: 3000,
      panelClass: [`${type}-snackbar`]
    };

    this.snackBar.open(message, 'Close', config);
  }
}
