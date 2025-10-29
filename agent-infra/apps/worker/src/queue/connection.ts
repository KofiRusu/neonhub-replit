import IORedis from "ioredis";
import { workerConfig } from "../config.js";

const client = new IORedis(workerConfig.redisUrl, { maxRetriesPerRequest: null });

export function getRedisConnection(): IORedis {
  return client;
}
