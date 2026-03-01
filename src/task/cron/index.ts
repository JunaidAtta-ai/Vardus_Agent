import * as fs from "fs";
import * as path from "path";
import nodeCron from "node-cron";
import { randomUUID } from "crypto";
import type { Engine } from "../../core/engine.js";
import type { EventLog } from "../../core/event-log.js";
import type { ConnectorRegistry } from "../../core/connector-registry.js";

const CRON_DIR = path.resolve("data/cron");
const JOBS_FILE = path.join(CRON_DIR, "jobs.json");

export interface CronJob {
  id: string;
  name: string;
  schedule: string; // cron expression, e.g. "0 */4 * * *"
  prompt: string;   // prompt to run through the AI engine
  enabled: boolean;
  lastRunAt?: number;
}

function loadJobs(): CronJob[] {
  if (!fs.existsSync(JOBS_FILE)) return [];
  return JSON.parse(fs.readFileSync(JOBS_FILE, "utf8")) as CronJob[];
}

function saveJobs(jobs: CronJob[]): void {
  fs.mkdirSync(CRON_DIR, { recursive: true });
  fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2), "utf8");
}

/**
 * CronEngine — manages scheduled AI tasks.
 * Jobs are persisted in data/cron/jobs.json.
 * On fire: emits a `cron.fire` event and runs the job prompt through the AI engine.
 * The reply is delivered via the ConnectorRegistry to the last-interacted channel.
 */
export class CronEngine {
  private tasks = new Map<string, nodeCron.ScheduledTask>();
  private jobs: CronJob[] = [];

  constructor(
    private readonly engine: Engine,
    private readonly eventLog: EventLog,
    private readonly connectorRegistry: ConnectorRegistry,
  ) {}

  start(): void {
    this.jobs = loadJobs();
    for (const job of this.jobs) {
      if (job.enabled) this.scheduleJob(job);
    }
    console.log(`[CronEngine] Started ${this.jobs.length} jobs`);
  }

  stop(): void {
    for (const task of this.tasks.values()) {
      task.stop();
    }
    this.tasks.clear();
  }

  private scheduleJob(job: CronJob): void {
    if (!nodeCron.validate(job.schedule)) {
      console.warn(`[CronEngine] Invalid cron expression for job "${job.name}": ${job.schedule}`);
      return;
    }
    const task = nodeCron.schedule(job.schedule, async () => {
      await this.fireJob(job);
    });
    this.tasks.set(job.id, task);
  }

  private async fireJob(job: CronJob): Promise<void> {
    await this.eventLog.emit("cron.fire", { jobId: job.id, jobName: job.name });
    job.lastRunAt = Date.now();
    saveJobs(this.jobs);

    try {
      const ctx = { sessionId: `cron-${job.id}`, connectorId: "cron" };
      const reply = await this.engine.oneShot(job.prompt, ctx);
      await this.connectorRegistry.sendToLast(reply);
    } catch (err) {
      await this.eventLog.emit("error", { source: "cron", jobId: job.id, error: String(err) });
    }
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────

  addJob(params: Omit<CronJob, "id">): CronJob {
    const job: CronJob = { ...params, id: randomUUID().slice(0, 8) };
    this.jobs.push(job);
    saveJobs(this.jobs);
    if (job.enabled) this.scheduleJob(job);
    return job;
  }

  removeJob(id: string): boolean {
    const task = this.tasks.get(id);
    if (task) { task.stop(); this.tasks.delete(id); }
    const before = this.jobs.length;
    this.jobs = this.jobs.filter((j) => j.id !== id);
    saveJobs(this.jobs);
    return this.jobs.length < before;
  }

  listJobs(): CronJob[] {
    return [...this.jobs];
  }
}
