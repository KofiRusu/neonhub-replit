import { TopologyChange, NeuralNetwork, AdaptationConfig } from '../types';
export declare class TopologyAdapter {
    private network;
    private config;
    private topologyHistory;
    private innovationCounter;
    constructor(network: NeuralNetwork, config: AdaptationConfig);
    adaptTopology(fitness: number, generation: number): boolean;
    private generateTopologyChange;
    private generateAddNodeChange;
    private generateAddConnectionChange;
    private generateRemoveNodeChange;
    private generateRemoveConnectionChange;
    private generateMutateWeightChange;
    private applyTopologyChange;
    private addNode;
    private addConnection;
    private removeNode;
    private removeConnection;
    private mutateWeight;
    getTopologyHistory(): TopologyChange[];
    getTopologyComplexity(): number;
    resetTopologyHistory(): void;
    getTopologyStats(): {
        [key: string]: number;
    };
}
//# sourceMappingURL=TopologyAdapter.d.ts.map