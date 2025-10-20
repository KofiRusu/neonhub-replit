export interface NeuralNode {
    id: string;
    type: 'input' | 'hidden' | 'output' | 'memory';
    activation: 'relu' | 'sigmoid' | 'tanh' | 'linear';
    bias: number;
    weights: Map<string, number>;
    output: number;
    error: number;
    layer: number;
}
export interface NeuralConnection {
    from: string;
    to: string;
    weight: number;
    enabled: boolean;
    innovation: number;
}
export interface NeuralNetwork {
    nodes: Map<string, NeuralNode>;
    connections: Map<string, NeuralConnection>;
    inputNodes: string[];
    outputNodes: string[];
    fitness: number;
    generation: number;
}
export interface FeedbackLoop {
    id: string;
    source: string;
    target: string;
    strength: number;
    delay: number;
    type: 'positive' | 'negative' | 'neutral';
    active: boolean;
}
export interface TopologyChange {
    type: 'add_node' | 'add_connection' | 'remove_node' | 'remove_connection' | 'mutate_weight';
    nodeId?: string;
    connectionId?: string;
    weight?: number;
    timestamp: Date;
    fitness: number;
}
export interface AdaptationMetrics {
    accuracy: number;
    loss: number;
    convergence: number;
    stability: number;
    adaptability: number;
    timestamp: Date;
}
export interface LearningContext {
    taskId: string;
    data: any[];
    labels: any[];
    epochs: number;
    batchSize: number;
    learningRate: number;
    validationSplit: number;
}
export interface CognitiveState {
    awareness: number;
    confidence: number;
    uncertainty: number;
    adaptability: number;
    learningProgress: number;
    lastUpdate: Date;
}
export interface NeuralConfig {
    populationSize: number;
    mutationRate: number;
    crossoverRate: number;
    elitismCount: number;
    maxGenerations: number;
    targetFitness: number;
    hiddenLayers: number[];
    activationFunctions: string[];
}
export interface AdaptationConfig {
    feedbackThreshold: number;
    topologyChangeRate: number;
    learningRateDecay: number;
    stabilityThreshold: number;
    convergenceCriteria: number;
    maxTopologyChanges: number;
}
//# sourceMappingURL=index.d.ts.map