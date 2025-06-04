// models/flow.model.ts
export interface FlowNode {
  id: string;
  type: 'page' | 'condition' | 'start' | 'end' | 'decision';
  label: string;
  position: { x: number; y: number };
  data: any;
  connections: string[];
}

export interface FlowConnection {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
  condition?: string;
}

export interface ServiceFlow {
  id?: string;
  name: string;
  description: string;
  nodes: FlowNode[];
  connections: FlowConnection[];
  metadata: any;
}

export interface Page {
  id: number;
  name: string;
  name_ara: string;
  description: string;
  service_name: string;
  sequence_number_name: string;
  active_ind: boolean;
}

export interface Field {
  id: number;
  _field_name: string;
  _field_display_name: string;
  _field_type: string;
  _mandatory: boolean;
  _is_hidden: boolean;
  validation: any;
}

export interface FieldType {
  id: number;
  name: string;
  code: string;
  active_ind: boolean;
}
