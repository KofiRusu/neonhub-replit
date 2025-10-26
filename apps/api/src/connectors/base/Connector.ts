import type {
  ConnectorActionDefinition,
  ConnectorMetadata,
  ConnectorTriggerDefinition,
  ConnectorAuthContext,
} from "./types.js";

export abstract class Connector {
  constructor(readonly metadata: ConnectorMetadata) {}

  abstract readonly actions: ConnectorActionDefinition[];

  abstract readonly triggers: ConnectorTriggerDefinition[];

  /**
   * Verify that the stored credentials are valid by performing a lightweight
   * API request. Implementations should avoid mutating remote state.
   */
  abstract testConnection(auth: ConnectorAuthContext): Promise<boolean>;

  /**
   * Optional hook executed once the connector has been registered.
   * Use this to perform background initialisation (webhook registration, etc).
   */
  async onRegister(): Promise<void> {
    // Default: no-op
  }
}
