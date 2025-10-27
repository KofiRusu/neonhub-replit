import { logger } from "../../lib/logger.js";
import { connectorRegistry } from "../base/ConnectorRegistry.js";
import type { ConnectorActionContext } from "../base/types.js";

export class ActionHandler {
  async execute<TInput, TResult>(connectorName: string, actionId: string, ctx: ConnectorActionContext<TInput>): Promise<TResult> {
    const connector = connectorRegistry.get(connectorName);
    if (!connector) {
      throw new Error(`Connector '${connectorName}' is not registered`);
    }

    const action = connector.actions.find(a => a.id === actionId);
    if (!action) {
      throw new Error(`Action '${actionId}' is not available for connector '${connectorName}'`);
    }

    const parsedInput = action.inputSchema.parse(ctx.input);

    logger.info({ connector: connectorName, action: actionId }, "Executing connector action");
    const result = await action.execute({ ...ctx, input: parsedInput });
    return result as TResult;
  }
}

export const actionHandler = new ActionHandler();
