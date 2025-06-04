// src/app/components/flow-canvas/flow-canvas.component.ts - WORKING CONNECTIONS
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
  @Output() nodeUpdated = new EventEmitter<FlowNode>();
  @Output() connectionCreated = new EventEmitter<FlowConnection>();
  @Output() canvasUpdated = new EventEmitter<any>();

  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef;
  @ViewChild('canvasWrapper', { static: true }) canvasWrapperRef!: ElementRef;

  // Add Math reference for template
  Math = Math;

  // Canvas state
  selectedNode: FlowNode | null = null;
  selectedConnection: string | null = null;

  // Zoom and pan
  zoomLevel = 1;
  minZoom = 0.25;
  maxZoom = 3;
  panOffset = { x: 0, y: 0 };

  // Canvas dimensions
  canvasWidth = 4000;
  canvasHeight = 4000;

  // Drag state
  isDragging = false;
  isPanning = false;
  dragStartPos = { x: 0, y: 0 };
  dragNode: FlowNode | null = null;
  dragOffset = { x: 0, y: 0 };
  panStartPos = { x: 0, y: 0 };
  panStartOffset = { x: 0, y: 0 };

  // Connection state - SIMPLIFIED
  isConnecting = false;
  connectionStart: { nodeId: string, type: 'input' | 'output', index?: number } | null = null;
  tempConnection: { x1: number, y1: number, x2: number, y2: number } | null = null;

  // Context menu
  contextMenu = { show: false, x: 0, y: 0 };

  // Drop zone
  showDropZone = false;
  dropZone = { x: 0, y: 0 };

  // Clipboard
  clipboard: FlowNode | null = null;

  constructor() {}

  ngOnInit(): void {
    this.setupEventListeners();
  }

  ngAfterViewInit(): void {}

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
    const startY = 30;
    return startY + (index * spacing);
  }

  getConnectionPath(connection: FlowConnection): string {
    const sourceNode = this.flow?.nodes.find(n => n.id === connection.sourceId);
    const targetNode = this.flow?.nodes.find(n => n.id === connection.targetId);

    if (!sourceNode || !targetNode) return '';

    const startX = sourceNode.position.x + 160; // Right side of source node
    const startY = sourceNode.position.y + 40; // Center of source node
    const endX = targetNode.position.x; // Left side of target node
    const endY = targetNode.position.y + 40; // Center of target node

    const controlPointDistance = Math.abs(endX - startX) * 0.4;
    const cp1X = startX + controlPointDistance;
    const cp1Y = startY;
    const cp2X = endX - controlPointDistance;
    const cp2Y = endY;

    return `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
  }

  getConnectionColor(connection: FlowConnection): string {
    if (this.selectedConnection === connection.id) return '#3b82f6';
    return '#6b7280';
  }

  getConnectionWidth(connection: FlowConnection): number {
    if (this.selectedConnection === connection.id) return 3;
    return 2;
  }

  getConnectionMarker(connection: FlowConnection): string {
    return this.selectedConnection === connection.id ?
      'url(#arrowhead-selected)' : 'url(#arrowhead)';
  }

  getTempConnectionPath(): string {
    if (!this.tempConnection) return '';

    const { x1, y1, x2, y2 } = this.tempConnection;
    const controlPointDistance = Math.abs(x2 - x1) * 0.4;
    const cp1X = x1 + controlPointDistance;
    const cp1Y = y1;
    const cp2X = x2 - controlPointDistance;
    const cp2Y = y2;

    return `M ${x1} ${y1} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${x2} ${y2}`;
  }

  // Event handlers - WORKING IMPLEMENTATIONS

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.showDropZone = false;

    const dragData = event.dataTransfer?.getData('application/json');
    if (!dragData) return;

    try {
      const nodeData = JSON.parse(dragData);
      const canvasRect = this.canvasRef.nativeElement.getBoundingClientRect();

      // Calculate position relative to canvas
      const x = (event.clientX - canvasRect.left - this.panOffset.x * this.zoomLevel) / this.zoomLevel;
      const y = (event.clientY - canvasRect.top - this.panOffset.y * this.zoomLevel) / this.zoomLevel;

      // Snap to grid
      const gridSize = 20;
      const snappedX = Math.round(x / gridSize) * gridSize;
      const snappedY = Math.round(y / gridSize) * gridSize;

      const newNode: FlowNode = {
        id: this.generateNodeId(nodeData.type),
        type: nodeData.type,
        label: nodeData.label,
        position: { x: snappedX, y: snappedY },
        data: nodeData.data || {},
        connections: []
      };

      // Add node to flow
      if (this.flow) {
        this.flow.nodes.push(newNode);
        this.canvasUpdated.emit({ type: 'nodeAdded', node: newNode });
      }
    } catch (error) {
      console.error('Failed to parse dropped data:', error);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();

    const canvasRect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.dropZone = {
      x: event.clientX - canvasRect.left,
      y: event.clientY - canvasRect.top
    };
    this.showDropZone = true;
  }

  onCanvasClick(event: MouseEvent): void {
    // Deselect everything if clicking on empty canvas
    if (event.target === this.canvasRef.nativeElement) {
      this.selectedNode = null;
      this.selectedConnection = null;
      this.nodeSelected.emit(null as any);
    }
    this.contextMenu.show = false;
  }

  onCanvasMouseDown(event: MouseEvent): void {
    // Start panning if not clicking on a node
    if (event.target === this.canvasRef.nativeElement ||
      (event.target as HTMLElement).classList.contains('grid-background')) {
      this.isPanning = true;
      this.panStartPos = { x: event.clientX, y: event.clientY };
      this.panStartOffset = { ...this.panOffset };
      event.preventDefault();
    }
    this.contextMenu.show = false;
  }

  onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    this.contextMenu = {
      show: true,
      x: event.clientX,
      y: event.clientY
    };
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();

    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoomLevel + delta));

    if (newZoom !== this.zoomLevel) {
      this.zoomLevel = newZoom;
      this.canvasUpdated.emit({ type: 'zoom', level: this.zoomLevel });
    }
  }

  onMouseMove(event: MouseEvent): void {
    // Handle node dragging
    if (this.isDragging && this.dragNode) {
      const newX = event.clientX - this.dragOffset.x;
      const newY = event.clientY - this.dragOffset.y;

      const canvasRect = this.canvasRef.nativeElement.getBoundingClientRect();

      const canvasX = (newX - canvasRect.left - this.panOffset.x * this.zoomLevel) / this.zoomLevel;
      const canvasY = (newY - canvasRect.top - this.panOffset.y * this.zoomLevel) / this.zoomLevel;

      // Snap to grid
      const gridSize = 20;
      this.dragNode.position.x = Math.round(canvasX / gridSize) * gridSize;
      this.dragNode.position.y = Math.round(canvasY / gridSize) * gridSize;

      // Ensure node stays within canvas bounds
      this.dragNode.position.x = Math.max(0, Math.min(this.canvasWidth - 200, this.dragNode.position.x));
      this.dragNode.position.y = Math.max(0, Math.min(this.canvasHeight - 100, this.dragNode.position.y));
    }

    // Handle canvas panning
    else if (this.isPanning) {
      const deltaX = event.clientX - this.panStartPos.x;
      const deltaY = event.clientY - this.panStartPos.y;

      this.panOffset.x = this.panStartOffset.x + deltaX / this.zoomLevel;
      this.panOffset.y = this.panStartOffset.y + deltaY / this.zoomLevel;
    }

    // Handle temporary connection - SIMPLIFIED
    else if (this.isConnecting && this.tempConnection) {
      this.tempConnection.x2 = event.clientX;
      this.tempConnection.y2 = event.clientY;
    }
  }

  onMouseUp(event: MouseEvent): void {
    // End node dragging
    if (this.isDragging && this.dragNode) {
      this.isDragging = false;
      this.nodeUpdated.emit(this.dragNode);
      this.dragNode = null;
    }

    // End canvas panning
    if (this.isPanning) {
      this.isPanning = false;
    }

    // Handle connection completion - SIMPLIFIED
    if (this.isConnecting) {
      this.finishConnection(event);
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    // Delete selected node
    if (event.key === 'Delete' && this.selectedNode) {
      this.deleteNode(this.selectedNode);
    }

    // Copy selected node
    if (event.ctrlKey && event.key === 'c' && this.selectedNode) {
      this.copyNode(this.selectedNode);
    }

    // Paste node
    if (event.ctrlKey && event.key === 'v' && this.clipboard) {
      this.pasteNode();
    }
  }

  onDocumentClick(event: MouseEvent): void {
    // Hide context menu when clicking outside
    if (this.contextMenu.show) {
      this.contextMenu.show = false;
    }
  }

  // Connection methods - SIMPLIFIED AND WORKING

  startConnection(node: FlowNode, type: 'input' | 'output', event: MouseEvent, index?: number): void {
    console.log('Starting connection from:', node.label, type, index);

    event.stopPropagation();
    event.preventDefault();

    this.isConnecting = true;
    this.connectionStart = { nodeId: node.id, type, index };

    // Calculate start position
    let startX: number, startY: number;

    if (type === 'output') {
      startX = node.position.x + 160; // Right side of node
      startY = node.position.y + (index !== undefined ? this.getOutputConnectionPosition(node, index) : 40);
    } else {
      startX = node.position.x + 80; // Center top of node
      startY = node.position.y;
    }

    // Convert to screen coordinates
    const canvasRect = this.canvasRef.nativeElement.getBoundingClientRect();
    const screenX = startX * this.zoomLevel + this.panOffset.x * this.zoomLevel + canvasRect.left;
    const screenY = startY * this.zoomLevel + this.panOffset.y * this.zoomLevel + canvasRect.top;

    this.tempConnection = {
      x1: screenX,
      y1: screenY,
      x2: event.clientX,
      y2: event.clientY
    };

    console.log('Temp connection started:', this.tempConnection);
  }

  finishConnection(event: MouseEvent): void {
    console.log('Finishing connection at:', event.clientX, event.clientY);

    if (!this.connectionStart || !this.flow) {
      this.cancelConnection();
      return;
    }

    // Find the node under the mouse
    const targetNode = this.findNodeUnderMouse(event);

    if (targetNode && targetNode.id !== this.connectionStart.nodeId) {
      console.log('Found target node:', targetNode.label);

      // Create the connection
      const sourceNode = this.flow.nodes.find(n => n.id === this.connectionStart!.nodeId);
      if (sourceNode) {
        this.createConnection(sourceNode, targetNode);
      }
    } else {
      console.log('No valid target found');
    }

    this.cancelConnection();
  }

  private findNodeUnderMouse(event: MouseEvent): FlowNode | null {
    if (!this.flow?.nodes) return null;

    const canvasRect = this.canvasRef.nativeElement.getBoundingClientRect();
    const canvasX = (event.clientX - canvasRect.left - this.panOffset.x * this.zoomLevel) / this.zoomLevel;
    const canvasY = (event.clientY - canvasRect.top - this.panOffset.y * this.zoomLevel) / this.zoomLevel;

    // Check each node
    for (const node of this.flow.nodes) {
      const nodeRect = {
        x: node.position.x,
        y: node.position.y,
        width: 160,
        height: 80
      };

      if (canvasX >= nodeRect.x && canvasX <= nodeRect.x + nodeRect.width &&
        canvasY >= nodeRect.y && canvasY <= nodeRect.y + nodeRect.height) {
        return node;
      }
    }

    return null;
  }

  private createConnection(sourceNode: FlowNode, targetNode: FlowNode): void {
    if (!this.flow || !this.connectionStart) return;

    console.log('Creating connection:', sourceNode.label, '->', targetNode.label);

    // Determine actual source and target based on connection direction
    let actualSourceId: string, actualTargetId: string;

    if (this.connectionStart.type === 'output') {
      actualSourceId = sourceNode.id;
      actualTargetId = targetNode.id;
    } else {
      actualSourceId = targetNode.id;
      actualTargetId = sourceNode.id;
    }

    // Check if connection already exists
    const existingConnection = this.flow.connections.find(conn =>
      conn.sourceId === actualSourceId && conn.targetId === actualTargetId
    );

    if (existingConnection) {
      console.log('Connection already exists');
      return;
    }

    // Create new connection
    const newConnection: FlowConnection = {
      id: this.generateConnectionId(),
      sourceId: actualSourceId,
      targetId: actualTargetId,
      label: `${sourceNode.label} → ${targetNode.label}`
    };

    // Add to flow
    this.flow.connections.push(newConnection);

    // Emit events
    this.connectionCreated.emit(newConnection);
    this.canvasUpdated.emit({ type: 'connectionCreated', connection: newConnection });

    console.log('Connection created successfully:', newConnection);
  }

  private cancelConnection(): void {
    this.isConnecting = false;
    this.connectionStart = null;
    this.tempConnection = null;
  }

  // Node interaction methods
  selectNode(node: FlowNode, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedNode = node;
    this.selectedConnection = null;
    this.nodeSelected.emit(node);
  }

  startDrag(node: FlowNode, event: MouseEvent): void {
    // Don't start drag if clicking on a button or connection point
    const target = event.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.tagName === 'MAT-ICON' ||
      target.closest('button') || target.closest('.node-menu') ||
      target.closest('.connection-point')) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    this.isDragging = true;
    this.dragNode = node;

    // Calculate offset from mouse to node position
    const nodeElement = (event.currentTarget as HTMLElement);
    const rect = nodeElement.getBoundingClientRect();
    this.dragOffset = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };

    // Select the node being dragged
    this.selectNode(node, event);
  }

  selectConnection(connection: FlowConnection, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedConnection = connection.id;
    this.selectedNode = null;
  }

  // Canvas control methods
  zoomIn(): void {
    if (this.zoomLevel < this.maxZoom) {
      this.zoomLevel = Math.min(this.maxZoom, this.zoomLevel + 0.25);
      this.canvasUpdated.emit({ type: 'zoom', level: this.zoomLevel });
    }
  }

  zoomOut(): void {
    if (this.zoomLevel > this.minZoom) {
      this.zoomLevel = Math.max(this.minZoom, this.zoomLevel - 0.25);
      this.canvasUpdated.emit({ type: 'zoom', level: this.zoomLevel });
    }
  }

  fitToScreen(): void {
    if (!this.flow?.nodes || this.flow.nodes.length === 0) return;

    // Calculate bounds of all nodes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    this.flow.nodes.forEach(node => {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + 200);
      maxY = Math.max(maxY, node.position.y + 100);
    });

    const wrapperRect = this.canvasWrapperRef.nativeElement.getBoundingClientRect();
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    const scaleX = (wrapperRect.width - 100) / contentWidth;
    const scaleY = (wrapperRect.height - 100) / contentHeight;

    this.zoomLevel = Math.max(this.minZoom, Math.min(this.maxZoom, Math.min(scaleX, scaleY)));

    // Center the content
    this.panOffset.x = (wrapperRect.width / this.zoomLevel - contentWidth) / 2 - minX;
    this.panOffset.y = (wrapperRect.height / this.zoomLevel - contentHeight) / 2 - minY;

    this.canvasUpdated.emit({ type: 'fit', zoom: this.zoomLevel, pan: this.panOffset });
  }

  centerView(): void {
    this.panOffset = { x: 0, y: 0 };
    this.canvasUpdated.emit({ type: 'center', pan: this.panOffset });
  }

  // Node action methods
  editNode(node: FlowNode): void {
    this.nodeSelected.emit(node);
  }

  duplicateNode(node: FlowNode): void {
    const newNode: FlowNode = {
      ...node,
      id: this.generateNodeId(node.type),
      position: { x: node.position.x + 200, y: node.position.y + 100 }
    };

    if (this.flow) {
      this.flow.nodes.push(newNode);
      this.canvasUpdated.emit({ type: 'nodeAdded', node: newNode });
    }
  }

  copyNode(node: FlowNode): void {
    this.clipboard = { ...node };
  }

  deleteNode(node: FlowNode): void {
    this.nodeDeleted.emit(node.id);
  }

  // Context menu actions
  pasteNode(): void {
    if (!this.clipboard) return;

    const newNode: FlowNode = {
      ...this.clipboard,
      id: this.generateNodeId(this.clipboard.type),
      position: {
        x: this.clipboard.position.x + 50,
        y: this.clipboard.position.y + 50
      }
    };

    if (this.flow) {
      this.flow.nodes.push(newNode);
      this.canvasUpdated.emit({ type: 'nodeAdded', node: newNode });
    }
  }

  selectAll(): void {
    // Implementation for select all
  }

  addNote(): void {
    // Implementation for adding notes
  }

  hasClipboardContent(): boolean {
    return !!this.clipboard;
  }

  // Utility methods
  private generateNodeId(type: string): string {
    return `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  }

  private generateConnectionId(): string {
    return `conn-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  }

  // Track by functions for performance
  trackByNodeId(index: number, node: FlowNode): string {
    return node.id;
  }

  trackByConnectionId(index: number, connection: FlowConnection): string {
    return connection.id;
  }
}
