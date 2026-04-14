import { createClient } from "redis";

const redisClient = createClient({ url: process.env.REDIS_URL });

redisClient.on("error", (err) => console.error("Redis Client Error:", err));

/**
 * Connect to Redis. Call once at startup.
 */
export async function connectRedis() {
  if (!redisClient.isOpen) {
    try {
      await redisClient.connect();
      console.log("Redis connected");
    } catch (err) {
      console.error("Redis connection failed. Caching will be disabled:", err.message);
    }
  }
}

/**
 * Set a key with an optional TTL (seconds).
 */
export async function setCache(key, value, ttlSeconds) {
  if (!redisClient.isOpen) return;
  try {
    const opts = ttlSeconds ? { EX: ttlSeconds } : {};
    await redisClient.set(key, JSON.stringify(value), opts);
  } catch (err) {
    console.warn("Failed to set cache:", err.message);
  }
}

/**
 * Get a key. Returns parsed JSON or null.
 */
export async function getCache(key) {
  if (!redisClient.isOpen) return null;
  try {
    const raw = await redisClient.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn("Failed to get cache:", err.message);
    return null;
  }
}

export default redisClient;
