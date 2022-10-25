import { removeNonImmediateJob } from "../utils/helpers";
import { redisDel, redisZRem } from "../utils/redis";
import { DeleteJobRequest } from "./types";

const deleteJobHandler = async (
  deleteJobRequest: DeleteJobRequest,
): Promise<null | Error> => {
  const { jobKey, nonce } = deleteJobRequest;
  if (deleteJobRequest.collation) {
    const removeErr = await removeNonImmediateJob(
      jobKey,
      deleteJobRequest.collation,
    );
    if (removeErr) return removeErr;
  } else {
    const [numRemoved, zRemErr] = await redisZRem(
      "Reservations",
      `immediate.${jobKey}`,
    );
    if (zRemErr) return zRemErr;
    if (numRemoved !== 1)
      return Error("Something went wrong while deleting grading job.");
  }
  const [numDeleted, deleteErr] = await redisDel(jobKey);
  if (deleteErr) return deleteErr;
  if (numDeleted !== 1)
    return Error("Something went wrong while deleting grading job.");
  return null;
};

export default deleteJobHandler;
