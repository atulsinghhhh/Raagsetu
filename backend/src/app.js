import express from "express";
import cors from "cors";
import fs from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import searchRouter from "./routes/search.js";
import streamRouter from "./routes/stream.js";
import errorHandler from "./middleware/errorHandler.js";
import { findCookiesFile } from "./services/cookieService.js";

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
    const cookiesPath = findCookiesFile();
    const exists = Boolean(cookiesPath);

    let size = 0;
    if (exists) {
      const stats = fs.statSync(cookiesPath);
      size = stats.size;
    }

    res.json({
      cookiesExist: exists,
      activePath: cookiesPath,
      size,
      cwd: process.cwd(),
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

app.get("/test-yt", async (req, res) => {
  try {
    const ytdlp = require("yt-dlp-exec");

    const result = await ytdlp(
      "https://www.youtube.com/watch?v=tQHAwV9B8hQ",
      {
        cookies: "/usr/src/app/cookies.txt",
        dumpSingleJson: true,
      }
    );

    res.json({ success: true, title: result.title });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.use("/search", searchRouter);
app.use("/stream", streamRouter);

app.use(errorHandler);

export default app;
