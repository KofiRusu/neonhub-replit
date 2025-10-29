export interface WorkflowNode {
  id: string;
  type: "trigger" | "action" | "condition";
  connector: string;
  action: string;
  config?: Record<string, unknown>;
}

export interface WorkflowEdge {
  from: string;
  to: string;
  condition?: Record<string, unknown>;
}

export interface WorkflowDag {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export function validateDag(dag: WorkflowDag): void {
  const nodeIds = new Set<string>();
  for (const node of dag.nodes) {
    if (nodeIds.has(node.id)) {
      throw new Error(`Duplicate node id detected: ${node.id}`);
    }
    nodeIds.add(node.id);
  }

  for (const edge of dag.edges) {
    if (!nodeIds.has(edge.from)) {
      throw new Error(`Edge references missing source node: ${edge.from}`);
    }
    if (!nodeIds.has(edge.to)) {
      throw new Error(`Edge references missing target node: ${edge.to}`);
    }
  }

  const adjacency = dag.edges.reduce<Map<string, string[]>>((map, edge) => {
    const prev = map.get(edge.from) ?? [];
    prev.push(edge.to);
    map.set(edge.from, prev);
    return map;
  }, new Map());

  const visiting = new Set<string>();
  const visited = new Set<string>();

  function dfs(nodeId: string) {
    if (visiting.has(nodeId)) {
      throw new Error(`Cycle detected involving node ${nodeId}`);
    }
    if (visited.has(nodeId)) {
      return;
    }
    visiting.add(nodeId);
    for (const neighbor of adjacency.get(nodeId) ?? []) {
      dfs(neighbor);
    }
    visiting.delete(nodeId);
    visited.add(nodeId);
  }

  for (const nodeId of nodeIds) {
    if (!visited.has(nodeId)) {
      dfs(nodeId);
    }
  }
}

export function getInitialNodeIds(dag: WorkflowDag): string[] {
  const incomingCount = new Map<string, number>();
  for (const node of dag.nodes) {
    incomingCount.set(node.id, 0);
  }
  for (const edge of dag.edges) {
    incomingCount.set(edge.to, (incomingCount.get(edge.to) ?? 0) + 1);
  }
  return Array.from(incomingCount.entries())
    .filter(([, count]) => count === 0)
    .map(([id]) => id);
}

export function getOutgoingNodeIds(dag: WorkflowDag, fromNodeId: string): string[] {
  return dag.edges.filter(edge => edge.from === fromNodeId).map(edge => edge.to);
}

export function getNextReadyNodeIds(options: {
  dag: WorkflowDag;
  completedNodeIds: Set<string>;
  existingNodeIds: Set<string>;
}): string[] {
  const { dag, completedNodeIds, existingNodeIds } = options;
  const ready: string[] = [];
  for (const node of dag.nodes) {
    if (existingNodeIds.has(node.id)) {
      continue;
    }
    const incoming = dag.edges.filter(edge => edge.to === node.id);
    if (incoming.length === 0) {
      continue;
    }
    const allSatisfied = incoming.every(edge => completedNodeIds.has(edge.from));
    if (allSatisfied) {
      ready.push(node.id);
    }
  }
  return ready;
}
