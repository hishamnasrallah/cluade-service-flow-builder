// services/flow.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ServiceFlow, FlowNode, FlowConnection } from '../models/flow.model';

@Injectable({
  providedIn: 'root'
})
export class FlowService {
  private currentFlowSubject = new BehaviorSubject<ServiceFlow | null>(null);
  public currentFlow$ = this.currentFlowSubject.asObservable();

  private selectedNodeSubject = new BehaviorSubject<FlowNode | null>(null);
  public selectedNode$ = this.selectedNodeSubject.asObservable();

  constructor() {}

  setCurrentFlow(flow: ServiceFlow): void {
    this.currentFlowSubject.next(flow);
  }

  getCurrentFlow(): ServiceFlow | null {
    return this.currentFlowSubject.value;
  }

  setSelectedNode(node: FlowNode | null): void {
    this.selectedNodeSubject.next(node);
  }

  getSelectedNode(): FlowNode | null {
    return this.selectedNodeSubject.value;
  }

  addNode(node: FlowNode): void {
    const currentFlow = this.getCurrentFlow();
    if (currentFlow) {
      currentFlow.nodes.push(node);
      this.setCurrentFlow({ ...currentFlow });
    }
  }

  updateNode(nodeId: string, updates: Partial<FlowNode>): void {
    const currentFlow = this.getCurrentFlow();
    if (currentFlow) {
      const nodeIndex = currentFlow.nodes.findIndex(n => n.id === nodeId);
      if (nodeIndex !== -1) {
        currentFlow.nodes[nodeIndex] = { ...currentFlow.nodes[nodeIndex], ...updates };
        this.setCurrentFlow({ ...currentFlow });
      }
    }
  }

  removeNode(nodeId: string): void {
    const currentFlow = this.getCurrentFlow();
    if (currentFlow) {
      currentFlow.nodes = currentFlow.nodes.filter(n => n.id !== nodeId);
      currentFlow.connections = currentFlow.connections.filter(
        c => c.sourceId !== nodeId && c.targetId !== nodeId
      );
      this.setCurrentFlow({ ...currentFlow });
    }
  }

  addConnection(connection: FlowConnection): void {
    const currentFlow = this.getCurrentFlow();
    if (currentFlow) {
      currentFlow.connections.push(connection);
      this.setCurrentFlow({ ...currentFlow });
    }
  }

  removeConnection(connectionId: string): void {
    const currentFlow = this.getCurrentFlow();
    if (currentFlow) {
      currentFlow.connections = currentFlow.connections.filter(c => c.id !== connectionId);
      this.setCurrentFlow({ ...currentFlow });
    }
  }

  createNewFlow(): ServiceFlow {
    return {
      name: 'New Service Flow',
      description: '',
      nodes: [
        {
          id: 'start-1',
          type: 'start',
          label: 'Start',
          position: { x: 100, y: 100 },
          data: {},
          connections: []
        }
      ],
      connections: [],
      metadata: {
        created: new Date(),
        version: '1.0'
      }
    };
  }

  generateNodeId(type: string): string {
    return `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  }
}
