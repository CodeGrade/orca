import { GradingJob, EnrichedGradingJob } from "./types";
import { createQueueKey } from "./utils";
import { GradingQueueService } from "./service";

export const createOrUpdateGradingJob = async (
  job: GradingJob,
  isImmediateJob: boolean = false,
) => {
  const orcaKey = createQueueKey(job.key, job.response_url);
  await new GradingQueueService().createOrUpdateJob(
    job,
    Date.now(),
    orcaKey,
    isImmediateJob,
  );
};
