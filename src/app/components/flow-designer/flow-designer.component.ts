// components/flow-designer/flow-designer.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { FlowService } from '../../services/flow.service';
import { ApiService } from '../../services/api.service';
import { ServiceFlow, FlowNode, FlowConnection } from '../../models/flow.model';
import { NodeDialogComponent } from '../node-dialog/node-dialog.component';

@Component({
  selector: 'app-flow-designer',
  templateUrl: 'flow-designer.component.html',
  styleUrls: ['flow-designer.component.scss']
})
export class FlowDesignerComponent implements OnInit, OnDestroy {
  currentFlow: ServiceFlow | null = null;
  selectedNode: FlowNode | null = null;
  zoomLevel = 100;

  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private flowService: FlowService,
    private apiService: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Subscribe to flow changes
    this.subscriptions.push(
      this.flowService.currentFlow$.subscribe(flow => {
        this.currentFlow = flow;
      })
    );

    // Subscribe to selected node changes
    this.subscriptions.push(
      this.flowService.selectedNode$.subscribe(node => {
        this.selectedNode = node;
      })
    );

    // Load flow if ID provided in route
    const flowId = this.route.snapshot.paramMap.get('id');
    if (flowId) {
      this.loadFlow(parseInt(flowId));
    } else {
      // Create new flow
      const newFlow = this.flowService.createNewFlow();
      this.flowService.setCurrentFlow(newFlow);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadFlow(pageId: number): void {
    this.apiService.getPageWithFields(pageId).subscribe({
      next: (pageData) => {
        // Convert page data to flow format
        const flow: ServiceFlow = {
          id: pageId.toString(),
          name: pageData.name,
          description: pageData.description,
          nodes: this.convertPageToNodes(pageData),
          connections: [],
          metadata: {
            pageId: pageId,
            loaded: new Date()
          }
        };
        this.flowService.setCurrentFlow(flow);
      },
      error: (error) => {
        this.snackBar.open('Failed to load flow', 'Close', { duration: 3000 });
      }
    });
  }

  convertPageToNodes(pageData: any): FlowNode[] {
    const nodes: FlowNode[] = [];

    // Add start node
    nodes.push({
      id: 'start',
      type: 'start',
      label: 'Start',
      position: { x: 100, y: 100 },
      data: {},
      connections: []
    });

    // Add nodes for each category and field
    let yOffset = 200;
    pageData.categories?.forEach((category: any, index: number) => {
      const categoryNode: FlowNode = {
        id: `category-${category.id}`,
        type: 'page',
        label: category.name,
        position: { x: 300 + (index * 200), y: yOffset },
        data: {
          categoryId: category.id,
          fields: category.all_fields || []
        },
        connections: []
      };
      nodes.push(categoryNode);
    });

    return nodes;
  }

  onNodeDropped(nodeData: any): void {
    const newNode: FlowNode = {
      id: this.flowService.generateNodeId(nodeData.type),
      type: nodeData.type,
      label: nodeData.label,
      position: nodeData.position,
      data: nodeData.data || {},
      connections: []
    };

    this.flowService.addNode(newNode);
    this.snackBar.open(`${nodeData.label} added to flow`, 'Close', { duration: 2000 });
  }

  onNodeSelected(node: FlowNode): void {
    this.flowService.setSelectedNode(node);
  }

  onNodeDeleted(nodeId: string): void {
    this.flowService.removeNode(nodeId);
    this.snackBar.open('Node deleted', 'Close', { duration: 2000 });
  }

  onConnectionCreated(connection: FlowConnection): void {
    this.flowService.addConnection(connection);
  }

  onNodeUpdated(updatedNode: FlowNode): void {
    this.flowService.updateNode(updatedNode.id, updatedNode);
  }

  onCanvasUpdated(event: any): void {
    // Handle canvas events like zoom, pan, etc.
    if (event.type === 'zoom') {
      this.zoomLevel = Math.round(event.level * 100);
    }
  }

  saveFlow(): void {
    if (!this.currentFlow) return;

    // Convert flow back to API format and save
    this.snackBar.open('Flow saved successfully', 'Close', { duration: 3000 });
  }

  exportFlow(): void {
    if (!this.currentFlow) return;

    const dataStr = JSON.stringify(this.currentFlow, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `flow-${this.currentFlow.name.replace(/\s+/g, '-')}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    this.snackBar.open('Flow exported', 'Close', { duration: 2000 });
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
            this.snackBar.open('Flow imported successfully', 'Close', { duration: 3000 });
          } catch (error) {
            this.snackBar.open('Invalid flow file', 'Close', { duration: 3000 });
          }
        };
        reader.readAsText(file);
      }
    };

    input.click();
  }

  zoomIn(): void {
    this.zoomLevel = Math.min(200, this.zoomLevel + 25);
    // Emit zoom event to canvas
  }

  zoomOut(): void {
    this.zoomLevel = Math.max(25, this.zoomLevel - 25);
    // Emit zoom event to canvas
  }

  fitToScreen(): void {
    this.zoomLevel = 100;
    // Emit fit to screen event to canvas
  }
}
