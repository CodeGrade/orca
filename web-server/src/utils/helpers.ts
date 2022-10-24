import { redisExists, redisLRange, redisZAdd } from "./redis";

export const jobInQueue = async (
  jobKey: string,
): Promise<[boolean | null, Error | null]> => {
  const [exists, existsErr] = await redisExists(jobKey);
  if (existsErr) return [null, existsErr];
  return [exists ? true : false, null];
};

export const addToReservations = async (
  value: string,
  score: number,
): Promise<Error | null> => {
  // should always be 1 since we only ever add 1 entry at time
  const [numAdded, zAddErr] = await redisZAdd("Reservations", score, value);
  if (zAddErr) return zAddErr;
  if (numAdded !== 1) return Error("Error while creating reservation.");
  return null;
};

export const filterNull = (arr: any[]): any[] => {
  return arr.filter((x) => x);
};

export const getSubmitterInfo = async (
  submitter_info_key: string,
): Promise<[string[] | null, Error | null]> => {
  const [submitter_info, lrange_err] = await redisLRange(
    submitter_info_key,
    0,
    -1,
  );
  if (lrange_err) return [null, lrange_err];
  if (!submitter_info)
    return [
      null,
      Error(
        "Failed to retrieve submitter info for given submitter when moving grading job.",
      ),
    ];
  return [submitter_info, null];
};
