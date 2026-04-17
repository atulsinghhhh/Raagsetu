import "dotenv/config";
import app from "./app.js";
import { connectRedis } from "./services/redis.js";

const PORT = process.env.PORT ?? 3000;
let serverStarted = false;

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});

async function start() {
  try {
    if (serverStarted) {
      return;
    }

    // Attempt to connect to Redis (non-blocking)
    connectRedis().catch(err => console.error("Initial Redis connection error:", err));

    app.listen(PORT, "0.0.0.0", () => {
      serverStarted = true;
      console.log(`Raagsetu backend listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
