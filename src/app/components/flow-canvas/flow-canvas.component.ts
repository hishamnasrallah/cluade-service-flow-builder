// components/flow-canvas/flow-canvas.component.ts
import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { ServiceFlow, FlowNode, FlowConnection } from '../../models/flow.model';

@Component({
  selector: 'app-flow-canvas',
  template: `
    <div class="canvas-container">
      <div
        #canvas
        class="canvas"
        [style.transform]="'scale(' + zoomLevel + ')'"
        (drop)="onDrop($event)"
        (dragover)="onDragOver($event)"
        (click)="onCanvasClick($event)">

        <!-- Grid Background -->
        <div class="grid-background"></div>

        <!-- Connections -->
        <svg class="connections-layer" [attr.width]="canvasWidth" [attr.height]="canvasHeight">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7"
                    refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
            </marker>
          </defs>
          <path
            *ngFor="let connection of flow?.connections"
            [attr.d]="getConnectionPath(connection)"
            class="connection-path"
            [class.selected]="selectedConnection === connection.id"
            (click)="selectConnection(connection, $event)"
            stroke="#666"
            stroke-width="2"
            fill="none"
            marker-end="url(#arrowhead)">
          </path>
        </svg>

        <!-- Nodes -->
        <div
          *ngFor="let node of flow?.nodes"
          class="flow-node"
          [class.selected]="selectedNode?.id === node.id"
          [class]="'node-type-' + node.type"
          [style.left.px]="node.position.x"
          [style.top.px]="node.position.y"
          (click)="selectNode(node, $event)"
          (mousedown)="startDrag(node, $event)"
          [attr.data-node-id]="node.id">

          <!-- Node Header -->
          <div class="node-header">
            <mat-icon class="node-icon">{{getNodeIcon(node)}}</mat-icon>
            <span class="node-title">{{node.label}}</span>
            <button
              mat-icon-button
              class="node-menu-button"
              [matMenuTriggerFor]="nodeMenu"
              (click)="$event.stopPropagation()">
              <mat-icon>more_vert</mat-icon>
            </button>
          </div>

          <!-- Node Content -->
          <div class="node-content" *ngIf="node.data?.description">
            <p>{{node.data.description}}</p>
          </div>

          <!-- Connection Points -->
          <div class="connection-points">
            <div
              class="connection-point input"
              *ngIf="node.type !== 'start'"
              (mousedown)="startConnection(node, 'input', $event)">
            </div>
            <div
              class="connection-point output"
              *ngIf="node.type !== 'end'"
              (mousedown)="startConnection(node, 'output', $event)">
            </div>
          </div>

          <!-- Node Menu -->
          <mat-menu #nodeMenu="matMenu">
            <button mat-menu-item (click)="editNode(node)">
              <mat-icon>edit</mat-icon>
              <span>Edit</span>
            </button>
            <button mat-menu-item (click)="duplicateNode(node)">
              <mat-icon>content_copy</mat-icon>
              <span>Duplicate</span>
            </button>
            <button mat-menu-item (click)="deleteNode(node)" class="delete-item">
              <mat-icon>delete</mat-icon>
              <span>Delete</span>
            </button>
          </mat-menu>
        </div>

        <!-- Temporary Connection Line -->
        <svg class="temp-connection" *ngIf="tempConnection" [attr.width]="canvasWidth" [attr.height]="canvasHeight">
          <line
            [attr.x1]="tempConnection.startX"
            [attr.y1]="tempConnection.startY"
            [attr.x2]="tempConnection.endX"
            [attr.y2]="tempConnection.endY"
            stroke="#2196F3"
            stroke-width="2"
            stroke-dasharray="5,5">
          </line>
        </svg>
      </div>

      <!-- Canvas Controls -->
      <div class="canvas-controls">
        <button mat-mini-fab color="primary" matTooltip="Zoom In" (click)="zoomIn()">
          <mat-icon>zoom_in</mat-icon>
        </button>
        <button mat-mini-fab color="primary" matTooltip="Zoom Out" (click)="zoomOut()">
          <mat-icon>zoom_out</mat-icon>
        </button>
        <button mat-mini-fab color="primary" matTooltip="Fit to Screen" (click)="fitToScreen()">
          <mat-icon>fit_screen</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .canvas-container {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: auto;
      background: linear-gradient(90deg, #f0f0f0 1px, transparent 1px),
      linear-gradient(#f0f0f0 1px, transparent 1px);
      background-size: 20px 20px;
    }

    .canvas {
      position: relative;
      min-width: 2000px;
      min-height: 2000px;
      transform-origin: 0 0;
      transition: transform 0.2s ease;
    }

    .grid-background {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }

    .connections-layer, .temp-connection {
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: none;
      z-index: 1;
    }

    .connection-path {
      cursor: pointer;
      pointer-events: stroke;
      stroke-width: 8px;
      stroke: transparent;
    }

    .connection-path:hover {
      stroke: #2196F3 !important;
      stroke-width: 3px;
    }

    .connection-path.selected {
      stroke: #2196F3 !important;
      stroke-width: 3px;
    }

    .flow-node {
      position: absolute;
      min-width: 150px;
      background: white;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      cursor: pointer;
      z-index: 10;
      transition: all 0.2s ease;
    }

    .flow-node:hover {
      border-color: #2196F3;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }

    .flow-node.selected {
      border-color: #2196F3;
      box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.3);
    }

    .flow-node.dragging {
      transform: rotate(5deg);
      opacity: 0.8;
    }

    /* Node Type Styles */
    .node-type-start {
      border-color: #4CAF50;
      background: linear-gradient(135deg, #4CAF50, #45a049);
      color: white;
    }

    .node-type-end {
      border-color: #f44336;
      background: linear-gradient(135deg, #f44336, #e53935);
      color: white;
    }

    .node-type-decision {
      border-color: #FF9800;
      background: linear-gradient(135deg, #FF9800, #f57c00);
      color: white;
      border-radius: 50%;
      min-width: 120px;
      height: 120px;
    }

    .node-type-page {
      border-color: #2196F3;
      background: linear-gradient(135deg, #ffffff, #f5f5f5);
    }

    .node-header {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      border-bottom: 1px solid #e0e0e0;
      background: rgba(255,255,255,0.9);
      border-radius: 6px 6px 0 0;
    }

    .node-type-start .node-header,
    .node-type-end .node-header,
    .node-type-decision .node-header {
      border-bottom: none;
      background: transparent;
    }

    .node-icon {
      margin-right: 8px;
      font-size: 18px;
    }

    .node-title {
      flex: 1;
      font-weight: 500;
      font-size: 14px;
    }

    .node-menu-button {
      width: 24px;
      height: 24px;
      line-height: 24px;
    }

    .node-content {
      padding: 12px;
      font-size: 12px;
      color: #666;
      max-width: 200px;
      word-wrap: break-word;
    }

    .connection-points {
      position: absolute;
    }

    .connection-point {
      width: 12px;
      height: 12px;
      border: 2px solid #2196F3;
      border-radius: 50%;
      background: white;
      position: absolute;
      cursor: crosshair;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .flow-node:hover .connection-point {
      opacity: 1;
    }

    .connection-point.input {
      top: -6px;
      left: 50%;
      transform: translateX(-50%);
    }

    .connection-point.output {
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%);
    }

    .canvas-controls {
      position: absolute;
      bottom: 20px;
      right: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .delete-item {
      color: #f44336;
    }
  `]
})
export class FlowCanvasComponent implements OnInit, OnDestroy {
  @Input() flow: ServiceFlow | null = null;
  @Output() nodeSelected = new EventEmitter<FlowNode>();
  @Output() nodeDeleted = new EventEmitter<string>();
  @Output() connectionCreated = new EventEmitter<FlowConnection>();
  @Output() canvasUpdated = new EventEmitter<any>();

  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef;

  selectedNode: FlowNode | null = null;
  selectedConnection: string | null = null;
  zoomLevel = 1;
  canvasWidth = 2000;
  canvasHeight = 2000;

  // Drag state
  isDragging = false;
  dragStartPos = { x: 0, y: 0 };
  dragNode: FlowNode | null = null;

  // Connection state
  tempConnection: any = null;
  connectionStart: { node: FlowNode, type: 'input' | 'output' } | null = null;

  constructor() {}

  ngOnInit(): void {
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.addEventListener('mouseup', this.onMouseUp.bind(this));
  }

  ngOnDestroy(): void {
    document.removeEventListener('mousemove', this.onMouseMove.bind(this));
    document.removeEventListener('mouseup', this.onMouseUp.bind(this));
  }

  getNodeIcon(node: FlowNode): string {
    const iconMap: { [key: string]: string } = {
      'start': 'play_circle',
      'end': 'stop_circle',
      'page': 'description',
      'decision': 'help',
      'condition': 'rule',
      'field': 'input',
      'validation': 'verified',
      'calculation': 'calculate',
      'api_call': 'api',
      'database': 'storage'
    };
    return iconMap[node.type] || 'crop_square';
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const data = event.dataTransfer?.getData('application/json');
    if (data) {
      const itemData = JSON.parse(data);
      const rect = this.canvasRef.nativeElement.getBoundingClientRect();
      const position = {
        x: (event.clientX - rect.left) / this.zoomLevel,
        y: (event.clientY - rect.top) / this.zoomLevel
      };

      const nodeData = {
        ...itemData,
        position
      };

      // Emit to parent
      this.nodeSelected.emit(nodeData);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onCanvasClick(event: MouseEvent): void {
    if (event.target === this.canvasRef.nativeElement) {
      this.selectedNode = null;
      this.selectedConnection = null;
      this.nodeSelected.emit(null as any);
    }
  }

  selectNode(node: FlowNode, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedNode = node;
    this.selectedConnection = null;
    this.nodeSelected.emit(node);
  }

  selectConnection(connection: FlowConnection, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedConnection = connection.id;
    this.selectedNode = null;
  }

  startDrag(node: FlowNode, event: MouseEvent): void {
    if (event.button !== 0) return; // Only left click

    this.isDragging = true;
    this.dragNode = node;
    this.dragStartPos = {
      x: event.clientX - node.position.x * this.zoomLevel,
      y: event.clientY - node.position.y * this.zoomLevel
    };

    const nodeElement = event.currentTarget as HTMLElement;
    nodeElement.classList.add('dragging');

    event.preventDefault();
  }

  startConnection(node: FlowNode, type: 'input' | 'output', event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();

    this.connectionStart = { node, type };

    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const nodeRect = (event.currentTarget as HTMLElement).getBoundingClientRect();

    this.tempConnection = {
      startX: (nodeRect.left + nodeRect.width / 2 - rect.left) / this.zoomLevel,
      startY: (nodeRect.top + nodeRect.height / 2 - rect.top) / this.zoomLevel,
      endX: (event.clientX - rect.left) / this.zoomLevel,
      endY: (event.clientY - rect.top) / this.zoomLevel
    };
  }

  onMouseMove(event: MouseEvent): void {
    if (this.isDragging && this.dragNode) {
      const newX = (event.clientX - this.dragStartPos.x) / this.zoomLevel;
      const newY = (event.clientY - this.dragStartPos.y) / this.zoomLevel;

      this.dragNode.position = { x: newX, y: newY };
    }

    if (this.tempConnection) {
      const rect = this.canvasRef.nativeElement.getBoundingClientRect();
      this.tempConnection.endX = (event.clientX - rect.left) / this.zoomLevel;
      this.tempConnection.endY = (event.clientY - rect.top) / this.zoomLevel;
    }
  }

  onMouseUp(event: MouseEvent): void {
    if (this.isDragging) {
      this.isDragging = false;
      const draggedElement = document.querySelector('.dragging');
      if (draggedElement) {
        draggedElement.classList.remove('dragging');
      }
      this.dragNode = null;
    }

    if (this.tempConnection && this.connectionStart) {
      // Check if we're over a valid connection point
      const target = event.target as HTMLElement;
      if (target && target.classList.contains('connection-point')) {
        const targetNodeId = target.closest('.flow-node')?.getAttribute('data-node-id');
        const targetNode = this.flow?.nodes.find(n => n.id === targetNodeId);

        if (targetNode && targetNode.id !== this.connectionStart.node.id) {
          const connection: FlowConnection = {
            id: `conn-${Date.now()}`,
            sourceId: this.connectionStart.node.id,
            targetId: targetNode.id,
            label: ''
          };

          this.connectionCreated.emit(connection);
        }
      }

      this.tempConnection = null;
      this.connectionStart = null;
    }
  }

  getConnectionPath(connection: FlowConnection): string {
    const sourceNode = this.flow?.nodes.find(n => n.id === connection.sourceId);
    const targetNode = this.flow?.nodes.find(n => n.id === connection.targetId);

    if (!sourceNode || !targetNode) return '';

    const startX = sourceNode.position.x + 75; // Node center
    const startY = sourceNode.position.y + 60; // Node bottom
    const endX = targetNode.position.x + 75;
    const endY = targetNode.position.y;

    const midY = startY + (endY - startY) / 2;

    return `M ${startX} ${startY}
            C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
  }

  editNode(node: FlowNode): void {
    // Open edit dialog
    console.log('Edit node:', node);
  }

  duplicateNode(node: FlowNode): void {
    // Create duplicate with offset position
    const duplicate = {
      ...node,
      id: `${node.type}-${Date.now()}`,
      position: { x: node.position.x + 20, y: node.position.y + 20 }
    };

    if (this.flow) {
      this.flow.nodes.push(duplicate);
    }
  }

  deleteNode(node: FlowNode): void {
    this.nodeDeleted.emit(node.id);
  }

  zoomIn(): void {
    this.zoomLevel = Math.min(2, this.zoomLevel + 0.25);
    this.canvasUpdated.emit({ type: 'zoom', level: this.zoomLevel });
  }

  zoomOut(): void {
    this.zoomLevel = Math.max(0.25, this.zoomLevel - 0.25);
    this.canvasUpdated.emit({ type: 'zoom', level: this.zoomLevel });
  }

  fitToScreen(): void {
    this.zoomLevel = 1;
    this.canvasUpdated.emit({ type: 'zoom', level: this.zoomLevel });
  }
}
