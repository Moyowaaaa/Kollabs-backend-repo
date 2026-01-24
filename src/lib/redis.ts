import Redis from "ioredis";

let redis: Redis | null = null;
let isConnecting = false;
let connectionFailed = false;

/**
 * Get Redis client with lazy initialization
 * Only connects when first needed, not on app startup
 * Reuses existing connection instead of creating new instances
 */
export const getRedisClient = async (): Promise<Redis | null> => {
  // If we've already determined Redis is unavailable, don't keep trying
  if (connectionFailed) {
    return null;
  }

  // Return existing connection if available and connected
  if (
    redis &&
    (redis.status === "ready" ||
      redis.status === "connecting" ||
      redis.status === "connect")
  ) {
    // Wait for connection if still connecting
    if (redis.status === "connecting" || redis.status === "connect") {
      try {
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(
            () => reject(new Error("Connection timeout")),
            5000,
          );
          redis!.once("ready", () => {
            clearTimeout(timeout);
            resolve();
          });
          redis!.once("error", (err) => {
            clearTimeout(timeout);
            reject(err);
          });
        });
      } catch {
        return null;
      }
    }
    return redis;
  }

  // Prevent multiple simultaneous connection attempts
  if (isConnecting) {
    return new Promise((resolve) => {
      const checkConnection = setInterval(() => {
        if (!isConnecting) {
          clearInterval(checkConnection);
          resolve(redis);
        }
      }, 100);

      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkConnection);
        resolve(null);
      }, 5000);
    });
  }

  isConnecting = true;

  try {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

    // Upstash and other cloud Redis providers require TLS
    const isUpstash = redisUrl.includes("upstash.io");

    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          console.warn(
            "⚠️ Redis connection failed after 3 attempts, caching disabled",
          );
          connectionFailed = true;
          return null; // Stop retrying permanently
        }
        return Math.min(times * 500, 2000); // Slower backoff
      },
      lazyConnect: true,
      enableReadyCheck: true,
      // Enable TLS for Upstash (required for secure connection)
      tls: isUpstash ? {} : undefined,
      reconnectOnError: (err) => {
        // Only reconnect on specific errors
        const targetErrors = ["READONLY", "ECONNRESET"];
        if (targetErrors.some((e) => err.message.includes(e))) {
          return true;
        }
        return false;
      },
    });

    // Only attach event listeners once
    redis.on("error", (err) => {
      console.error("Redis error:", err.message);
      // Mark as failed if it's a persistent connection error
      if (err.message.includes("ECONNREFUSED")) {
        connectionFailed = true;
      }
    });

    redis.on("ready", () => {
      console.log("✅ Redis connected and ready");
      connectionFailed = false;
    });

    redis.on("close", () => {
      console.log("🔌 Redis connection closed");
    });

    redis.on("end", () => {
      console.log("🔌 Redis connection ended");
      // Don't set redis to null here - let it try to reconnect
    });

    // Attempt to connect
    await redis.connect();
    isConnecting = false;
    return redis;
  } catch (error) {
    isConnecting = false;
    console.warn(
      "⚠️ Redis unavailable, caching will be skipped:",
      error instanceof Error ? error.message : error,
    );
    connectionFailed = true;
    redis = null;
    return null;
  }
};

/**
 * Check if Redis is available
 */
export const isRedisAvailable = (): boolean => {
  return redis !== null && redis.status === "ready" && !connectionFailed;
};

/**
 * Reset connection state (useful for testing or manual reconnection)
 */
export const resetRedisConnection = (): void => {
  if (redis) {
    redis.disconnect();
    redis = null;
  }
  connectionFailed = false;
  isConnecting = false;
};

export default { getRedisClient, isRedisAvailable, resetRedisConnection };
