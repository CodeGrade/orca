import { redisDel, redisLRem, redisSRem, redisZRem } from "../utils/redis";
import { Collation, DeleteJobRequest } from "./types";

const deleteJobHandler = async (
  jobKey: string,
  nonce?: number,
  collation?: Collation,
): Promise<null | Error> => {
  if (collation) {
    if (!nonce) return Error("Missing nonce for deleting job.");

    const collationKey = `${collation.type}.${collation.id}`;
    const submitterInfoKey = `SubmitterInfo.${collationKey}`;

    const [numLRemoved, lRemErr] = await redisLRem(submitterInfoKey, jobKey);
    if (lRemErr) return lRemErr;
    if (numLRemoved !== 1)
      return Error(
        "Something went wrong while removing key from submitter for deleting job.",
      );

    const [numRemoved, sRemErr] = await redisSRem(
      `Nonces.${collationKey}`,
      nonce.toString(),
    );
    if (sRemErr) return sRemErr;
    if (numRemoved !== 1)
      return Error(
        "Something went wrong while removing nonce for deleting job.",
      );

    const [numZRemoved, zRemErr] = await redisZRem(
      "Reservations",
      `${collationKey}.${nonce}`,
    );
    if (zRemErr) return zRemErr;
    if (numZRemoved !== 1)
      return Error(
        "Something went wrong while removing reservation for deleting job.",
      );
    return null;
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
