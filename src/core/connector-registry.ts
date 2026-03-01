import type { Connector } from "./types.js";

/**
 * Tracks which connector channel the user last interacted through.
 * Replies from background tasks (cron, heartbeat) are delivered via this channel.
 */
export class ConnectorRegistry {
  private connectors = new Map<string, Connector>();
  private lastConnectorId: string | null = null;
  private lastUserId: string | null = null;

  register(connector: Connector): void {
    this.connectors.set(connector.id, connector);
  }

  unregister(id: string): void {
    this.connectors.delete(id);
  }

  /** Called by a connector when the user sends a message. */
  recordInteraction(connectorId: string, userId: string): void {
    this.lastConnectorId = connectorId;
    this.lastUserId = userId;
  }

  /** Send a message through the last-interacted connector. */
  async sendToLast(text: string): Promise<boolean> {
    if (!this.lastConnectorId || !this.lastUserId) return false;
    const connector = this.connectors.get(this.lastConnectorId);
    if (!connector) return false;
    await connector.send(this.lastUserId, text);
    return true;
  }

  /** Send a message through a specific connector. */
  async send(connectorId: string, userId: string, text: string): Promise<boolean> {
    const connector = this.connectors.get(connectorId);
    if (!connector) return false;
    await connector.send(userId, text);
    return true;
  }

  getLastConnectorId(): string | null {
    return this.lastConnectorId;
  }

  getLastUserId(): string | null {
    return this.lastUserId;
  }

  listConnectors(): string[] {
    return Array.from(this.connectors.keys());
  }
}
