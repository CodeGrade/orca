import { client } from "../index";
import { StoredGradingJob, SubmitterInfo, SubmitterInfoData } from "./types";
import { filterNull } from "../utils/filter";

const DELIM = ".";

const getGradingJobFromSubmissionId = async (
  submission_id: string
): Promise<[string | null, Error | null]> => {
  try {
    const grading_job = await client.get(`QueuedGradingInfo.${submission_id}`);
    // Grading job can be null here
    return [grading_job, null];
  } catch (error) {
    if (error instanceof Error) {
      return [null, error];
    }
    return [
      null,
      Error(
        "Something went wrong when trying to rertieve grading job by submission id."
      ),
    ];
  }
};

const getGradingQueue = async (): Promise<[string[] | null, Error | null]> => {
  try {
    const grading_queue = await client.zRange("GradingQueue", 0, -1);
    // zRange will return [] if there are no jobs
    return [grading_queue, null];
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
  submitter: string
): Promise<[string[] | null, Error | null]> => {
  try {
    const submissions: string[] = await client.lRange(
      `SubmitterInfo.${submitter}`,
      0,
      -1
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

const getUniqueSubmitters = (grading_queue: string[]): string[] => {
  // Get all submitters
  const all_submitters: string[] = grading_queue.map((key: string) => {
    // Ex: [<"team" | "user" | "sub">, "123", "1662660903246"]
    const key_split: string[] = key.split(DELIM);
    key_split.pop();
    const submitter_info_key: string = key_split.join(DELIM);
    return submitter_info_key;
  });
  // Narrow to unique submitters
  const unique_submitters: string[] = [...new Set(all_submitters)];
  return unique_submitters;
};

const getSubmitterInfo = async (
  submitters: string[]
): Promise<[SubmitterInfo | null, Error | null]> => {
  // Get the submission list for each submitter
  const submitter_info_list: Promise<SubmitterInfoData | null>[] =
    submitters.map(async (submitter: string) => {
      const [submissions, submissions_error] = await getSubmitterSubmissions(
        submitter
      );
      if (submissions_error || !submissions) {
        return null;
      }
      const submitter_info_data: SubmitterInfoData = {
        submitter: submitter,
        submissions: submissions,
      };
      return submitter_info_data;
    });

  try {
    const submitter_info_list_res = await Promise.all(submitter_info_list);
    // Format to SubmitterInfo type
    let submitter_info: SubmitterInfo = {};
    submitter_info_list_res.map((entry: SubmitterInfoData | null) => {
      if (entry) submitter_info[entry.submitter] = entry.submissions;
      return;
    });
    return [submitter_info, null];
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

const getGradingJobs = async (): Promise<
  [StoredGradingJob[] | null, Error | null]
> => {
  const [grading_queue, grading_queue_error] = await getGradingQueue();
  if (grading_queue_error) {
    return [null, grading_queue_error];
  }
  if (!grading_queue) {
    return [null, Error("Grading queue could not be retrieved.")];
  }

  const submitters: string[] = getUniqueSubmitters(grading_queue);

  const [submitter_info, submitter_info_error] = await getSubmitterInfo(
    submitters
  );
  if (submitter_info_error) {
    return [null, submitter_info_error];
  }
  if (!submitter_info) {
    return [null, Error("Submitter info could not be retrieved.")];
  }

  // Grading queue is in order of increasing release timestamp
  const grading_jobs: Promise<StoredGradingJob | null>[] = grading_queue.map(
    async (key: string) => {
      const key_split: string[] = key.split(DELIM);

      // Retrieve timestamp from key
      const timestamp_str: string = key_split.pop()!;
      const timestamp: number = parseInt(timestamp_str);
      if (!timestamp) return null;

      let submission_id: string;
      if (key_split[0] === "sub") {
        submission_id = key_split[1];
      } else {
        const submitter: string = key_split.join(DELIM);
        submission_id = submitter_info[submitter].shift()!;
      }

      const [grading_job, grading_job_error] =
        await getGradingJobFromSubmissionId(submission_id);
      // TODO: How to handle error/job not found getting a single job? Carry on with the rest?
      if (grading_job_error || !grading_job) {
        return null;
      }

      // Store the score (priority) from GradingQueue since priority in
      // QueuedGradingInfo can be overwritten by duplicate submission_id
      try {
        const priority = await client.zScore("GradingQueue", key);
        if (!priority) return null;

        const json_grading_job: StoredGradingJob = {
          ...JSON.parse(grading_job!),
          timestamp: timestamp,
          priority: priority,
        };
        return json_grading_job;
      } catch (error) {
        return null;
      }
    }
  );

  try {
    const results: (StoredGradingJob | null)[] = await Promise.all(
      grading_jobs
    );
    const filtered_results: StoredGradingJob[] = filterNull(results);
    filtered_results.sort((a, b) => (a!.priority > b!.priority ? 1 : -1));
    return [filtered_results, null];
  } catch (error) {
    if (error instanceof Error) {
      return [null, error];
    }
    return [
      null,
      Error("Something went wrong while retrieving the grading queue."),
    ];
  }
};

export default getGradingJobs;
