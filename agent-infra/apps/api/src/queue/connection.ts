import IORedis from "ioredis";
import { appConfig } from "../config.js";

const client = new IORedis(appConfig.redisUrl, { maxRetriesPerRequest: null });

export function getRedisConnection(): IORedis {
  return client;
}
