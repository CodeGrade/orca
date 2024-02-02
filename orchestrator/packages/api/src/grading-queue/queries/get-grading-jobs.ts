import {
  GradingJob,
  GradingQueueOperationError,
  runOperationWithLock,
} from "@codegrade-orca/common";
import Redis from "ioredis";
import { toInteger } from "lodash";

const getAllGradingJobs = async (): Promise<GradingJob[]> => {
  return await runOperationWithLock(
    async (redisConnection) =>
      await getAllGradingJobsOperation(redisConnection),
  );
};

interface ZRangeItemWithScore {
  member: string;
  score: number;
}

const getAllGradingJobsOperation = async (
  redisConnection: Redis,
): Promise<GradingJob[]> => {
  const reservations: Array<ZRangeItemWithScore> = zrangeToItems(
    await redisConnection.zrange("Reservations", 0, -1, "WITHSCORES"),
  );
  if (reservations.length === 0) return [];
  const submitterInfoCache: Record<string, Array<string>> = {};
  return await Promise.all(
    reservations.map(async (reservation) => {
      const { member } = reservation;
      const reservationMemberSections = member.split(".");
      if (reservationMemberSections.length === 2) {
        return await getImmediateJobFromReservation(
          redisConnection,
          reservationMemberSections as [string, string],
        );
      } else if (reservationMemberSections.length === 3) {
        return await getJobFromReservation(
          redisConnection,
          reservationMemberSections as [string, string, string],
          submitterInfoCache,
        );
      } else {
        throw new GradingQueueOperationError(
          `Invalid reservation member ${reservation.member}`,
        );
      }
    }),
  );
};

const getImmediateJobFromReservation = async (
  redisConnection: Redis,
  [_immediateLiteral, orcaKey]: [string, string],
): Promise<GradingJob> => {
  const enqueuedJobString = await redisConnection.get(orcaKey);
  if (!enqueuedJobString) {
    throw new GradingQueueOperationError(
      `No job was found with key ${orcaKey}.`,
    );
  }
  return JSON.parse(enqueuedJobString) as GradingJob;
};

const getJobFromReservation = async (
  redisConnection: Redis,
  reservationMemberSections: [string, string, string],
  submitterInfoCache: Record<string, Array<string>>,
): Promise<GradingJob> => {
  const collationString = reservationMemberSections
    .slice(0, reservationMemberSections.length - 1)
    .join(".");
  const submitterInfoKey = `SubmitterInfo.${collationString}`;
  if (!submitterInfoCache[submitterInfoKey]) {
    const orcaKeys = await redisConnection.lrange(submitterInfoKey, 0, -1);
    submitterInfoCache[submitterInfoKey] = orcaKeys;
  }
  const orcaKey = submitterInfoCache[submitterInfoKey].shift();
  if (!orcaKey) {
    throw new GradingQueueOperationError(
      `No job key to match reservation member ${reservationMemberSections.join(
        ".",
      )}.`,
    );
  }
  const enqueuedJobString = await redisConnection.get(orcaKey);
  if (!enqueuedJobString) {
    throw new GradingQueueOperationError(
      `No job was found with key ${orcaKey}.`,
    );
  }
  return JSON.parse(enqueuedJobString) as GradingJob;
};

const zrangeToItems = (zrangeRawOutput: string[]) => {
  if (zrangeRawOutput.length % 2 !== 0) {
    throw new GradingQueueOperationError(
      "ZRANGE output does not contain members and scores.",
    );
  }
  const itemArray: Array<ZRangeItemWithScore> = [];
  for (let i = 0; i < zrangeRawOutput.length; i += 2) {
    itemArray.push({
      member: zrangeRawOutput[i],
      score: toInteger(zrangeRawOutput[i + 1]),
    });
  }
  return itemArray;
};

export default getAllGradingJobs;
