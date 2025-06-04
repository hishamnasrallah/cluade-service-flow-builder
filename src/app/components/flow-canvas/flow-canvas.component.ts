// src/app/components/flow-canvas/flow-canvas.component.ts - ENHANCED CONNECTORS
import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { ServiceFlow, FlowNode, FlowConnection } from '../../models/flow.model';

interface ConnectionPoint {
  id: string;
  nodeId: string;
  type: 'input' | 'output';
  position: { x: number; y: number };
  label?: string;
  condition?: string;
  index?: number;
  dataType?: string;
  isRequired?: boolean;
}

interface ConnectionRule {
  sourceType: string;
  targetType: string;
  allowed: boolean;
  maxConnections?: number;
  description?: string;
}

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
  @Output() connectionDeleted = new EventEmitter<string>();
  @Output() canvasUpdated = new EventEmitter<any>();

  @ViewChild('canvas', {static: true}) canvasRef!: ElementRef;
  @ViewChild('canvasWrapper', {static: true}) canvasWrapperRef!: ElementRef;

  // Add Math reference for template
  Math = Math;

  // Canvas state
  selectedNode: FlowNode | null = null;
  selectedConnection: string | null = null;

  // Zoom and pan
  zoomLevel = 1;
  minZoom = 0.25;
  maxZoom = 3;
  panOffset = {x: 0, y: 0};

  // Canvas dimensions
  canvasWidth = 4000;
  canvasHeight = 4000;

  // Drag state
  isDragging = false;
  isPanning = false;
  dragStartPos = {x: 0, y: 0};
  dragNode: FlowNode | null = null;
  dragOffset = {x: 0, y: 0};
  panStartPos = {x: 0, y: 0};
  panStartOffset = {x: 0, y: 0};

  // Enhanced Connection System
  isConnecting = false;
  connectionStart: ConnectionPoint | null = null;
  tempConnection: { x1: number, y1: number, x2: number, y2: number } | null = null;
  connectionPoints: ConnectionPoint[] = [];
  hoveredConnectionPoint: string | null = null;
  validConnectionTargets: string[] = [];
  connectionPreview: { valid: boolean; message: string } | null = null;

  // Connection Rules for different node types
  connectionRules: ConnectionRule[] = [
    {sourceType: 'start', targetType: 'page', allowed: true, description: 'Start can connect to pages'},
    {sourceType: 'start', targetType: 'condition', allowed: true, description: 'Start can connect to conditions'},
    {sourceType: 'start', targetType: 'decision', allowed: true, description: 'Start can connect to decisions'},
    {sourceType: 'start', targetType: 'end', allowed: false, description: 'Start cannot directly connect to end'},

    {sourceType: 'page', targetType: 'page', allowed: true, description: 'Page can connect to other pages'},
    {sourceType: 'page', targetType: 'condition', allowed: true, description: 'Page can connect to conditions'},
    {sourceType: 'page', targetType: 'decision', allowed: true, description: 'Page can connect to decisions'},
    {sourceType: 'page', targetType: 'end', allowed: true, description: 'Page can connect to end'},
    {sourceType: 'page', targetType: 'validation', allowed: true, description: 'Page can connect to validation'},

    {sourceType: 'decision', targetType: 'page', allowed: true, description: 'Decision branches can lead to pages'},
    {
      sourceType: 'decision',
      targetType: 'condition',
      allowed: true,
      description: 'Decision branches can lead to conditions'
    },
    {sourceType: 'decision', targetType: 'end', allowed: true, description: 'Decision branches can end flow'},
    {
      sourceType: 'decision',
      targetType: 'decision',
      allowed: true,
      description: 'Decision can connect to other decisions'
    },

    {sourceType: 'condition', targetType: 'page', allowed: true, description: 'Condition can show/hide pages'},
    {sourceType: 'condition', targetType: 'field', allowed: true, description: 'Condition can control fields'},
    {sourceType: 'condition', targetType: 'decision', allowed: true, description: 'Condition can trigger decisions'},

    {sourceType: 'field', targetType: 'validation', allowed: true, description: 'Field can connect to validation'},
    {sourceType: 'field', targetType: 'calculation', allowed: true, description: 'Field can trigger calculations'},
    {sourceType: 'field', targetType: 'condition', allowed: true, description: 'Field can trigger conditions'},

    {sourceType: 'validation', targetType: 'page', allowed: true, description: 'Validation can redirect to pages'},
    {sourceType: 'validation', targetType: 'end', allowed: true, description: 'Validation can end flow on error'},

    {sourceType: 'calculation', targetType: 'field', allowed: true, description: 'Calculation can update fields'},
    {sourceType: 'calculation', targetType: 'page', allowed: true, description: 'Calculation can continue to pages'},

    {sourceType: 'api_call', targetType: 'page', allowed: true, description: 'API call can continue to pages'},
    {sourceType: 'api_call', targetType: 'end', allowed: true, description: 'API call can end flow'},
    {sourceType: 'api_call', targetType: 'condition', allowed: true, description: 'API call can trigger conditions'},

    {
      sourceType: 'database',
      targetType: 'page',
      allowed: true,
      description: 'Database operation can continue to pages'
    },
    {sourceType: 'database', targetType: 'end', allowed: true, description: 'Database operation can end flow'}
  ];

  // Context menu
  contextMenu = {show: false, x: 0, y: 0};

  // Drop zone
  showDropZone = false;
  dropZone = {x: 0, y: 0};

  // Clipboard
  clipboard: FlowNode | null = null;

  // Magnetic snapping
  snapDistance = 25; // pixels
  snapToGrid = true;
  gridSize = 20;

  constructor() {
  }

  ngOnInit(): void {
    this.setupEventListeners();
    this.generateConnectionPoints();
  }

  ngAfterViewInit(): void {
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

  // Enhanced Connection Point Management
  generateConnectionPoints(): void {
    this.connectionPoints = [];

    if (!this.flow?.nodes) return;

    this.flow.nodes.forEach(node => {
      // Input connection points (most nodes except start)
      if (this.canHaveInputConnection(node)) {
        const inputPoint: ConnectionPoint = {
          id: `${node.id}-input`,
          nodeId: node.id,
          type: 'input',
          position: this.getConnectionPointPosition(node, 'input'),
          label: 'Input',
          dataType: this.getNodeDataType(node),
          isRequired: node.type !== 'end'
        };
        this.connectionPoints.push(inputPoint);
      }

      // Output connection points (varies by node type)
      const outputPoints = this.getOutputConnectionPoints(node);
      outputPoints.forEach((output, index) => {
        const outputPoint: ConnectionPoint = {
          id: `${node.id}-output-${index}`,
          nodeId: node.id,
          type: 'output',
          position: this.getConnectionPointPosition(node, 'output', index),
          label: output.label,
          condition: output.condition,
          index: index,
          dataType: this.getNodeDataType(node)
        };
        this.connectionPoints.push(outputPoint);
      });
    });
  }

  getConnectionPointPosition(node: FlowNode, type: 'input' | 'output', index?: number): { x: number; y: number } {
    const nodeWidth = 160;
    const nodeHeight = 80;

    if (type === 'input') {
      return {
        x: node.position.x + nodeWidth / 2,
        y: node.position.y
      };
    } else {
      // For multiple outputs, distribute them vertically
      const outputCount = this.getOutputConnectionPoints(node).length;
      if (outputCount === 1) {
        return {
          x: node.position.x + nodeWidth,
          y: node.position.y + nodeHeight / 2
        };
      } else {
        const spacing = nodeHeight / (outputCount + 1);
        return {
          x: node.position.x + nodeWidth,
          y: node.position.y + spacing * ((index || 0) + 1)
        };
      }
    }
  }

  getNodeDataType(node: FlowNode): string {
    const typeMap: { [key: string]: string } = {
      'start': 'flow',
      'end': 'flow',
      'page': 'form',
      'field': 'data',
      'decision': 'boolean',
      'condition': 'boolean',
      'validation': 'validation',
      'calculation': 'number',
      'api_call': 'api',
      'database': 'data'
    };
    return typeMap[node.type] || 'generic';
  }

  // Enhanced Connection Validation
  isValidConnection(sourcePoint: ConnectionPoint, targetPoint: ConnectionPoint): { valid: boolean; message: string } {
    // Can't connect to same node
    if (sourcePoint.nodeId === targetPoint.nodeId) {
      return {valid: false, message: 'Cannot connect node to itself'};
    }

    // Must be output to input
    if (sourcePoint.type !== 'output' || targetPoint.type !== 'input') {
      return {valid: false, message: 'Must connect from output to input'};
    }

    // Check connection rules
    const sourceNode = this.flow?.nodes.find(n => n.id === sourcePoint.nodeId);
    const targetNode = this.flow?.nodes.find(n => n.id === targetPoint.nodeId);

    if (!sourceNode || !targetNode) {
      return {valid: false, message: 'Invalid nodes'};
    }

    const rule = this.connectionRules.find(r =>
      r.sourceType === sourceNode.type && r.targetType === targetNode.type
    );

    if (!rule || !rule.allowed) {
      return {
        valid: false,
        message: rule?.description || `Cannot connect ${sourceNode.type} to ${targetNode.type}`
      };
    }

    // Check if connection already exists
    const existingConnection = this.flow?.connections.find(conn =>
      conn.sourceId === sourcePoint.nodeId && conn.targetId === targetPoint.nodeId
    );

    if (existingConnection) {
      return {valid: false, message: 'Connection already exists'};
    }

    // Check maximum connections
    if (rule.maxConnections) {
      const existingConnections = this.flow?.connections.filter(conn =>
        conn.sourceId === sourcePoint.nodeId
      ).length || 0;

      if (existingConnections >= rule.maxConnections) {
        return {valid: false, message: `Maximum ${rule.maxConnections} connections allowed`};
      }
    }

    // Data type compatibility (optional enhancement)
    if (sourcePoint.dataType && targetPoint.dataType &&
      sourcePoint.dataType !== targetPoint.dataType &&
      !this.isDataTypeCompatible(sourcePoint.dataType, targetPoint.dataType)) {
      return {
        valid: false,
        message: `Incompatible data types: ${sourcePoint.dataType} → ${targetPoint.dataType}`
      };
    }

    return {valid: true, message: rule.description || 'Valid connection'};
  }

  isDataTypeCompatible(sourceType: string, targetType: string): boolean {
    const compatibilityMap: { [key: string]: string[] } = {
      'flow': ['flow', 'form', 'boolean'],
      'form': ['form', 'data', 'validation'],
      'data': ['data', 'number', 'validation'],
      'boolean': ['boolean', 'flow'],
      'number': ['number', 'data'],
      'api': ['data', 'form'],
      'validation': ['flow', 'form']
    };

    return compatibilityMap[sourceType]?.includes(targetType) || false;
  }

  // Enhanced Connection Creation
  startConnection(node: FlowNode, type: 'input' | 'output', event: MouseEvent, outputIndex?: number): void {
    console.log('Starting enhanced connection from:', node.label, type, outputIndex);

    event.stopPropagation();
    event.preventDefault();

    this.isConnecting = true;

    // Find the specific connection point
    let pointId: string;
    if (type === 'output') {
      pointId = `${node.id}-output-${outputIndex || 0}`;
    } else {
      pointId = `${node.id}-input`;
    }

    this.connectionStart = this.connectionPoints.find(cp => cp.id === pointId) || null;

    if (!this.connectionStart) {
      console.error('Connection point not found:', pointId);
      this.cancelConnection();
      return;
    }

    // Calculate valid targets
    this.calculateValidTargets();

    // Convert to screen coordinates
    const canvasRect = this.canvasRef.nativeElement.getBoundingClientRect();
    const screenX = this.connectionStart.position.x * this.zoomLevel + this.panOffset.x * this.zoomLevel + canvasRect.left;
    const screenY = this.connectionStart.position.y * this.zoomLevel + this.panOffset.y * this.zoomLevel + canvasRect.top;

    this.tempConnection = {
      x1: screenX,
      y1: screenY,
      x2: event.clientX,
      y2: event.clientY
    };

    console.log('Enhanced connection started:', this.connectionStart);
  }

  calculateValidTargets(): void {
    this.validConnectionTargets = [];

    if (!this.connectionStart) return;

    this.connectionPoints.forEach(point => {
      if (point.type === 'input' && point.nodeId !== this.connectionStart!.nodeId) {
        const validation = this.isValidConnection(this.connectionStart!, point);
        if (validation.valid) {
          this.validConnectionTargets.push(point.id);
        }
      }
    });

    console.log('Valid targets:', this.validConnectionTargets);
  }

  finishConnection(event: MouseEvent): void {
    console.log('Finishing enhanced connection');

    if (!this.connectionStart || !this.flow) {
      this.cancelConnection();
      return;
    }

    // Find the closest connection point
    const targetPoint = this.findNearestConnectionPoint(event, 'input');

    if (targetPoint && this.validConnectionTargets.includes(targetPoint.id)) {
      console.log('Creating connection to:', targetPoint);

      const validation = this.isValidConnection(this.connectionStart, targetPoint);
      if (validation.valid) {
        this.createEnhancedConnection(this.connectionStart, targetPoint);
      } else {
        console.log('Invalid connection:', validation.message);
        this.showConnectionFeedback(validation.message, false);
      }
    } else {
      console.log('No valid target found');
      this.showConnectionFeedback('No valid connection target found', false);
    }

    this.cancelConnection();
  }

  findNearestConnectionPoint(event: MouseEvent, type?: 'input' | 'output'): ConnectionPoint | null {
    const canvasRect = this.canvasRef.nativeElement.getBoundingClientRect();
    const mouseX = (event.clientX - canvasRect.left - this.panOffset.x * this.zoomLevel) / this.zoomLevel;
    const mouseY = (event.clientY - canvasRect.top - this.panOffset.y * this.zoomLevel) / this.zoomLevel;

    let nearest: ConnectionPoint | null = null;
    let minDistance = this.snapDistance;

    this.connectionPoints.forEach(point => {
      if (type && point.type !== type) return;

      const distance = Math.sqrt(
        Math.pow(point.position.x - mouseX, 2) +
        Math.pow(point.position.y - mouseY, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearest = point;
      }
    });

    return nearest;
  }

  createEnhancedConnection(sourcePoint: ConnectionPoint, targetPoint: ConnectionPoint): void {
    if (!this.flow) return;

    const sourceNode = this.flow.nodes.find(n => n.id === sourcePoint.nodeId);
    const targetNode = this.flow.nodes.find(n => n.id === targetPoint.nodeId);

    if (!sourceNode || !targetNode) return;

    const newConnection: FlowConnection = {
      id: this.generateConnectionId(),
      sourceId: sourcePoint.nodeId,
      targetId: targetPoint.nodeId,
      label: this.generateConnectionLabel(sourcePoint, targetPoint),
      condition: sourcePoint.condition
    };

    // Add to flow
    this.flow.connections.push(newConnection);

    // Emit events
    this.connectionCreated.emit(newConnection);
    this.canvasUpdated.emit({type: 'connectionCreated', connection: newConnection});

    // Regenerate connection points
    this.generateConnectionPoints();

    this.showConnectionFeedback('Connection created successfully!', true);
    console.log('Enhanced connection created:', newConnection);
  }

  generateConnectionLabel(sourcePoint: ConnectionPoint, targetPoint: ConnectionPoint): string {
    if (sourcePoint.condition) {
      return `${sourcePoint.label || 'Output'} (${sourcePoint.condition})`;
    }
    return `${sourcePoint.label || 'Output'} → ${targetPoint.label || 'Input'}`;
  }

  showConnectionFeedback(message: string, success: boolean): void {
    // Create a temporary feedback element
    const feedback = document.createElement('div');
    feedback.className = `connection-feedback ${success ? 'success' : 'error'}`;
    feedback.textContent = message;
    feedback.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: ${success ? '#10b981' : '#ef4444'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      pointer-events: none;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    `;

    document.body.appendChild(feedback);

    // Animate in
    feedback.style.opacity = '0';
    feedback.style.transform = 'translate(-50%, -50%) scale(0.8)';

    requestAnimationFrame(() => {
      feedback.style.transition = 'all 0.3s ease';
      feedback.style.opacity = '1';
      feedback.style.transform = 'translate(-50%, -50%) scale(1)';
    });

    // Remove after delay
    setTimeout(() => {
      feedback.style.opacity = '0';
      feedback.style.transform = 'translate(-50%, -50%) scale(0.8)';
      setTimeout(() => {
        if (feedback.parentNode) {
          document.body.removeChild(feedback);
        }
      }, 300);
    }, 2000);
  }

  // Enhanced Mouse Handling
  onMouseMove(event: MouseEvent): void {
    // Handle node dragging
    if (this.isDragging && this.dragNode) {
      const newX = event.clientX - this.dragOffset.x;
      const newY = event.clientY - this.dragOffset.y;

      const canvasRect = this.canvasRef.nativeElement.getBoundingClientRect();
      let canvasX = (newX - canvasRect.left - this.panOffset.x * this.zoomLevel) / this.zoomLevel;
      let canvasY = (newY - canvasRect.top - this.panOffset.y * this.zoomLevel) / this.zoomLevel;

      // Snap to grid if enabled
      if (this.snapToGrid) {
        canvasX = Math.round(canvasX / this.gridSize) * this.gridSize;
        canvasY = Math.round(canvasY / this.gridSize) * this.gridSize;
      }

      // Ensure node stays within canvas bounds
      canvasX = Math.max(0, Math.min(this.canvasWidth - 200, canvasX));
      canvasY = Math.max(0, Math.min(this.canvasHeight - 100, canvasY));

      this.dragNode.position.x = canvasX;
      this.dragNode.position.y = canvasY;

      // Update connection points for the dragged node
      this.generateConnectionPoints();
    }

    // Handle canvas panning
    else if (this.isPanning) {
      const deltaX = event.clientX - this.panStartPos.x;
      const deltaY = event.clientY - this.panStartPos.y;

      this.panOffset.x = this.panStartOffset.x + deltaX / this.zoomLevel;
      this.panOffset.y = this.panStartOffset.y + deltaY / this.zoomLevel;
    }

    // Handle connection creation with enhanced feedback
    else if (this.isConnecting && this.tempConnection) {
      this.tempConnection.x2 = event.clientX;
      this.tempConnection.y2 = event.clientY;

      // Check for nearby connection points and provide visual feedback
      const nearestPoint = this.findNearestConnectionPoint(event, 'input');

      if (nearestPoint && this.validConnectionTargets.includes(nearestPoint.id)) {
        this.hoveredConnectionPoint = nearestPoint.id;

        // Snap to the connection point
        const canvasRect = this.canvasRef.nativeElement.getBoundingClientRect();
        this.tempConnection.x2 = nearestPoint.position.x * this.zoomLevel + this.panOffset.x * this.zoomLevel + canvasRect.left;
        this.tempConnection.y2 = nearestPoint.position.y * this.zoomLevel + this.panOffset.y * this.zoomLevel + canvasRect.top;

        // Show connection preview
        if (this.connectionStart) {
          const validation = this.isValidConnection(this.connectionStart, nearestPoint);
          this.connectionPreview = validation;
        }
      } else {
        this.hoveredConnectionPoint = null;
        this.connectionPreview = null;
      }
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

    // Handle connection completion
    if (this.isConnecting) {
      this.finishConnection(event);
    }
  }

  private cancelConnection(): void {
    this.isConnecting = false;
    this.connectionStart = null;
    this.tempConnection = null;
    this.validConnectionTargets = [];
    this.hoveredConnectionPoint = null;
    this.connectionPreview = null;
  }

  // Rest of the existing methods remain the same...

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

  canHaveInputConnection(node: FlowNode): boolean {
    return node.type !== 'start';
  }

  getOutputConnectionPoints(node: FlowNode): any[] {
    switch (node.type) {
      case 'decision':
        return [
          {label: 'Yes', condition: 'true'},
          {label: 'No', condition: 'false'}
        ];
      case 'condition':
        return [
          {label: 'True', condition: 'true'},
          {label: 'False', condition: 'false'}
        ];
      case 'validation':
        return [
          {label: 'Valid', condition: 'valid'},
          {label: 'Invalid', condition: 'invalid'}
        ];
      case 'end':
        return [];
      default:
        return [{label: 'Next'}];
    }
  }

  getOutputConnectionPosition(node: FlowNode, index: number): number {
    const outputs = this.getOutputConnectionPoints(node);
    const nodeHeight = 80;
    const spacing = nodeHeight / (outputs.length + 1);
    return spacing * (index + 1);
  }

  // Connection visual methods
  getConnectionPath(connection: FlowConnection): string {
    const sourceNode = this.flow?.nodes.find(n => n.id === connection.sourceId);
    const targetNode = this.flow?.nodes.find(n => n.id === connection.targetId);

    if (!sourceNode || !targetNode) return '';

    // Find specific connection points for better accuracy
    const sourcePoint = this.connectionPoints.find(cp =>
      cp.nodeId === connection.sourceId && cp.type === 'output'
    );
    const targetPoint = this.connectionPoints.find(cp =>
      cp.nodeId === connection.targetId && cp.type === 'input'
    );

    const startX = sourcePoint?.position.x || (sourceNode.position.x + 160);
    const startY = sourcePoint?.position.y || (sourceNode.position.y + 40);
    const endX = targetPoint?.position.x || targetNode.position.x;
    const endY = targetPoint?.position.y || (targetNode.position.y + 40);

    // Enhanced curve calculation for better visual appeal
    const deltaX = Math.abs(endX - startX);
    const deltaY = Math.abs(endY - startY);
    const controlPointDistance = Math.max(deltaX * 0.4, deltaY * 0.2, 50);

    const cp1X = startX + controlPointDistance;
    const cp1Y = startY;
    const cp2X = endX - controlPointDistance;
    const cp2Y = endY;

    return `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
  }

  getConnectionColor(connection: FlowConnection): string {
    if (this.selectedConnection === connection.id) return '#3b82f6';

    // Color based on connection type/condition
    if (connection.condition === 'true') return '#10b981';
    if (connection.condition === 'false') return '#ef4444';
    if (connection.condition === 'valid') return '#10b981';
    if (connection.condition === 'invalid') return '#f59e0b';

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

    const {x1, y1, x2, y2} = this.tempConnection;
    const deltaX = Math.abs(x2 - x1);
    const controlPointDistance = Math.max(deltaX * 0.4, 50);

    const cp1X = x1 + controlPointDistance;
    const cp1Y = y1;
    const cp2X = x2 - controlPointDistance;
    const cp2Y = y2;

    return `M ${x1} ${y1} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${x2} ${y2}`;
  }

  // Canvas interaction methods (keeping existing implementation)
  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.showDropZone = false;

    const dragData = event.dataTransfer?.getData('application/json');
    if (!dragData) return;

    try {
      const nodeData = JSON.parse(dragData);
      const canvasRect = this.canvasRef.nativeElement.getBoundingClientRect();

      const x = (event.clientX - canvasRect.left - this.panOffset.x * this.zoomLevel) / this.zoomLevel;
      const y = (event.clientY - canvasRect.top - this.panOffset.y * this.zoomLevel) / this.zoomLevel;

      // Snap to grid
      const snappedX = this.snapToGrid ? Math.round(x / this.gridSize) * this.gridSize : x;
      const snappedY = this.snapToGrid ? Math.round(y / this.gridSize) * this.gridSize : y;

      const newNode: FlowNode = {
        id: this.generateNodeId(nodeData.type),
        type: nodeData.type,
        label: nodeData.label,
        position: {x: snappedX, y: snappedY},
        data: nodeData.data || {},
        connections: []
      };

      if (this.flow) {
        this.flow.nodes.push(newNode);
        this.generateConnectionPoints(); // Regenerate connection points
        this.canvasUpdated.emit({type: 'nodeAdded', node: newNode});
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
    if (event.target === this.canvasRef.nativeElement) {
      this.selectedNode = null;
      this.selectedConnection = null;
      this.nodeSelected.emit(null as any);
    }
    this.contextMenu.show = false;
  }

  onCanvasMouseDown(event: MouseEvent): void {
    if (event.target === this.canvasRef.nativeElement ||
      (event.target as HTMLElement).classList.contains('grid-background')) {
      this.isPanning = true;
      this.panStartPos = {x: event.clientX, y: event.clientY};
      this.panStartOffset = {...this.panOffset};
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
      this.canvasUpdated.emit({type: 'zoom', level: this.zoomLevel});
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Delete' && this.selectedNode) {
      this.deleteNode(this.selectedNode);
    }
    if (event.key === 'Delete' && this.selectedConnection) {
      this.deleteConnection(this.selectedConnection);
    }
    if (event.ctrlKey && event.key === 'c' && this.selectedNode) {
      this.copyNode(this.selectedNode);
    }
    if (event.ctrlKey && event.key === 'v' && this.clipboard) {
      this.pasteNode();
    }
    if (event.key === 'Escape' && this.isConnecting) {
      this.cancelConnection();
    }
  }

  onDocumentClick(event: MouseEvent): void {
    if (this.contextMenu.show) {
      this.contextMenu.show = false;
    }
  }

  // Node interaction methods
  selectNode(node: FlowNode, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedNode = node;
    this.selectedConnection = null;
    this.nodeSelected.emit(node);
  }

  startDrag(node: FlowNode, event: MouseEvent): void {
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

    const nodeElement = (event.currentTarget as HTMLElement);
    const rect = nodeElement.getBoundingClientRect();
    this.dragOffset = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };

    this.selectNode(node, event);
  }

  selectConnection(connection: FlowConnection, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedConnection = connection.id;
    this.selectedNode = null;
  }

  deleteConnection(connectionId: string): void {
    if (this.flow) {
      this.flow.connections = this.flow.connections.filter(c => c.id !== connectionId);
      this.connectionDeleted.emit(connectionId);
      this.generateConnectionPoints();
      this.canvasUpdated.emit({type: 'connectionDeleted', connectionId});
    }
  }

  // Canvas control methods
  zoomIn(): void {
    if (this.zoomLevel < this.maxZoom) {
      this.zoomLevel = Math.min(this.maxZoom, this.zoomLevel + 0.25);
      this.canvasUpdated.emit({type: 'zoom', level: this.zoomLevel});
    }
  }

  zoomOut(): void {
    if (this.zoomLevel > this.minZoom) {
      this.zoomLevel = Math.max(this.minZoom, this.zoomLevel - 0.25);
      this.canvasUpdated.emit({type: 'zoom', level: this.zoomLevel});
    }
  }

  fitToScreen(): void {
    if (!this.flow?.nodes || this.flow.nodes.length === 0) return;

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
    this.panOffset.x = (wrapperRect.width / this.zoomLevel - contentWidth) / 2 - minX;
    this.panOffset.y = (wrapperRect.height / this.zoomLevel - contentHeight) / 2 - minY;

    this.canvasUpdated.emit({type: 'fit', zoom: this.zoomLevel, pan: this.panOffset});
  }

  centerView(): void {
    this.panOffset = {x: 0, y: 0};
    this.canvasUpdated.emit({type: 'center', pan: this.panOffset});
  }

  // Node action methods
  editNode(node: FlowNode): void {
    this.nodeSelected.emit(node);
  }

  duplicateNode(node: FlowNode): void {
    const newNode: FlowNode = {
      ...node,
      id: this.generateNodeId(node.type),
      position: {x: node.position.x + 200, y: node.position.y + 100}
    };

    if (this.flow) {
      this.flow.nodes.push(newNode);
      this.generateConnectionPoints();
      this.canvasUpdated.emit({type: 'nodeAdded', node: newNode});
    }
  }

  copyNode(node: FlowNode): void {
    this.clipboard = {...node};
  }

  deleteNode(node: FlowNode): void {
    this.nodeDeleted.emit(node.id);
    this.generateConnectionPoints();
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
      this.generateConnectionPoints();
      this.canvasUpdated.emit({type: 'nodeAdded', node: newNode});
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

  // Helper methods for template
  isConnectionPointValid(pointId: string): boolean {
    return this.validConnectionTargets.includes(pointId);
  }

  isConnectionPointHovered(pointId: string): boolean {
    return this.hoveredConnectionPoint === pointId;
  }

  getConnectionPointClasses(point: ConnectionPoint): string {
    const classes = ['connection-point', point.type];

    if (this.isConnecting) {
      if (this.isConnectionPointValid(point.id)) {
        classes.push('valid-target');
      }
      if (this.isConnectionPointHovered(point.id)) {
        classes.push('hovered');
      }
    }

    return classes.join(' ');
  }

  // Simplified template helper methods to avoid complex expressions
  getInputConnectionClasses(nodeId: string): string {
    const classes = ['connection-point', 'input'];
    const pointId = `${nodeId}-input`;

    if (this.isConnecting) {
      if (this.isConnectionPointValid(pointId)) {
        classes.push('valid-target');
      }
      if (this.isConnectionPointHovered(pointId)) {
        classes.push('hovered');
      }
    }

    return classes.join(' ');
  }

  getOutputConnectionClasses(nodeId: string, index: number): string {
    const classes = ['connection-point', 'output'];
    const pointId = `${nodeId}-output-${index}`;

    if (this.isConnecting) {
      if (this.isConnectionPointValid(pointId)) {
        classes.push('valid-target');
      }
      if (this.isConnectionPointHovered(pointId)) {
        classes.push('hovered');
      }
    }

    return classes.join(' ');
  }

  getInputConnectionTooltip(): string {
    return this.isConnecting ? 'Drop connection here' : 'Click to start connection';
  }

  getOutputConnectionTooltip(output: any): string {
    return output.label + (output.condition ? ' (' + output.condition + ')' : '');
  }

  isInputConnectionHovered(nodeId: string): boolean {
    return this.hoveredConnectionPoint === `${nodeId}-input`;
  }

  isOutputConnectionHovered(nodeId: string, index: number): boolean {
    return this.hoveredConnectionPoint === `${nodeId}-output-${index}`;
  }

  isInputConnectionValid(nodeId: string): boolean {
    return this.validConnectionTargets.includes(`${nodeId}-input`);
  }

  isConnectionStartNode(nodeId: string, index: number): boolean {
    return this.connectionStart?.nodeId === nodeId && this.connectionStart?.index === index;
  }

  getNodeStatusClasses(nodeId: string): string {
    const classes = ['status-indicator'];

    if (this.validConnectionTargets.some(id => id.includes(nodeId))) {
      classes.push('valid');
    } else if (nodeId !== this.connectionStart?.nodeId) {
      classes.push('invalid');
    }

    if (this.connectionStart?.nodeId === nodeId) {
      classes.push('source');
    }

    return classes.join(' ');
  }

  toggleSnapToGrid(): void {
    this.snapToGrid = !this.snapToGrid;
  }

  getSnapToGridIcon(): string {
    return this.snapToGrid ? 'grid_off' : 'grid_4x4';
  }

  getSnapToGridText(): string {
    return this.snapToGrid ? 'Disable Grid Snap' : 'Enable Grid Snap';
  }

  getConnectionLabelPosition(connection: FlowConnection): { x: number; y: number } {
    const sourceNode = this.flow?.nodes.find(n => n.id === connection.sourceId);
    const targetNode = this.flow?.nodes.find(n => n.id === connection.targetId);

    if (!sourceNode || !targetNode) return {x: 0, y: 0};

    // Find specific connection points for better accuracy
    const sourcePoint = this.connectionPoints.find(cp =>
      cp.nodeId === connection.sourceId && cp.type === 'output'
    );
    const targetPoint = this.connectionPoints.find(cp =>
      cp.nodeId === connection.targetId && cp.type === 'input'
    );

    const startX = sourcePoint?.position.x || (sourceNode.position.x + 160);
    const startY = sourcePoint?.position.y || (sourceNode.position.y + 40);
    const endX = targetPoint?.position.x || targetNode.position.x;
    const endY = targetPoint?.position.y || (targetNode.position.y + 40);

    // Calculate midpoint
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;

    return {x: midX, y: midY - 8}; // Offset slightly above the path
  }

  // Enhanced connection validation with detailed feedback
  getConnectionValidationMessage(sourceNodeId: string, targetNodeId: string): string {
    const sourceNode = this.flow?.nodes.find(n => n.id === sourceNodeId);
    const targetNode = this.flow?.nodes.find(n => n.id === targetNodeId);

    if (!sourceNode || !targetNode) return 'Invalid nodes';

    const rule = this.connectionRules.find(r =>
      r.sourceType === sourceNode.type && r.targetType === targetNode.type
    );

    return rule?.description || `${sourceNode.type} → ${targetNode.type}`;
  }

  // Check if a node can accept more connections
  canAcceptMoreConnections(nodeId: string): boolean {
    if (!this.flow) return false;

    const node = this.flow.nodes.find(n => n.id === nodeId);
    if (!node) return false;

    const existingConnections = this.flow.connections.filter(conn =>
      conn.targetId === nodeId
    ).length;

    // Most nodes can only accept one input connection
    const maxInputConnections = node.type === 'end' ? 10 : 1;
    return existingConnections < maxInputConnections;
  }

  // Get connection statistics for a node
  getNodeConnectionStats(nodeId: string): { incoming: number; outgoing: number } {
    if (!this.flow) return {incoming: 0, outgoing: 0};

    const incoming = this.flow.connections.filter(conn => conn.targetId === nodeId).length;
    const outgoing = this.flow.connections.filter(conn => conn.sourceId === nodeId).length;

    return {incoming, outgoing};
  }

  // Validate entire flow integrity
  validateFlowIntegrity(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!this.flow) {
      return {valid: false, issues: ['No flow loaded']};
    }

    // Check for start node
    const startNodes = this.flow.nodes.filter(n => n.type === 'start');
    if (startNodes.length === 0) {
      issues.push('Flow must have a start node');
    } else if (startNodes.length > 1) {
      issues.push('Flow should have only one start node');
    }

    // Check for end node
    const endNodes = this.flow.nodes.filter(n => n.type === 'end');
    if (endNodes.length === 0) {
      issues.push('Flow should have at least one end node');
    }

    // Check for orphaned nodes
    const connectedNodeIds = new Set<string>();
    this.flow.connections.forEach(conn => {
      connectedNodeIds.add(conn.sourceId);
      connectedNodeIds.add(conn.targetId);
    });

    const orphanedNodes = this.flow.nodes.filter(node =>
      !connectedNodeIds.has(node.id) && node.type !== 'start' && node.type !== 'end'
    );

    if (orphanedNodes.length > 0) {
      issues.push(`${orphanedNodes.length} disconnected nodes found`);
    }

    // Check for circular dependencies (basic check)
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) return true;
      if (visited.has(nodeId)) return false;

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const outgoingConnections = this.flow!.connections.filter(conn => conn.sourceId === nodeId);
      for (const conn of outgoingConnections) {
        if (hasCycle(conn.targetId)) return true;
      }

      recursionStack.delete(nodeId);
      return false;
    };

    if (startNodes.length > 0 && hasCycle(startNodes[0].id)) {
      issues.push('Circular dependency detected in flow');
    }

    return {valid: issues.length === 0, issues};
  }

  // Auto-arrange nodes for better layout
  autoArrangeNodes(): void {
    if (!this.flow?.nodes.length) return;

    const startNodes = this.flow.nodes.filter(n => n.type === 'start');
    if (startNodes.length === 0) return;

    const arranged = new Set<string>();
    const levels = new Map<string, number>();

    // BFS to determine levels
    const queue = startNodes.map(n => ({node: n, level: 0}));

    while (queue.length > 0) {
      const {node, level} = queue.shift()!;

      if (arranged.has(node.id)) continue;

      arranged.add(node.id);
      levels.set(node.id, level);

      // Find connected nodes
      const connections = this.flow.connections.filter(conn => conn.sourceId === node.id);
      connections.forEach(conn => {
        const targetNode = this.flow!.nodes.find(n => n.id === conn.targetId);
        if (targetNode && !arranged.has(targetNode.id)) {
          queue.push({node: targetNode, level: level + 1});
        }
      });
    }

    // Position nodes based on levels
    const levelGroups = new Map<number, FlowNode[]>();
    this.flow.nodes.forEach(node => {
      const level = levels.get(node.id) || 0;
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(node);
    });

    const nodeWidth = 200;
    const nodeHeight = 120;
    const levelSpacing = 300;
    const nodeSpacing = 150;

    levelGroups.forEach((nodes, level) => {
      const startY = (nodes.length - 1) * nodeSpacing / -2 + this.canvasHeight / 2;

      nodes.forEach((node, index) => {
        node.position.x = level * levelSpacing + 100;
        node.position.y = startY + index * nodeSpacing;
      });
    });

    this.generateConnectionPoints();
    this.canvasUpdated.emit({type: 'autoArrange'});
  }

  // Smart connection suggestions
  getSuggestedConnections(nodeId: string): Array<{ targetId: string; reason: string; confidence: number }> {
    const suggestions: Array<{ targetId: string; reason: string; confidence: number }> = [];

    if (!this.flow) return suggestions;

    const sourceNode = this.flow.nodes.find(n => n.id === nodeId);
    if (!sourceNode) return suggestions;

    this.flow.nodes.forEach(targetNode => {
      if (targetNode.id === nodeId) return;

      const validation = this.isValidConnection(
        {id: `${nodeId}-output-0`, nodeId, type: 'output', position: {x: 0, y: 0}} as ConnectionPoint,
        {id: `${targetNode.id}-input`, nodeId: targetNode.id, type: 'input', position: {x: 0, y: 0}} as ConnectionPoint
      );

      if (validation.valid) {
        let confidence = 0.5;
        let reason = validation.message;

        // Increase confidence based on common patterns
        if (sourceNode.type === 'start' && targetNode.type === 'page') {
          confidence = 0.9;
          reason = 'Common: Start → Page';
        } else if (sourceNode.type === 'page' && targetNode.type === 'end') {
          confidence = 0.8;
          reason = 'Common: Page → End';
        } else if (sourceNode.type === 'decision' && targetNode.type === 'page') {
          confidence = 0.7;
          reason = 'Common: Decision → Page';
        }

        // Check position proximity
        const distance = Math.sqrt(
          Math.pow(targetNode.position.x - sourceNode.position.x, 2) +
          Math.pow(targetNode.position.y - sourceNode.position.y, 2)
        );

        if (distance < 300) {
          confidence += 0.2;
          reason += ' (nearby)';
        }

        suggestions.push({
          targetId: targetNode.id,
          reason,
          confidence
        });
      }
    });

    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  }
}
