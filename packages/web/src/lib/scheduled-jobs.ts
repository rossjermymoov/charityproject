import { prisma } from "./prisma";

export type JobType =
  | "AUTO_RENEWAL"
  | "SEND_REMINDERS"
  | "SYNC_EMAIL_MARKETING"
  | "PROCESS_WEBHOOKS"
  | "GENERATE_REPORTS"
  | "CLEANUP_EXPIRED_TOKENS";

interface JobConfig {
  [key: string]: unknown;
}

interface JobResult {
  message?: string;
  recordsProcessed?: number;
  [key: string]: unknown;
}

// Registry of available jobs with their metadata
export const JOB_REGISTRY: Record<
  JobType,
  {
    name: string;
    description: string;
    defaultSchedule?: string;
  }
> = {
  AUTO_RENEWAL: {
    name: "Auto Renewal",
    description: "Automatically renew expiring memberships",
    defaultSchedule: "0 2 * * 0", // 2 AM every Sunday
  },
  SEND_REMINDERS: {
    name: "Send Reminders",
    description: "Send reminder notifications to donors and members",
    defaultSchedule: "0 9 * * *", // 9 AM daily
  },
  SYNC_EMAIL_MARKETING: {
    name: "Sync Email Marketing",
    description: "Synchronize contact data with email marketing provider",
    defaultSchedule: "0 */6 * * *", // Every 6 hours
  },
  PROCESS_WEBHOOKS: {
    name: "Process Webhooks",
    description: "Process pending webhook events",
    defaultSchedule: "*/5 * * * *", // Every 5 minutes
  },
  GENERATE_REPORTS: {
    name: "Generate Reports",
    description: "Generate scheduled financial and activity reports",
    defaultSchedule: "0 1 * * 0", // 1 AM every Sunday
  },
  CLEANUP_EXPIRED_TOKENS: {
    name: "Cleanup Expired Tokens",
    description: "Clean up expired preference and session tokens",
    defaultSchedule: "0 3 * * *", // 3 AM daily
  },
};

interface RunJobOptions {
  config?: JobConfig;
}

/**
 * Execute a scheduled job and record its results
 */
export async function runJob(
  jobType: JobType,
  options: RunJobOptions = {}
): Promise<{ success: boolean; error?: string; duration?: number }> {
  const startTime = Date.now();
  let jobRun = null;

  try {
    // Get or create the scheduled job
    let job = await prisma.scheduledJob.findFirst({
      where: { type: jobType },
    });

    if (!job) {
      const registry = JOB_REGISTRY[jobType];
      job = await prisma.scheduledJob.create({
        data: {
          name: registry.name,
          type: jobType,
          description: registry.description,
          schedule: registry.defaultSchedule,
          config: (options.config || {}) as any,
        },
      });
    }

    // Create a job run record
    jobRun = await prisma.jobRun.create({
      data: {
        jobId: job.id,
        status: "RUNNING",
      },
    });

    // Execute the job logic
    const result = await executeJobLogic(jobType, job.config as JobConfig);

    const duration = Date.now() - startTime;

    // Update the job run with success
    await prisma.jobRun.update({
      where: { id: jobRun.id },
      data: {
        status: "SUCCESS",
        completedAt: new Date(),
        duration,
        result: (result || {}) as any,
      },
    });

    // Update the scheduled job
    await prisma.scheduledJob.update({
      where: { id: job.id },
      data: {
        lastRunAt: new Date(),
        lastRunStatus: "SUCCESS",
        lastRunDuration: duration,
      },
    });

    return { success: true, duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Update the job run with error
    if (jobRun) {
      await prisma.jobRun.update({
        where: { id: jobRun.id },
        data: {
          status: "FAILED",
          completedAt: new Date(),
          duration,
          error: errorMessage,
        },
      });
    }

    // Update the scheduled job status
    const job = jobRun
      ? await prisma.scheduledJob.findUnique({
          where: { id: jobRun.jobId },
        })
      : await prisma.scheduledJob.findFirst({
          where: { type: jobType },
        });

    if (job) {
      await prisma.scheduledJob.update({
        where: { id: job.id },
        data: {
          lastRunAt: new Date(),
          lastRunStatus: "FAILED",
          lastRunDuration: duration,
        },
      });
    }

    return { success: false, error: errorMessage, duration };
  }
}

/**
 * Execute the actual logic for a job
 */
async function executeJobLogic(
  jobType: JobType,
  _config: JobConfig
): Promise<JobResult> {
  switch (jobType) {
    case "AUTO_RENEWAL":
      return await executeAutoRenewal();
    case "SEND_REMINDERS":
      return await executeSendReminders();
    case "SYNC_EMAIL_MARKETING":
      return await executeSyncEmailMarketing();
    case "PROCESS_WEBHOOKS":
      return await executeProcessWebhooks();
    case "GENERATE_REPORTS":
      return await executeGenerateReports();
    case "CLEANUP_EXPIRED_TOKENS":
      return await executeCleanupExpiredTokens();
    default:
      throw new Error(`Unknown job type: ${jobType}`);
  }
}

async function executeAutoRenewal(): Promise<JobResult> {
  // TODO: Implement auto-renewal logic
  // This would typically:
  // - Find memberships that are expiring soon
  // - Attempt renewal
  // - Send notifications
  return { message: "Auto renewal job completed" };
}

async function executeSendReminders(): Promise<JobResult> {
  // TODO: Implement reminder sending logic
  // This would typically:
  // - Find reminders that should be sent
  // - Send emails/SMS to contacts
  // - Log delivery results
  return { message: "Reminder job completed" };
}

async function executeSyncEmailMarketing(): Promise<JobResult> {
  // TODO: Implement email marketing sync logic
  // This would typically:
  // - Sync contact data to email provider API
  // - Handle sync errors gracefully
  // - Log sync results
  return { message: "Email marketing sync completed" };
}

async function executeProcessWebhooks(): Promise<JobResult> {
  // TODO: Implement webhook processing logic
  // This would typically:
  // - Find pending webhook events
  // - Retry failed webhooks
  // - Clean up old completed webhooks
  return { message: "Webhook processing completed" };
}

async function executeGenerateReports(): Promise<JobResult> {
  // TODO: Implement report generation logic
  // This would typically:
  // - Generate financial reports
  // - Create activity reports
  // - Email reports to configured recipients
  return { message: "Report generation completed" };
}

async function executeCleanupExpiredTokens(): Promise<JobResult> {
  const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

  // Clean up expired preference tokens
  const deletedTokens = await prisma.preferenceToken.deleteMany({
    where: {
      expiresAt: {
        lt: cutoffDate,
      },
    },
  });

  return {
    message: "Token cleanup completed",
    recordsProcessed: deletedTokens.count,
  };
}

/**
 * Get all scheduled jobs with their status information
 */
export async function getJobStatus() {
  const jobs = await prisma.scheduledJob.findMany({
    include: {
      runs: {
        orderBy: { startedAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return jobs.map((job) => ({
    id: job.id,
    name: job.name,
    type: job.type,
    description: job.description,
    schedule: job.schedule,
    isActive: job.isActive,
    lastRunAt: job.lastRunAt,
    lastRunStatus: job.lastRunStatus,
    lastRunDuration: job.lastRunDuration,
    nextRunAt: job.nextRunAt,
    config: job.config,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    lastRun: job.runs[0] || null,
  }));
}

/**
 * Get detailed run history for a specific job
 */
export async function getJobRunHistory(jobId: string, limit: number = 20) {
  const runs = await prisma.jobRun.findMany({
    where: { jobId },
    orderBy: { startedAt: "desc" },
    take: limit,
  });

  return runs;
}

/**
 * Update a scheduled job configuration
 */
export async function updateScheduledJob(
  jobId: string,
  data: {
    isActive?: boolean;
    schedule?: string | null;
    config?: JobConfig;
  }
) {
  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.schedule !== undefined) updateData.schedule = data.schedule;
  if (data.config !== undefined) updateData.config = data.config as unknown;

  const updated = await prisma.scheduledJob.update({
    where: { id: jobId },
    data: updateData as any,
  });

  return updated;
}

/**
 * Initialize default scheduled jobs if they don't exist
 */
export async function initializeDefaultJobs() {
  const existingJobs = await prisma.scheduledJob.findMany();
  const existingTypes = new Set(existingJobs.map((j) => j.type));

  const jobsToCreate = (Object.keys(JOB_REGISTRY) as JobType[]).filter(
    (type) => !existingTypes.has(type)
  );

  const created = await Promise.all(
    jobsToCreate.map((type) => {
      const registry = JOB_REGISTRY[type];
      return prisma.scheduledJob.create({
        data: {
          name: registry.name,
          type,
          description: registry.description,
          schedule: registry.defaultSchedule,
          config: {},
        },
      });
    })
  );

  return created;
}
