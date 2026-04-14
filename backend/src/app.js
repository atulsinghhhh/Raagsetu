import express from "express";
import cors from "cors";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import searchRouter from "./routes/search.js";
import streamRouter from "./routes/stream.js";
import errorHandler from "./middleware/errorHandler.js";

const execFileAsync = promisify(execFile);

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/debug", async (req, res) => {
  try {
    const { stdout } = await execFileAsync("yt-dlp", ["--version"], {
      timeout: 5000,
    });

    res.json({
      success: true,
      version: stdout.trim(),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

app.get("/debug-cookies", (req, res) => {
  try {
    const exists = fs.existsSync(COOKIES_PATH);

    let size = 0;
    if (exists) {
      const stats = fs.statSync(COOKIES_PATH);
      size = stats.size;
    }

    res.json({
      cookiesExist: exists,
      cookiesPath: COOKIES_PATH,
      size,
      cwd: process.cwd(),
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

app.use("/search", searchRouter);
app.use("/stream", streamRouter);

app.use(errorHandler);

export default app;
