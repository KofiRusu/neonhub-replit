import { logger } from "../../lib/logger.js";
import { connectorRegistry } from "../base/ConnectorRegistry.js";
import type { ConnectorTriggerContext } from "../base/types.js";

export interface TriggerRunResult<TCursor = string | null, TPayload = unknown> {
  cursor: TCursor;
  items: TPayload[];
}

export class TriggerHandler {
  async run<TCursor, TPayload>(connectorName: string, triggerId: string, ctx: ConnectorTriggerContext): Promise<TriggerRunResult<TCursor, TPayload>> {
    const connector = connectorRegistry.get(connectorName);
    if (!connector) {
      throw new Error(`Connector '${connectorName}' is not registered`);
    }

    const trigger = connector.triggers.find(t => t.id === triggerId);
    if (!trigger) {
      throw new Error(`Trigger '${triggerId}' is not available for connector '${connectorName}'`);
    }

    logger.debug({ connector: connectorName, trigger: triggerId }, "Running connector trigger");
    const result = await trigger.run(ctx);
    return result as TriggerRunResult<TCursor, TPayload>;
  }
}

export const triggerHandler = new TriggerHandler();
