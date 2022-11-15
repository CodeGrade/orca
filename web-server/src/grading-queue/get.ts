import { GradingJob } from "./types";
import { getSubmitterInfo } from "../utils/helpers";
import { redisGet, redisZRangeWithScores } from "../utils/redis";

const KEY_DELIM = ".";

// Get grading jobs with their corresponding nonces
const getCollatedGradingJobs = async (): Promise<
  [GradingJob[] | null, Error | null]
> => {
  const [reservations, reservationsErr] = await redisZRangeWithScores(
    "Reservations",
    0,
    -1,
  );
  if (reservationsErr) {
    return [null, reservationsErr];
  }
  if (!reservations)
    return [null, Error("Reservations could not be retrieved.")];
  // Short circuit if there are no reservations
  if (reservations.length === 0) return [[], null];

  const submitterInfoCache: { [collationKey: string]: string[] } = {};

  // TODO: Handling errors here
  const gradingJobs = await Promise.all(
    reservations.map(async (reservation): Promise<GradingJob> => {
      const { value: reservationKey, score: releaseAt } = reservation;
      const reservationKeySplit = reservationKey.split(KEY_DELIM);

      // Immediate Grading Job - ["immediate", jobKey]
      if (reservationKeySplit[0] === "immediate") {
        const jobKey = reservationKeySplit[1];
        const [jobStr, getErr] = await redisGet(jobKey);
        const job = JSON.parse(jobStr!);
        return { ...job, release_at: releaseAt, nonce: null };
      }

      // Standard Grading Job - [<"team" | "user">, id, nonce]
      const nonce = reservationKeySplit.pop();
      const collationKey = reservationKeySplit.join(".");

      const cacheSubmitterInfo = async (collationKey: string) => {
        const [submitterInfo, submitterInfoErr] = await getSubmitterInfo(
          `SubmitterInfo.${collationKey}`,
        );
        submitterInfoCache[collationKey] = submitterInfo!;
      };
      if (!submitterInfoCache[collationKey])
        await cacheSubmitterInfo(collationKey);

      const submitterInfo = submitterInfoCache[collationKey];

      // Shift here because reservations are in order of increasing release time
      // and SubmitterInfo is in order of increasing arrival time and we want
      // to grade the latest submission first
      const jobKey = submitterInfo.shift();
      const [jobStr, getErr] = await redisGet(jobKey!);
      const job = JSON.parse(jobStr!);
      return {
        ...job,
        release_at: releaseAt,
        created_at: parseInt(nonce!),
        nonce,
      };
    }),
  );
  return [gradingJobs, null];
};

export default getCollatedGradingJobs;
