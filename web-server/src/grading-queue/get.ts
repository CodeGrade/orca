import { client } from "../index";
import { GradingJob, SubmitterInfo, SubmitterInfoData } from "./types";
import { filterNull } from "../utils/helpers";
import { redisZScore } from "../utils/redis";

const DELIM = ".";

const getGradingJobFromSubmissionId = async (
  submissionId: string,
): Promise<[GradingJob | null, Error | null]> => {
  try {
    const gradingJobStr = await client.get(`QueuedGradingInfo.${submissionId}`);
    if (!gradingJobStr)
      return [
        null,
        Error("Grading job not found while getting job from submission id."),
      ];
    const gradingJob: GradingJob = JSON.parse(gradingJobStr);
    // Grading job can be null here
    return [gradingJob, null];
  } catch (error) {
    return [null, error];
  }
};

const getGradingQueue = async (): Promise<[string[] | null, Error | null]> => {
  try {
    const gradingQueue = await client.zRange("GradingQueue", 0, -1);
    // zRange will return [] if there are no jobs
    return [gradingQueue, null];
  } catch (error) {
    if (error instanceof Error) {
      return [null, error];
    }
    return [
      null,
      Error("Something went wrong when trying to retrieve grading queue."),
    ];
  }
};

const getSubmitterSubmissions = async (
  submitter: string,
): Promise<[string[] | null, Error | null]> => {
  try {
    const submissions: string[] = await client.lRange(
      `SubmitterInfo.${submitter}`,
      0,
      -1,
    );
    // lRange returns [] if key not found
    return [submissions, null];
  } catch (error) {
    if (error instanceof Error) {
      return [null, error];
    }
    return [
      null,
      Error("Something went wrong when trying to retrieve submissions list."),
    ];
  }
};

const getUniqueSubmitters = (gradingQueue: string[]): string[] => {
  // Get all submitters
  const allSubmitters: string[] = gradingQueue.map((key: string) => {
    // Ex: [<"team" | "user" | "sub">, "123", "1662660903246"]
    const keySplit: string[] = key.split(DELIM);
    keySplit.pop();
    const submitterInfoKey: string = keySplit.join(DELIM);
    return submitterInfoKey;
  });
  // Narrow to unique submitters
  const uniqueSubmitters: string[] = [...new Set(allSubmitters)];
  return uniqueSubmitters;
};

// TODO: Simplify/Rewrite
const getSubmitterInfoMap = async (
  submitters: string[],
): Promise<[SubmitterInfo | null, Error | null]> => {
  // Get the submission list for each submitter
  const submitterInfoList: Promise<SubmitterInfoData | null>[] = submitters.map(
    async (submitter: string) => {
      const [submissions, submissionsErr] = await getSubmitterSubmissions(
        submitter,
      );
      if (submissionsErr || !submissions || !submissions.length) {
        return null;
      }
      const submitterInfoData: SubmitterInfoData = {
        submitter: submitter,
        submissions: submissions,
      };
      return submitterInfoData;
    },
  );

  try {
    const submitterInfoListRes = await Promise.all(submitterInfoList);
    // Format to SubmitterInfo type
    let submitterInfoMap: SubmitterInfo = {};
    submitterInfoListRes.map((entry: SubmitterInfoData | null) => {
      if (entry) submitterInfoMap[entry.submitter] = entry.submissions;
      return;
    });
    return [submitterInfoMap, null];
  } catch (error) {
    if (error instanceof Error) {
      return [null, error];
    }
    return [
      null,
      Error("Something went wrong while retrieving submitter info."),
    ];
  }
};

// Simplify/Rewrite
// Get grading jobs with their corresponding nonces
const getCollatedGradingJobs = async (): Promise<
  [GradingJob[] | null, Error | null]
> => {
  const [gradingQueue, gradingQueueErr] = await getGradingQueue();
  if (gradingQueueErr) {
    return [null, gradingQueueErr];
  }
  if (!gradingQueue) {
    return [null, Error("Grading queue could not be retrieved.")];
  }
  if (gradingQueue.length === 0) return [[], null];

  const submitters: string[] = getUniqueSubmitters(gradingQueue);

  const [submitterInfoMap, submitterInfoMapErr] = await getSubmitterInfoMap(
    submitters,
  );
  if (submitterInfoMapErr) {
    return [null, submitterInfoMapErr];
  }
  if (!submitterInfoMap) {
    return [null, Error("Submitter info could not be retrieved.")];
  }

  // Grading queue is in order of increasing release timestamp
  // TODO: second time mapping over grading quueue - REWRITE/SIMPLIFY
  // TODO: try catch this?
  const gradingJobs: Promise<GradingJob | null>[] = gradingQueue.map(
    async (key: string) => {
      // Ex: team.234.nonce where 234 is the team is
      // Ex: sub.5.nonce where 5 is the submission id
      const keySplit: string[] = key.split(DELIM);

      // Retrieve timestamp from key
      const nonce: string = keySplit.pop()!;
      if (!nonce) return null;

      let submissionId: string;
      if (keySplit[0] === "sub") {
        submissionId = keySplit[1];
      } else {
        const submitter: string = keySplit.join(DELIM);
        submissionId = submitterInfoMap[submitter].shift()!;
      }

      const [gradingJob, gradingJobErr] = await getGradingJobFromSubmissionId(
        submissionId,
      );
      // TODO: How to handle error/job not found getting a single job? Carry on with the rest?
      if (gradingJobErr || !gradingJob) {
        return null;
      }
      // Store the score (priority) from GradingQueue since priority in
      // QueuedGradingInfo can be overwritten by duplicate submission_id
      const [releaseAt, zScoreErr] = await redisZScore("GradingQueue", key);
      if (zScoreErr || !releaseAt) return null;

      return {
        ...gradingJob,
        release_at: releaseAt,
        nonce: nonce,
      };
    },
  );

  try {
    const results: (GradingJob | null)[] = await Promise.all(gradingJobs);
    const filteredRes: GradingJob[] = filterNull(results);
    filteredRes.sort((a, b) => (a!.release_at > b!.release_at ? 1 : -1));
    return [filteredRes, null];
  } catch (error) {
    return [null, error];
  }
};

export default getCollatedGradingJobs;
