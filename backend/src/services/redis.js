import { createClient } from "redis";

const redisClient = createClient({ url: process.env.REDIS_URL });

redisClient.on("error", (err) => console.error("Redis Client Error:", err));

/**
 * Connect to Redis. Call once at startup.
 */
export async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log("Redis connected");
  }
}

/**
 * Set a key with an optional TTL (seconds).
 */
export async function setCache(key, value, ttlSeconds) {
  const opts = ttlSeconds ? { EX: ttlSeconds } : {};
  await redisClient.set(key, JSON.stringify(value), opts);
}

/**
 * Get a key. Returns parsed JSON or null.
 */
export async function getCache(key) {
  const raw = await redisClient.get(key);
  return raw ? JSON.parse(raw) : null;
}

export default redisClient;
