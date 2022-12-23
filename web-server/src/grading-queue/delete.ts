import { redisDel, redisLRem, redisSRem, redisZRem } from "../utils/redis";
import { Collation, DeleteJobRequest } from "./types";

const deleteJobHandler = async ({
  jobKey,
  collation,
  nonce,
}: DeleteJobRequest): Promise<null | Error> => {
  if (collation) {
    if (!nonce) return Error("Missing nonce for deleting job.");

    const collationKey = `${collation.type}.${collation.id}`;
    const submitterInfoKey = `SubmitterInfo.${collationKey}`;

    // Delete job key from SubmitterInfo
    const [numLRemoved, lRemErr] = await redisLRem(submitterInfoKey, jobKey);
    if (lRemErr) return lRemErr;
    if (numLRemoved !== 1)
      return Error(
        "Something went wrong while removing key from submitter info for deleting job.",
      );

    // Delete nonce for corresponding Nonces object
    const [numNonceRemoved, nonceErr] = await redisZRem(
      `Nonces.${collation.type}.${collation.id}`,
      nonce.toString(),
    );
    if (nonceErr) return nonceErr;
    if (numNonceRemoved !== 1)
      return Error(
        "Something went wrong while removing nonce for deleting job.",
      );

    // Delete reservation
    const [numResRemoved, resErr] = await redisZRem(
      "Reservations",
      `${collationKey}.${nonce}`,
    );
    if (resErr) return resErr;
    if (numResRemoved !== 1)
      return Error(
        "Something went wrong while removing reservation for deleting job.",
      );
  } else {
    // For immediate grading jobs just delete the reservation
    const [numResRemoved, resErr] = await redisZRem(
      "Reservations",
      `immediate.${jobKey}`,
    );
    if (resErr) return resErr;
    if (numResRemoved !== 1)
      return Error("Something went wrong while deleting grading job.");
  }
  // Delete the grading job
  const [numDeleted, deleteErr] = await redisDel(jobKey);
  if (deleteErr) return deleteErr;
  if (numDeleted !== 1)
    return Error("Something went wrong while deleting grading job.");
  return null;
};

export default deleteJobHandler;
