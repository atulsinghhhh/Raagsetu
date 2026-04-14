import "dotenv/config";
import app from "./app.js";
import { connectRedis } from "./services/redis.js";

const PORT = process.env.PORT ?? 3000;

async function start() {
  try {
    // Attempt to connect to Redis (non-blocking)
    connectRedis().catch(err => console.error("Initial Redis connection error:", err));

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Raagsetu backend listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
