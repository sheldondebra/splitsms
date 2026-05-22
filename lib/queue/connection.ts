import IORedis from "ioredis";

let connection: IORedis | null = null;

export function getRedisConnection() {
  if (!process.env.REDIS_URL) return null;
  if (!connection) {
    connection = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
  }
  return connection;
}
