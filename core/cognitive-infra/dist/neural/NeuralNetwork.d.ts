import { NeuralNode, NeuralConnection, NeuralNetwork as INeuralNetwork, NeuralConfig } from '../types';
export declare class NeuralNetwork implements INeuralNetwork {
    nodes: Map<string, NeuralNode>;
    connections: Map<string, NeuralConnection>;
    inputNodes: string[];
    outputNodes: string[];
    fitness: number;
    generation: number;
    constructor(config: NeuralConfig);
    private initializeNetwork;
    private addNode;
    private getLayerFromId;
    private createInitialConnections;
    forward(inputs: number[]): number[];
    private getSourceNodeId;
    private activate;
    backward(targets: number[], learningRate?: number): void;
    private activationDerivative;
    private updateWeights;
    mutate(mutationRate?: number): void;
    clone(): NeuralNetwork;
    getComplexity(): number;
    toJSON(): any;
    static fromJSON(data: any): NeuralNetwork;
}
//# sourceMappingURL=NeuralNetwork.d.ts.map