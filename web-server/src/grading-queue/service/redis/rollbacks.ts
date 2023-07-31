import { RedisClientType } from "redis";
import { EnrichedGradingJob } from "../../types";

const createJob = async (
  client: RedisClientType,
  enrichedJob: EnrichedGradingJob,
  nonce: number,
) => {
  const { orca_key, collation } = enrichedJob;
  await client
    .multi()
    .ZREM("Reservations", `${collation.type}.${collation.id}.${nonce}`)
    .SREM(`Nonces.${collation.type}.${collation.id}`, nonce.toString())
    .LREM(`SubmitterInfo.${collation.type}.${collation.id}`, 0, orca_key)
    .exec();
};

const createImmediateJob = async (client: RedisClientType, orcaKey: string) => {
  await client.ZREM("Reservations", `immediate.${orcaKey}`);
};

const rollbacks = {
  createJob,
  createImmediateJob,
};
export default rollbacks;
