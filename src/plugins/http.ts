import { Hono } from "hono";
import { serve } from "@hono/node-server";
import type { Engine } from "../core/engine.js";
import type { EventLog } from "../core/event-log.js";

/**
 * HTTP plugin — health and status endpoint.
 * Mounted at /api/status by main.ts on the same Hono instance as WebConnector,
 * or as a standalone server on its own port.
 */
export function createHttpPlugin(engine: Engine, eventLog: EventLog): Hono {
  const app = new Hono();

  app.get("/api/status", async (c) => {
    const recentEvents = await eventLog.tail(10);
    return c.json({
      status: "running",
      ts: Date.now(),
      recentEvents,
    });
  });

  app.get("/api/events", async (c) => {
    const limit = Number(c.req.query("limit") ?? "50");
    const events = await eventLog.tail(limit);
    return c.json({ events });
  });

  return app;
}
