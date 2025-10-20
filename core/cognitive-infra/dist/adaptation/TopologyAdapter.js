"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TopologyAdapter = void 0;
class TopologyAdapter {
    constructor(network, config) {
        this.topologyHistory = [];
        this.innovationCounter = 0;
        this.network = network;
        this.config = config;
    }
    adaptTopology(fitness, generation) {
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
    generateTopologyChange(fitness) {
        const changeTypes = [
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
    generateAddNodeChange(fitness) {
        // Find a random connection to split
        const connections = Array.from(this.network.connections.values()).filter(c => c.enabled);
        if (connections.length === 0)
            return null;
        const connection = connections[Math.floor(Math.random() * connections.length)];
        return {
            type: 'add_node',
            nodeId: `hidden-${Date.now()}`,
            connectionId: connection.from + '-' + connection.to,
            timestamp: new Date(),
            fitness
        };
    }
    generateAddConnectionChange(fitness) {
        // Find two nodes that aren't connected
        const nodes = Array.from(this.network.nodes.keys());
        const maxAttempts = 10;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const fromIndex = Math.floor(Math.random() * nodes.length);
            const toIndex = Math.floor(Math.random() * nodes.length);
            if (fromIndex === toIndex)
                continue;
            const fromNode = this.network.nodes.get(nodes[fromIndex]);
            const toNode = this.network.nodes.get(nodes[toIndex]);
            // Only connect if layers allow it (forward connections)
            if (toNode.layer <= fromNode.layer)
                continue;
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
    generateRemoveNodeChange(fitness) {
        // Find a hidden node to remove
        const hiddenNodes = Array.from(this.network.nodes.values())
            .filter(node => node.type === 'hidden')
            .map(node => node.id);
        if (hiddenNodes.length === 0)
            return null;
        const nodeToRemove = hiddenNodes[Math.floor(Math.random() * hiddenNodes.length)];
        return {
            type: 'remove_node',
            nodeId: nodeToRemove,
            timestamp: new Date(),
            fitness
        };
    }
    generateRemoveConnectionChange(fitness) {
        // Find a connection to remove
        const connections = Array.from(this.network.connections.values()).filter(c => c.enabled);
        if (connections.length === 0)
            return null;
        const connection = connections[Math.floor(Math.random() * connections.length)];
        return {
            type: 'remove_connection',
            connectionId: connection.from + '-' + connection.to,
            timestamp: new Date(),
            fitness
        };
    }
    generateMutateWeightChange(fitness) {
        // Find a connection to mutate
        const connections = Array.from(this.network.connections.values()).filter(c => c.enabled);
        if (connections.length === 0)
            return null;
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
    applyTopologyChange(change) {
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
    addNode(change) {
        if (!change.nodeId || !change.connectionId)
            return;
        const connection = this.network.connections.get(change.connectionId);
        if (!connection)
            return;
        // Create new hidden node
        const newNode = {
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
        const connection1 = {
            from: connection.from,
            to: change.nodeId,
            weight: 1.0,
            enabled: true,
            innovation: this.innovationCounter++
        };
        const connection2 = {
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
        const fromNode = this.network.nodes.get(connection.from);
        fromNode.weights.set(change.nodeId, connection1.weight);
    }
    addConnection(change) {
        if (!change.connectionId)
            return;
        const [fromId, toId] = change.connectionId.split('-');
        if (!fromId || !toId)
            return;
        const connection = {
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
    removeNode(change) {
        if (!change.nodeId)
            return;
        const node = this.network.nodes.get(change.nodeId);
        if (!node)
            return;
        // Remove all connections to/from this node
        const connectionsToRemove = [];
        for (const [connectionId, connection] of this.network.connections) {
            if (connection.from === change.nodeId || connection.to === change.nodeId) {
                connectionsToRemove.push(connectionId);
            }
        }
        connectionsToRemove.forEach(id => this.network.connections.delete(id));
        // Remove node
        this.network.nodes.delete(change.nodeId);
    }
    removeConnection(change) {
        if (!change.connectionId)
            return;
        const connection = this.network.connections.get(change.connectionId);
        if (!connection)
            return;
        connection.enabled = false;
        // Update node weights
        const fromNode = this.network.nodes.get(connection.from);
        if (fromNode) {
            fromNode.weights.delete(connection.to);
        }
    }
    mutateWeight(change) {
        if (!change.connectionId || change.weight === undefined)
            return;
        const connection = this.network.connections.get(change.connectionId);
        if (!connection)
            return;
        connection.weight = change.weight;
        // Update node weights
        const fromNode = this.network.nodes.get(connection.from);
        if (fromNode) {
            fromNode.weights.set(connection.to, change.weight);
        }
    }
    getTopologyHistory() {
        return [...this.topologyHistory];
    }
    getTopologyComplexity() {
        return this.network.nodes.size + this.network.connections.size;
    }
    resetTopologyHistory() {
        this.topologyHistory = [];
    }
    getTopologyStats() {
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
exports.TopologyAdapter = TopologyAdapter;
//# sourceMappingURL=TopologyAdapter.js.map