import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL;
let redisAvailable = Boolean(redisUrl);
let hasLoggedRedisError = false;

const redisClient = redisUrl
  ? createClient({
      url: redisUrl,
      socket: {
        // Disable reconnect loops when Redis is unavailable so the API can
        // degrade to uncached responses without flooding logs.
        reconnectStrategy: false,
      },
    })
  : null;

redisClient?.on("error", (err) => {
  if (hasLoggedRedisError) return;

  // Mark as unavailable immediately to stop further attempts
  redisAvailable = false;

  if (err.code === 'ECONNREFUSED' || err.message.includes('ECONNREFUSED')) {
    hasLoggedRedisError = true;
    console.warn("Redis is not available at the provided URL. Caching is disabled.");
    return;
  }

  hasLoggedRedisError = true;
  console.error("Redis Client Error. Caching is disabled:", err.message);
});

/**
 * Connect to Redis. Call once at startup.
 */
export async function connectRedis() {
  if (!redisUrl) {
    console.warn("REDIS_URL is not set. Caching is disabled.");
    return;
  }

  if (!redisClient) {
    console.warn("Redis client could not be created. Caching is disabled.");
    return;
  }

  if (!redisAvailable) {
    return;
  }

  if (!redisClient.isOpen) {
    try {
      await redisClient.connect();
      console.log("Redis connected");
    } catch (err) {
      redisAvailable = false;
      console.error("Redis connection failed. Caching will be disabled:", err.message);
    }
  }
}

/**
 * Set a key with an optional TTL (seconds).
 */
export async function setCache(key, value, ttlSeconds) {
  if (!redisAvailable || !redisClient?.isOpen) return;
  try {
    const opts = ttlSeconds ? { EX: ttlSeconds } : {};
    await redisClient.set(key, JSON.stringify(value), opts);
  } catch (err) {
    redisAvailable = false;
    console.warn("Failed to set cache:", err.message);
  }
}

/**
 * Get a key. Returns parsed JSON or null.
 */
export async function getCache(key) {
  if (!redisAvailable || !redisClient?.isOpen) return null;
  try {
    const raw = await redisClient.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    redisAvailable = false;
    console.warn("Failed to get cache:", err.message);
    return null;
  }
}

export default redisClient;
