// src/app/components/flow-canvas/flow-canvas.component.ts - CORRECTED VERSION
import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { ServiceFlow, FlowNode, FlowConnection } from '../../models/flow.model';

@Component({
  selector: 'app-flow-canvas',
  templateUrl: './flow-canvas.component.html',
  styleUrls: ['./flow-canvas.component.scss']
})
export class FlowCanvasComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() flow: ServiceFlow | null = null;
  @Output() nodeSelected = new EventEmitter<FlowNode>();
  @Output() nodeDeleted = new EventEmitter<string>();
  @Output() connectionCreated = new EventEmitter<FlowConnection>();
  @Output() canvasUpdated = new EventEmitter<any>();

  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef;
  @ViewChild('canvasWrapper', { static: true }) canvasWrapperRef!: ElementRef;
  @ViewChild('minimap') minimapRef?: ElementRef;

  // Add Math reference for template
  Math = Math;

  // Canvas state
  selectedNode: FlowNode | null = null;
  selectedConnection: string | null = null;
  highlightedNode: string | null = null;
  highlightedConnection: string | null = null;

  // Zoom and pan
  zoomLevel = 1;
  minZoom = 0.25;
  maxZoom = 3;
  panOffset = { x: 0, y: 0 };

  // Canvas dimensions
  canvasWidth = 4000;
  canvasHeight = 4000;

  // Grid
  gridSize = 20;
  gridOpacity = 0.5;

  // Minimap
  showMinimap = true;
  minimapScale = 0.03;
  minimapViewport = { x: 0, y: 0, width: 50, height: 30 };

  // Drag state
  isDragging = false;
  isPanning = false;
  dragStartPos = { x: 0, y: 0 };
  dragNode: FlowNode | null = null;
  panStartPos = { x: 0, y: 0 };

  // Connection state
  tempConnection: any = null;
  connectionStart: { node: FlowNode, type: 'input' | 'output', index?: number } | null = null;
  showConnectionPoints = false;
  showConnectionLabels = true;

  // Selection
  selectionRect: any = null;
  selectedNodes: FlowNode[] = [];

  // Context menu
  contextMenu = { show: false, x: 0, y: 0 };

  // Drop zone
  showDropZone = false;
  dropZone = { x: 0, y: 0 };

  // Validation
  showValidationPanel = false;
  nodeErrors: { [nodeId: string]: boolean } = {};
  nodeWarnings: { [nodeId: string]: boolean } = {};
  validationIssues: any[] = [];

  // Clipboard
  clipboard: FlowNode | null = null;

  constructor() {}

  ngOnInit(): void {
    this.setupEventListeners();
    this.initializeValidation();
  }

  ngAfterViewInit(): void {
    this.updateMinimap();
  }

  ngOnDestroy(): void {
    this.removeEventListeners();
  }

  private setupEventListeners(): void {
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.addEventListener('mouseup', this.onMouseUp.bind(this));
    document.addEventListener('keydown', this.onKeyDown.bind(this));
    document.addEventListener('click', this.onDocumentClick.bind(this));
  }

  private removeEventListeners(): void {
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('click', this.onDocumentClick);
  }

  private initializeValidation(): void {
    this.validateFlow();
  }

  // Node methods
  getNodeIcon(node: FlowNode): string {
    const iconMap: { [key: string]: string } = {
      'start': 'play_arrow',
      'end': 'stop',
      'page': 'description',
      'decision': 'help_outline',
      'condition': 'rule',
      'field': 'input',
      'validation': 'verified',
      'calculation': 'calculate',
      'api_call': 'api',
      'database': 'storage'
    };
    return iconMap[node.type] || 'crop_square';
  }

  getNodeSubtitle(node: FlowNode): string {
    switch (node.type) {
      case 'page':
        return `${node.data?.fields?.length || 0} fields`;
      case 'condition':
        return `${node.data?.rules?.length || 0} rules`;
      case 'decision':
        return 'Yes/No';
      default:
        return '';
    }
  }

  getNodeBodyContent(node: FlowNode): string {
    return node.data?.description || '';
  }

  getNodeStats(node: FlowNode): any[] {
    const stats = [];

    if (node.type === 'page' && node.data?.fields) {
      stats.push({ icon: 'input', value: node.data.fields.length });
    }

    if (node.type === 'condition' && node.data?.rules) {
      stats.push({ icon: 'rule', value: node.data.rules.length });
    }

    return stats;
  }

  // Connection methods
  canHaveInputConnection(node: FlowNode): boolean {
    return node.type !== 'start';
  }

  getOutputConnectionPoints(node: FlowNode): any[] {
    switch (node.type) {
      case 'decision':
        return [
          { label: 'Yes', condition: 'true' },
          { label: 'No', condition: 'false' }
        ];
      case 'condition':
        return [
          { label: 'True', condition: 'true' },
          { label: 'False', condition: 'false' }
        ];
      case 'end':
        return [];
      default:
        return [{ label: 'Next' }];
    }
  }

  getOutputConnectionPosition(node: FlowNode, index: number): number {
    const outputs = this.getOutputConnectionPoints(node);
    const spacing = 40;
    const startY = 20;
    return startY + (index * spacing);
  }

  isConnectionPointActive(node: FlowNode, type: 'input' | 'output', index?: number): boolean {
    return this.connectionStart?.node.id === node.id &&
      this.connectionStart?.type === type &&
      (index === undefined || this.connectionStart?.index === index);
  }

  getConnectionPath(connection: FlowConnection): string {
    const sourceNode = this.flow?.nodes.find(n => n.id === connection.sourceId);
    const targetNode = this.flow?.nodes.find(n => n.id === connection.targetId);

    if (!sourceNode || !targetNode) return '';

    const startX = sourceNode.position.x + 180; // Node width
    const startY = sourceNode.position.y + 30; // Node center
    const endX = targetNode.position.x;
    const endY = targetNode.position.y + 30;

    const controlPointDistance = Math.abs(endX - startX) * 0.4;
    const cp1X = startX + controlPointDistance;
    const cp1Y = startY;
    const cp2X = endX - controlPointDistance;
    const cp2Y = endY;

    return `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
  }

  getConnectionColor(connection: FlowConnection): string {
    if (this.selectedConnection === connection.id) return 'var(--primary-600)';
    if (this.highlightedConnection === connection.id) return 'var(--primary-400)';
    return 'var(--gray-500)';
  }

  getConnectionWidth(connection: FlowConnection): number {
    if (this.selectedConnection === connection.id) return 4;
    if (this.highlightedConnection === connection.id) return 3;
    return 2;
  }

  getConnectionMarker(connection: FlowConnection): string {
    return this.selectedConnection === connection.id ?
      'url(#arrowhead-selected)' : 'url(#arrowhead)';
  }

  getConnectionLabelPosition(connection: FlowConnection): { x: number, y: number } {
    const sourceNode = this.flow?.nodes.find(n => n.id === connection.sourceId);
    const targetNode = this.flow?.nodes.find(n => n.id === connection.targetId);

    if (!sourceNode || !targetNode) return { x: 0, y: 0 };

    const startX = sourceNode.position.x + 180;
    const startY = sourceNode.position.y + 30;
    const endX = targetNode.position.x;
    const endY = targetNode.position.y + 30;

    return {
      x: (startX + endX) / 2,
      y: (startY + endY) / 2 - 10
    };
  }

  getTempConnectionPath(): string {
    if (!this.tempConnection) return '';

    const { startX, startY, endX, endY } = this.tempConnection;
    const controlPointDistance = Math.abs(endX - startX) * 0.4;
    const cp1X = startX + controlPointDistance;
    const cp1Y = startY;
    const cp2X = endX - controlPointDistance;
    const cp2Y = endY;

    return `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
  }

  // Event handlers - simplified for brevity, add your existing implementation
  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.showDropZone = false;
    // Implementation...
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    // Implementation...
  }

  onCanvasClick(event: MouseEvent): void {
    // Implementation...
  }

  onCanvasMouseDown(event: MouseEvent): void {
    // Implementation...
  }

  onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    // Implementation...
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    // Implementation...
  }

  onMouseMove(event: MouseEvent): void {
    // Implementation...
  }

  onMouseUp(event: MouseEvent): void {
    // Implementation...
  }

  onKeyDown(event: KeyboardEvent): void {
    // Implementation...
  }

  onDocumentClick(event: MouseEvent): void {
    // Implementation...
  }

  // All other methods from your original implementation...
  selectNode(node: FlowNode, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedNode = node;
    this.selectedConnection = null;
    this.nodeSelected.emit(node);
  }

  highlightNode(nodeId: string | null): void {
    this.highlightedNode = nodeId;
  }

  highlightConnection(connectionId: string | null): void {
    this.highlightedConnection = connectionId;
  }

  selectConnection(connection: FlowConnection, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedConnection = connection.id;
    this.selectedNode = null;
  }

  startDrag(node: FlowNode, event: MouseEvent): void {
    // Implementation...
  }

  zoomIn(): void {
    if (this.zoomLevel < this.maxZoom) {
      this.zoomLevel = Math.min(this.maxZoom, this.zoomLevel + 0.25);
      this.updateMinimap();
    }
  }

  zoomOut(): void {
    if (this.zoomLevel > this.minZoom) {
      this.zoomLevel = Math.max(this.minZoom, this.zoomLevel - 0.25);
      this.updateMinimap();
    }
  }

  fitToScreen(): void {
    // Implementation...
  }

  centerView(): void {
    this.panOffset = { x: 0, y: 0 };
    this.updateMinimap();
  }

  toggleMinimap(): void {
    this.showMinimap = !this.showMinimap;
  }

  private updateMinimap(): void {
    // Implementation...
  }

  private snapToGrid(position: { x: number, y: number }): void {
    position.x = Math.round(position.x / this.gridSize) * this.gridSize;
    position.y = Math.round(position.y / this.gridSize) * this.gridSize;
  }

  // Validation methods
  validateFlow(): void {
    this.validationIssues = [];
    this.nodeErrors = {};
    this.nodeWarnings = {};

    if (!this.flow?.nodes) return;

    this.flow.nodes.forEach(node => {
      this.validateNode(node);
    });

    this.showValidationPanel = this.validationIssues.length > 0;
  }

  private validateNode(node: FlowNode): void {
    // Implementation...
  }

  private addValidationIssue(nodeId: string, type: 'error' | 'warning', title: string, description: string): void {
    this.validationIssues.push({ nodeId, type, title, description });

    if (type === 'error') {
      this.nodeErrors[nodeId] = true;
    } else {
      this.nodeWarnings[nodeId] = true;
    }
  }

  focusOnNode(nodeId: string): void {
    const node = this.flow?.nodes.find(n => n.id === nodeId);
    if (node) {
      this.selectedNode = node;
      this.nodeSelected.emit(node);
    }
  }

  // Add all other methods from your original implementation...
  editNode(node: FlowNode): void { this.nodeSelected.emit(node); }
  duplicateNode(node: FlowNode): void { /* Implementation */ }
  copyNode(node: FlowNode): void { this.clipboard = { ...node }; }
  deleteNode(node: FlowNode): void { this.nodeDeleted.emit(node.id); }
  addNoteToNode(node: FlowNode): void { /* Implementation */ }
  toggleNodeCollapse(node: FlowNode): void { node.collapsed = !node.collapsed; }
  selectAll(): void { /* Implementation */ }
  addNote(): void { /* Implementation */ }
  hasClipboardContent(): boolean { return !!this.clipboard; }
  pasteNode(): void { /* Implementation */ }
  autoLayout(): void { /* Implementation */ }
  startConnection(node: FlowNode, type: 'input' | 'output', event: MouseEvent, index?: number): void { /* Implementation */ }

  // Track by functions for performance
  trackByNodeId(index: number, node: FlowNode): string {
    return node.id;
  }

  trackByConnectionId(index: number, connection: FlowConnection): string {
    return connection.id;
  }
}
