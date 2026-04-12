import "dotenv/config";
import app from "./app.js";
import { connectRedis } from "./services/redis.js";

const PORT = process.env.PORT ?? 3000;

async function start() {
  try {
    // Connect to Redis before accepting requests
    await connectRedis();

    app.listen(PORT, () => {
      console.log(`Raagsetu backend listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
