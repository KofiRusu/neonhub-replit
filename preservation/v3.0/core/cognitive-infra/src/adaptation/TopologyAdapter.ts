import { TopologyChange, NeuralNetwork, NeuralNode, NeuralConnection, AdaptationConfig } from '../types';

export class TopologyAdapter {
  private network: NeuralNetwork;
  private config: AdaptationConfig;
  private topologyHistory: TopologyChange[] = [];
  private innovationCounter = 0;

  constructor(network: NeuralNetwork, config: AdaptationConfig) {
    this.network = network;
    this.config = config;
  }

  public adaptTopology(fitness: number, generation: number): boolean {
    if (Math.random() > this.config.topologyChangeRate) {
      return false; // No adaptation this generation
    }

    const change = this.generateTopologyChange(fitness);
    if (change) {
      this.applyTopologyChange(change);
      this.topologyHistory.push(change);
      return true;
    }

    return false;
  }

  private generateTopologyChange(fitness: number): TopologyChange | null {
    const changeTypes: Array<'add_node' | 'add_connection' | 'remove_node' | 'remove_connection' | 'mutate_weight'> = [
      'add_node', 'add_connection', 'remove_node', 'remove_connection', 'mutate_weight'
    ];

    const randomType = changeTypes[Math.floor(Math.random() * changeTypes.length)];

    switch (randomType) {
      case 'add_node':
        return this.generateAddNodeChange(fitness);
      case 'add_connection':
        return this.generateAddConnectionChange(fitness);
      case 'remove_node':
        return this.generateRemoveNodeChange(fitness);
      case 'remove_connection':
        return this.generateRemoveConnectionChange(fitness);
      case 'mutate_weight':
        return this.generateMutateWeightChange(fitness);
      default:
        return null;
    }
  }

  private generateAddNodeChange(fitness: number): TopologyChange | null {
    // Find a random connection to split
    const connections = Array.from(this.network.connections.values()).filter(c => c.enabled);
    if (connections.length === 0) return null;

    const connection = connections[Math.floor(Math.random() * connections.length)];

    return {
      type: 'add_node',
      nodeId: `hidden-${Date.now()}`,
      connectionId: connection.from + '-' + connection.to,
      timestamp: new Date(),
      fitness
    };
  }

  private generateAddConnectionChange(fitness: number): TopologyChange | null {
    // Find two nodes that aren't connected
    const nodes = Array.from(this.network.nodes.keys());
    const maxAttempts = 10;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const fromIndex = Math.floor(Math.random() * nodes.length);
      const toIndex = Math.floor(Math.random() * nodes.length);

      if (fromIndex === toIndex) continue;

      const fromNode = this.network.nodes.get(nodes[fromIndex])!;
      const toNode = this.network.nodes.get(nodes[toIndex])!;

      // Only connect if layers allow it (forward connections)
      if (toNode.layer <= fromNode.layer) continue;

      const connectionId = `${nodes[fromIndex]}-${nodes[toIndex]}`;
      if (!this.network.connections.has(connectionId)) {
        return {
          type: 'add_connection',
          connectionId,
          timestamp: new Date(),
          fitness
        };
      }
    }

    return null;
  }

  private generateRemoveNodeChange(fitness: number): TopologyChange | null {
    // Find a hidden node to remove
    const hiddenNodes = Array.from(this.network.nodes.values())
      .filter(node => node.type === 'hidden')
      .map(node => node.id);

    if (hiddenNodes.length === 0) return null;

    const nodeToRemove = hiddenNodes[Math.floor(Math.random() * hiddenNodes.length)];

    return {
      type: 'remove_node',
      nodeId: nodeToRemove,
      timestamp: new Date(),
      fitness
    };
  }

  private generateRemoveConnectionChange(fitness: number): TopologyChange | null {
    // Find a connection to remove
    const connections = Array.from(this.network.connections.values()).filter(c => c.enabled);
    if (connections.length === 0) return null;

    const connection = connections[Math.floor(Math.random() * connections.length)];

    return {
      type: 'remove_connection',
      connectionId: connection.from + '-' + connection.to,
      timestamp: new Date(),
      fitness
    };
  }

  private generateMutateWeightChange(fitness: number): TopologyChange | null {
    // Find a connection to mutate
    const connections = Array.from(this.network.connections.values()).filter(c => c.enabled);
    if (connections.length === 0) return null;

    const connection = connections[Math.floor(Math.random() * connections.length)];
    const newWeight = (Math.random() * 4 - 2); // Random weight between -2 and 2

    return {
      type: 'mutate_weight',
      connectionId: connection.from + '-' + connection.to,
      weight: newWeight,
      timestamp: new Date(),
      fitness
    };
  }

  private applyTopologyChange(change: TopologyChange): void {
    switch (change.type) {
      case 'add_node':
        this.addNode(change);
        break;
      case 'add_connection':
        this.addConnection(change);
        break;
      case 'remove_node':
        this.removeNode(change);
        break;
      case 'remove_connection':
        this.removeConnection(change);
        break;
      case 'mutate_weight':
        this.mutateWeight(change);
        break;
    }
  }

  private addNode(change: TopologyChange): void {
    if (!change.nodeId || !change.connectionId) return;

    const connection = this.network.connections.get(change.connectionId);
    if (!connection) return;

    // Create new hidden node
    const newNode: NeuralNode = {
      id: change.nodeId,
      type: 'hidden',
      activation: 'relu',
      bias: Math.random() * 2 - 1,
      weights: new Map(),
      output: 0,
      error: 0,
      layer: 1 // Assume middle layer
    };

    // Disable original connection
    connection.enabled = false;

    // Create two new connections
    const connection1: NeuralConnection = {
      from: connection.from,
      to: change.nodeId,
      weight: 1.0,
      enabled: true,
      innovation: this.innovationCounter++
    };

    const connection2: NeuralConnection = {
      from: change.nodeId,
      to: connection.to,
      weight: connection.weight,
      enabled: true,
      innovation: this.innovationCounter++
    };

    // Add to network
    this.network.nodes.set(change.nodeId, newNode);
    this.network.connections.set(`${connection.from}-${change.nodeId}`, connection1);
    this.network.connections.set(`${change.nodeId}-${connection.to}`, connection2);

    // Update node weights
    newNode.weights.set(connection.to, connection2.weight);
    const fromNode = this.network.nodes.get(connection.from)!;
    fromNode.weights.set(change.nodeId, connection1.weight);
  }

  private addConnection(change: TopologyChange): void {
    if (!change.connectionId) return;

    const [fromId, toId] = change.connectionId.split('-');
    if (!fromId || !toId) return;

    const connection: NeuralConnection = {
      from: fromId,
      to: toId,
      weight: Math.random() * 2 - 1,
      enabled: true,
      innovation: this.innovationCounter++
    };

    this.network.connections.set(change.connectionId, connection);

    // Update node weights
    const fromNode = this.network.nodes.get(fromId);
    if (fromNode) {
      fromNode.weights.set(toId, connection.weight);
    }
  }

  private removeNode(change: TopologyChange): void {
    if (!change.nodeId) return;

    const node = this.network.nodes.get(change.nodeId);
    if (!node) return;

    // Remove all connections to/from this node
    const connectionsToRemove: string[] = [];
    for (const [connectionId, connection] of this.network.connections) {
      if (connection.from === change.nodeId || connection.to === change.nodeId) {
        connectionsToRemove.push(connectionId);
      }
    }

    connectionsToRemove.forEach(id => this.network.connections.delete(id));

    // Remove node
    this.network.nodes.delete(change.nodeId);
  }

  private removeConnection(change: TopologyChange): void {
    if (!change.connectionId) return;

    const connection = this.network.connections.get(change.connectionId);
    if (!connection) return;

    connection.enabled = false;

    // Update node weights
    const fromNode = this.network.nodes.get(connection.from);
    if (fromNode) {
      fromNode.weights.delete(connection.to);
    }
  }

  private mutateWeight(change: TopologyChange): void {
    if (!change.connectionId || change.weight === undefined) return;

    const connection = this.network.connections.get(change.connectionId);
    if (!connection) return;

    connection.weight = change.weight;

    // Update node weights
    const fromNode = this.network.nodes.get(connection.from);
    if (fromNode) {
      fromNode.weights.set(connection.to, change.weight);
    }
  }

  public getTopologyHistory(): TopologyChange[] {
    return [...this.topologyHistory];
  }

  public getTopologyComplexity(): number {
    return this.network.nodes.size + this.network.connections.size;
  }

  public resetTopologyHistory(): void {
    this.topologyHistory = [];
  }

  public getTopologyStats(): { [key: string]: number } {
    const changes = this.topologyHistory;
    return {
      totalChanges: changes.length,
      addNodeChanges: changes.filter(c => c.type === 'add_node').length,
      addConnectionChanges: changes.filter(c => c.type === 'add_connection').length,
      removeNodeChanges: changes.filter(c => c.type === 'remove_node').length,
      removeConnectionChanges: changes.filter(c => c.type === 'remove_connection').length,
      mutateWeightChanges: changes.filter(c => c.type === 'mutate_weight').length,
      currentNodes: this.network.nodes.size,
      currentConnections: this.network.connections.size
    };
  }
}