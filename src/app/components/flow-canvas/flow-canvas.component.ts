// components/flow-canvas/flow-canvas.component.ts - Enhanced with modern UI/UX
import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { ServiceFlow, FlowNode, FlowConnection } from '../../models/flow.model';

@Component({
  selector: 'app-flow-canvas',
  templateUrl: './flow-canvas.component.html',
  styleUrls: ['./flow-canvas.component.css']
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
    // Initialize validation system
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

  // Event handlers
  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.showDropZone = false;

    const data = event.dataTransfer?.getData('application/json');
    if (data) {
      const itemData = JSON.parse(data);
      const rect = this.canvasRef.nativeElement.getBoundingClientRect();
      const position = {
        x: (event.clientX - rect.left) / this.zoomLevel - this.panOffset.x,
        y: (event.clientY - rect.top) / this.zoomLevel - this.panOffset.y
      };

      this.snapToGrid(position);

      const nodeData = {
        ...itemData,
        position
      };

      this.nodeSelected.emit(nodeData);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();

    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.dropZone = {
      x: (event.clientX - rect.left) / this.zoomLevel - this.panOffset.x,
      y: (event.clientY - rect.top) / this.zoomLevel - this.panOffset.y
    };
    this.showDropZone = true;
  }

  onCanvasClick(event: MouseEvent): void {
    if (event.target === this.canvasRef.nativeElement) {
      this.selectedNode = null;
      this.selectedConnection = null;
      this.nodeSelected.emit(null as any);
      this.hideContextMenu();
    }
  }

  onCanvasMouseDown(event: MouseEvent): void {
    if (event.button === 2) return; // Right click

    if (event.target === this.canvasWrapperRef.nativeElement ||
      event.target === this.canvasRef.nativeElement) {
      this.startPan(event);
    }
  }

  onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    this.showContextMenu(event.clientX, event.clientY);
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();

    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.min(this.maxZoom, Math.max(this.minZoom, this.zoomLevel + delta));

    if (newZoom !== this.zoomLevel) {
      this.zoomLevel = newZoom;
      this.updateMinimap();
      this.canvasUpdated.emit({ type: 'zoom', level: this.zoomLevel });
    }
  }

  onMouseMove(event: MouseEvent): void {
    this.updateTempConnection(event);

    if (this.isDragging && this.dragNode) {
      this.handleNodeDrag(event);
    }

    if (this.isPanning) {
      this.handlePan(event);
    }
  }

  onMouseUp(event: MouseEvent): void {
    this.finishDrag();
    this.finishPan();
    this.finishConnection(event);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'a':
          event.preventDefault();
          this.selectAll();
          break;
        case 'c':
          event.preventDefault();
          this.copySelectedNode();
          break;
        case 'v':
          event.preventDefault();
          this.pasteNode();
          break;
        case 'z':
          event.preventDefault();
          // Implement undo
          break;
      }
    } else {
      switch (event.key) {
        case 'Delete':
        case 'Backspace':
          this.deleteSelectedNodes();
          break;
        case 'Escape':
          this.clearSelection();
          this.hideContextMenu();
          break;
      }
    }
  }

  onDocumentClick(event: MouseEvent): void {
    this.hideContextMenu();
  }

  // Node interaction
  selectNode(node: FlowNode, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedNode = node;
    this.selectedConnection = null;
    this.nodeSelected.emit(node);
    this.hideContextMenu();
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
    this.hideContextMenu();
  }

  startDrag(node: FlowNode, event: MouseEvent): void {
    if (event.button !== 0) return;

    this.isDragging = true;
    this.dragNode = node;
    this.dragStartPos = {
      x: event.clientX - node.position.x * this.zoomLevel,
      y: event.clientY - node.position.y * this.zoomLevel
    };

    event.preventDefault();
  }

  private handleNodeDrag(event: MouseEvent): void {
    if (!this.dragNode) return;

    const newX = (event.clientX - this.dragStartPos.x) / this.zoomLevel;
    const newY = (event.clientY - this.dragStartPos.y) / this.zoomLevel;

    const position = { x: newX, y: newY };
    this.snapToGrid(position);

    this.dragNode.position = position;
  }

  private finishDrag(): void {
    if (this.isDragging) {
      this.isDragging = false;
      this.dragNode = null;
    }
  }

  // Pan functionality
  startPan(event: MouseEvent): void {
    this.isPanning = true;
    this.panStartPos = {
      x: event.clientX - this.panOffset.x,
      y: event.clientY - this.panOffset.y
    };
  }

  private handlePan(event: MouseEvent): void {
    if (!this.isPanning) return;

    this.panOffset = {
      x: event.clientX - this.panStartPos.x,
      y: event.clientY - this.panStartPos.y
    };

    this.updateMinimap();
  }

  private finishPan(): void {
    this.isPanning = false;
  }

  // Connection handling
  startConnection(node: FlowNode, type: 'input' | 'output', event: MouseEvent, index?: number): void {
    event.stopPropagation();
    event.preventDefault();

    this.connectionStart = { node, type, index };

    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const nodeRect = (event.currentTarget as HTMLElement).getBoundingClientRect();

    this.tempConnection = {
      startX: node.position.x + (type === 'output' ? 180 : 90),
      startY: node.position.y + 30,
      endX: (event.clientX - rect.left) / this.zoomLevel - this.panOffset.x,
      endY: (event.clientY - rect.top) / this.zoomLevel - this.panOffset.y
    };
  }

  private updateTempConnection(event: MouseEvent): void {
    if (this.tempConnection) {
      const rect = this.canvasRef.nativeElement.getBoundingClientRect();
      this.tempConnection.endX = (event.clientX - rect.left) / this.zoomLevel - this.panOffset.x;
      this.tempConnection.endY = (event.clientY - rect.top) / this.zoomLevel - this.panOffset.y;
    }
  }

  private finishConnection(event: MouseEvent): void {
    if (this.tempConnection && this.connectionStart) {
      const target = event.target as HTMLElement;
      const connectionPoint = target.closest('.connection-point');

      if (connectionPoint) {
        const nodeElement = connectionPoint.closest('.flow-node');
        const targetNodeId = nodeElement?.getAttribute('data-node-id');
        const targetNode = this.flow?.nodes.find(n => n.id === targetNodeId);

        if (targetNode && targetNode.id !== this.connectionStart.node.id) {
          const connection: FlowConnection = {
            id: `conn-${Date.now()}`,
            sourceId: this.connectionStart.node.id,
            targetId: targetNode.id,
            label: this.getConnectionLabel()
          };

          this.connectionCreated.emit(connection);
        }
      }

      this.tempConnection = null;
      this.connectionStart = null;
    }
  }

  private getConnectionLabel(): string {
    if (this.connectionStart?.type === 'output' && this.connectionStart.index !== undefined) {
      const outputs = this.getOutputConnectionPoints(this.connectionStart.node);
      return outputs[this.connectionStart.index]?.label || '';
    }
    return '';
  }

  // Zoom and view controls
  zoomIn(): void {
    if (this.zoomLevel < this.maxZoom) {
      this.zoomLevel = Math.min(this.maxZoom, this.zoomLevel + 0.25);
      this.updateMinimap();
      this.canvasUpdated.emit({ type: 'zoom', level: this.zoomLevel });
    }
  }

  zoomOut(): void {
    if (this.zoomLevel > this.minZoom) {
      this.zoomLevel = Math.max(this.minZoom, this.zoomLevel - 0.25);
      this.updateMinimap();
      this.canvasUpdated.emit({ type: 'zoom', level: this.zoomLevel });
    }
  }

  fitToScreen(): void {
    if (!this.flow?.nodes.length) return;

    const bounds = this.calculateNodeBounds();
    const wrapper = this.canvasWrapperRef.nativeElement;

    const scaleX = wrapper.clientWidth / (bounds.width + 200);
    const scaleY = wrapper.clientHeight / (bounds.height + 200);

    this.zoomLevel = Math.min(scaleX, scaleY, this.maxZoom);

    this.panOffset = {
      x: (wrapper.clientWidth / 2 - (bounds.x + bounds.width / 2) * this.zoomLevel) / this.zoomLevel,
      y: (wrapper.clientHeight / 2 - (bounds.y + bounds.height / 2) * this.zoomLevel) / this.zoomLevel
    };

    this.updateMinimap();
    this.canvasUpdated.emit({ type: 'fit', level: this.zoomLevel });
  }

  centerView(): void {
    this.panOffset = { x: 0, y: 0 };
    this.updateMinimap();
  }

  toggleMinimap(): void {
    this.showMinimap = !this.showMinimap;
  }

  private calculateNodeBounds(): { x: number, y: number, width: number, height: number } {
    if (!this.flow?.nodes.length) return { x: 0, y: 0, width: 0, height: 0 };

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    this.flow.nodes.forEach(node => {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + 180);
      maxY = Math.max(maxY, node.position.y + 100);
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  private updateMinimap(): void {
    if (!this.showMinimap) return;

    const wrapper = this.canvasWrapperRef.nativeElement;
    this.minimapViewport = {
      x: (-this.panOffset.x * this.zoomLevel) * this.minimapScale,
      y: (-this.panOffset.y * this.zoomLevel) * this.minimapScale,
      width: wrapper.clientWidth * this.minimapScale / this.zoomLevel,
      height: wrapper.clientHeight * this.minimapScale / this.zoomLevel
    };
  }

  // Utility methods
  private snapToGrid(position: { x: number, y: number }): void {
    position.x = Math.round(position.x / this.gridSize) * this.gridSize;
    position.y = Math.round(position.y / this.gridSize) * this.gridSize;
  }

  // Context menu
  private showContextMenu(x: number, y: number): void {
    this.contextMenu = { show: true, x, y };
  }

  private hideContextMenu(): void {
    this.contextMenu.show = false;
  }

  // Node operations
  editNode(node: FlowNode): void {
    this.nodeSelected.emit(node);
  }

  duplicateNode(node: FlowNode): void {
    const duplicate = {
      ...node,
      id: `${node.type}-${Date.now()}`,
      position: { x: node.position.x + 20, y: node.position.y + 20 }
    };

    if (this.flow) {
      this.flow.nodes.push(duplicate);
    }
  }

  copyNode(node: FlowNode): void {
    this.clipboard = { ...node };
  }

  copySelectedNode(): void {
    if (this.selectedNode) {
      this.copyNode(this.selectedNode);
    }
  }

  pasteNode(): void {
    if (this.clipboard) {
      this.duplicateNode(this.clipboard);
    }
  }

  deleteNode(node: FlowNode): void {
    this.nodeDeleted.emit(node.id);
  }

  deleteSelectedNodes(): void {
    if (this.selectedNode) {
      this.deleteNode(this.selectedNode);
    }
  }

  addNoteToNode(node: FlowNode): void {
    // Implement note functionality
  }

  toggleNodeCollapse(node: FlowNode): void {
    node.collapsed = !node.collapsed;
  }

  selectAll(): void {
    // Implement select all
  }

  clearSelection(): void {
    this.selectedNode = null;
    this.selectedConnection = null;
    this.selectedNodes = [];
  }

  addNote(): void {
    // Implement add note
  }

  hasClipboardContent(): boolean {
    return !!this.clipboard;
  }

  // Auto layout
  autoLayout(): void {
    if (!this.flow?.nodes.length) return;

    // Implement automatic layout algorithm
    this.arrangeNodesInGrid();
  }

  private arrangeNodesInGrid(): void {
    if (!this.flow?.nodes) return;

    const startNodes = this.flow.nodes.filter(n => n.type === 'start');
    const endNodes = this.flow.nodes.filter(n => n.type === 'end');
    const otherNodes = this.flow.nodes.filter(n => n.type !== 'start' && n.type !== 'end');

    let currentY = 100;
    const spacing = 200;

    // Position start nodes
    startNodes.forEach((node, index) => {
      node.position = { x: 100, y: currentY + (index * spacing) };
    });

    // Position other nodes
    otherNodes.forEach((node, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      node.position = { x: 400 + (col * spacing), y: currentY + (row * spacing) };
    });

    // Position end nodes
    endNodes.forEach((node, index) => {
      node.position = { x: 1000, y: currentY + (index * spacing) };
    });
  }

  // Validation
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
    // Start node validation
    if (node.type === 'start') {
      const outgoing = this.flow?.connections.filter(c => c.sourceId === node.id) || [];
      if (outgoing.length === 0) {
        this.addValidationIssue(node.id, 'warning', 'No outgoing connections', 'Start node should have at least one outgoing connection');
      }
    }

    // End node validation
    if (node.type === 'end') {
      const incoming = this.flow?.connections.filter(c => c.targetId === node.id) || [];
      if (incoming.length === 0) {
        this.addValidationIssue(node.id, 'warning', 'No incoming connections', 'End node should have at least one incoming connection');
      }
    }

    // General validation
    if (!node.label.trim()) {
      this.addValidationIssue(node.id, 'error', 'Missing label', 'Node must have a label');
    }
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

      // Center view on node
      const wrapper = this.canvasWrapperRef.nativeElement;
      this.panOffset = {
        x: wrapper.clientWidth / 2 / this.zoomLevel - node.position.x - 90,
        y: wrapper.clientHeight / 2 / this.zoomLevel - node.position.y - 50
      };

      this.updateMinimap();
    }
  }

  // Track by functions for performance
  trackByNodeId(index: number, node: FlowNode): string {
    return node.id;
  }

  trackByConnectionId(index: number, connection: FlowConnection): string {
    return connection.id;
  }
}
