import { NeuralNode, NeuralConnection, NeuralNetwork as INeuralNetwork, NeuralConfig } from '../types';

export class NeuralNetwork implements INeuralNetwork {
  public nodes: Map<string, NeuralNode> = new Map();
  public connections: Map<string, NeuralConnection> = new Map();
  public inputNodes: string[] = [];
  public outputNodes: string[] = [];
  public fitness: number = 0;
  public generation: number = 0;

  constructor(config: NeuralConfig) {
    this.initializeNetwork(config);
  }

  private initializeNetwork(config: NeuralConfig): void {
    // Create input layer
    for (let i = 0; i < config.hiddenLayers[0]; i++) {
      const nodeId = `input-${i}`;
      this.addNode(nodeId, 'input', 'linear');
      this.inputNodes.push(nodeId);
    }

    // Create hidden layers
    for (let layer = 0; layer < config.hiddenLayers.length - 1; layer++) {
      const layerSize = config.hiddenLayers[layer + 1];
      for (let i = 0; i < layerSize; i++) {
        const nodeId = `hidden-${layer}-${i}`;
        this.addNode(nodeId, 'hidden', 'relu');
      }
    }

    // Create output layer
    const outputSize = config.hiddenLayers[config.hiddenLayers.length - 1];
    for (let i = 0; i < outputSize; i++) {
      const nodeId = `output-${i}`;
      this.addNode(nodeId, 'output', 'sigmoid');
      this.outputNodes.push(nodeId);
    }

    // Create initial connections
    this.createInitialConnections();
  }

  private addNode(id: string, type: NeuralNode['type'], activation: NeuralNode['activation']): void {
    const node: NeuralNode = {
      id,
      type,
      activation,
      bias: Math.random() * 2 - 1, // Random bias between -1 and 1
      weights: new Map(),
      output: 0,
      error: 0,
      layer: this.getLayerFromId(id)
    };
    this.nodes.set(id, node);
  }

  private getLayerFromId(id: string): number {
    if (id.startsWith('input-')) return 0;
    if (id.startsWith('output-')) return 2;
    const match = id.match(/hidden-(\d+)-/);
    return match ? parseInt(match[1]) + 1 : 1;
  }

  private createInitialConnections(): void {
    const nodeIds = Array.from(this.nodes.keys());
    let innovation = 0;

    for (let i = 0; i < nodeIds.length; i++) {
      for (let j = i + 1; j < nodeIds.length; j++) {
        const fromNode = this.nodes.get(nodeIds[i])!;
        const toNode = this.nodes.get(nodeIds[j])!;

        // Only connect if layers are sequential
        if (toNode.layer === fromNode.layer + 1) {
          const connectionId = `${nodeIds[i]}-${nodeIds[j]}`;
          const connection: NeuralConnection = {
            from: nodeIds[i],
            to: nodeIds[j],
            weight: Math.random() * 2 - 1,
            enabled: true,
            innovation: innovation++
          };
          this.connections.set(connectionId, connection);
          fromNode.weights.set(nodeIds[j], connection.weight);
        }
      }
    }
  }

  public forward(inputs: number[]): number[] {
    if (inputs.length !== this.inputNodes.length) {
      throw new Error(`Input size mismatch: expected ${this.inputNodes.length}, got ${inputs.length}`);
    }

    // Set input values
    this.inputNodes.forEach((nodeId, index) => {
      const node = this.nodes.get(nodeId)!;
      node.output = inputs[index];
    });

    // Forward propagation
    const sortedNodes = Array.from(this.nodes.values()).sort((a, b) => a.layer - b.layer);

    for (const node of sortedNodes) {
      if (node.type === 'input') continue;

      let sum = node.bias;
      for (const [targetId, weight] of node.weights) {
        const sourceNode = this.nodes.get(this.getSourceNodeId(targetId, node.id));
        if (sourceNode) {
          sum += sourceNode.output * weight;
        }
      }

      node.output = this.activate(sum, node.activation);
    }

    // Return output values
    return this.outputNodes.map(nodeId => this.nodes.get(nodeId)!.output);
  }

  private getSourceNodeId(targetId: string, currentNodeId: string): string {
    for (const [connectionId, connection] of this.connections) {
      if (connection.to === currentNodeId && connection.from === targetId) {
        return connection.from;
      }
    }
    return targetId; // Fallback
  }

  private activate(value: number, activation: NeuralNode['activation']): number {
    switch (activation) {
      case 'relu':
        return Math.max(0, value);
      case 'sigmoid':
        return 1 / (1 + Math.exp(-value));
      case 'tanh':
        return Math.tanh(value);
      case 'linear':
      default:
        return value;
    }
  }

  public backward(targets: number[], learningRate: number = 0.1): void {
    if (targets.length !== this.outputNodes.length) {
      throw new Error(`Target size mismatch: expected ${this.outputNodes.length}, got ${targets.length}`);
    }

    // Calculate output layer errors
    this.outputNodes.forEach((nodeId, index) => {
      const node = this.nodes.get(nodeId)!;
      const target = targets[index];
      const output = node.output;

      // Error for sigmoid activation
      node.error = (target - output) * output * (1 - output);
    });

    // Backpropagate errors
    const sortedNodes = Array.from(this.nodes.values()).sort((a, b) => b.layer - a.layer);

    for (const node of sortedNodes) {
      if (node.type === 'output') continue;

      let errorSum = 0;
      for (const [targetId, weight] of node.weights) {
        const targetNode = this.nodes.get(targetId);
        if (targetNode) {
          errorSum += targetNode.error * weight;
        }
      }

      // Derivative of activation function
      const derivative = this.activationDerivative(node.output, node.activation);
      node.error = errorSum * derivative;
    }

    // Update weights and biases
    this.updateWeights(learningRate);
  }

  private activationDerivative(output: number, activation: NeuralNode['activation']): number {
    switch (activation) {
      case 'relu':
        return output > 0 ? 1 : 0;
      case 'sigmoid':
        return output * (1 - output);
      case 'tanh':
        return 1 - output * output;
      case 'linear':
      default:
        return 1;
    }
  }

  private updateWeights(learningRate: number): void {
    for (const [connectionId, connection] of this.connections) {
      if (!connection.enabled) continue;

      const fromNode = this.nodes.get(connection.from)!;
      const toNode = this.nodes.get(connection.to)!;

      // Update weight
      const deltaWeight = learningRate * toNode.error * fromNode.output;
      connection.weight += deltaWeight;
      fromNode.weights.set(connection.to, connection.weight);

      // Update bias
      toNode.bias += learningRate * toNode.error;
    }
  }

  public mutate(mutationRate: number = 0.1): void {
    // Mutate connection weights
    for (const connection of this.connections.values()) {
      if (Math.random() < mutationRate) {
        connection.weight += (Math.random() * 2 - 1) * 0.5;
      }
    }

    // Mutate node biases
    for (const node of this.nodes.values()) {
      if (Math.random() < mutationRate) {
        node.bias += (Math.random() * 2 - 1) * 0.5;
      }
    }
  }

  public clone(): NeuralNetwork {
    const cloned = new NeuralNetwork({
      populationSize: 1,
      mutationRate: 0,
      crossoverRate: 0,
      elitismCount: 0,
      maxGenerations: 0,
      targetFitness: 0,
      hiddenLayers: [],
      activationFunctions: []
    });

    // Deep copy nodes
    for (const [id, node] of this.nodes) {
      cloned.nodes.set(id, {
        ...node,
        weights: new Map(node.weights)
      });
    }

    // Deep copy connections
    for (const [id, connection] of this.connections) {
      cloned.connections.set(id, { ...connection });
    }

    cloned.inputNodes = [...this.inputNodes];
    cloned.outputNodes = [...this.outputNodes];
    cloned.fitness = this.fitness;
    cloned.generation = this.generation;

    return cloned;
  }

  public getComplexity(): number {
    return this.connections.size + this.nodes.size;
  }

  public toJSON(): any {
    return {
      nodes: Array.from(this.nodes.entries()),
      connections: Array.from(this.connections.entries()),
      inputNodes: this.inputNodes,
      outputNodes: this.outputNodes,
      fitness: this.fitness,
      generation: this.generation
    };
  }

  public static fromJSON(data: any): NeuralNetwork {
    const network = new NeuralNetwork({
      populationSize: 1,
      mutationRate: 0,
      crossoverRate: 0,
      elitismCount: 0,
      maxGenerations: 0,
      targetFitness: 0,
      hiddenLayers: [],
      activationFunctions: []
    });

    network.nodes = new Map(data.nodes);
    network.connections = new Map(data.connections);
    network.inputNodes = data.inputNodes;
    network.outputNodes = data.outputNodes;
    network.fitness = data.fitness;
    network.generation = data.generation;

    return network;
  }
}