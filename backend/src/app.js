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

app.get("/debug-yt", async (req, res) => {
  try {
    const videoId = "tQHAwV9B8hQ";
    const cookiesPath = findCookiesFile();
    
    // Test command: get just the title using yt-dlp directly
    const args = ["--get-title", "--no-warnings", "--no-check-certificates"];
    if (cookiesPath) args.push("--cookies", cookiesPath);
    args.push(`https://www.youtube.com/watch?v=${videoId}`);

    const { stdout, stderr } = await execFileAsync("yt-dlp", args, { timeout: 10000 });

    res.json({
      success: true,
      title: stdout.trim(),
      stderr: stderr ? stderr.trim() : null,
      usingCookies: !!cookiesPath,
      cookiesPath: cookiesPath
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      command: err.cmd,
      hasCookies: !!findCookiesFile()
    });
  }
});

app.get("/debug-stream", async (req, res) => {
  const videoId = req.query.v || "tQHAwV9B8hQ";
  const results = {};

  // Test community Cobalt instances (no JWT)
  for (const base of ["https://cobalt.api.timelessnesses.me", "https://co.wuk.sh", "https://cobalt.codeq.ru"]) {
    const key = `cobalt_${new URL(base).hostname.replace(/\./g,"_")}`;
    try {
      const r = await fetch(`${base}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ url: `https://www.youtube.com/watch?v=${videoId}`, downloadMode: "audio", audioFormat: "mp3" }),
        signal: AbortSignal.timeout(12000)
      });
      const body = await r.json();
      results[key] = { status: r.status, responseStatus: body.status, hasUrl: !!body.url, snippet: JSON.stringify(body).substring(0, 200) };
    } catch(e) { results[key] = { error: e.message }; }
  }

  // Test Invidious instances
  for (const inst of ["https://invidious.io.lol", "https://invidious.privacyredirect.com", "https://invidious.fdn.fr", "https://invidious.flokinet.to"]) {
    const key = `inv_${new URL(inst).hostname.replace(/\./g,"_")}`;
    try {
      const r = await fetch(`${inst}/api/v1/videos/${videoId}`, { signal: AbortSignal.timeout(10000) });
      const body = r.ok ? await r.json() : null;
      const af = body?.adaptiveFormats?.find(f => f.type?.includes("audio"));
      results[key] = { status: r.status, hasAudio: !!af };
    } catch(e) { results[key] = { error: e.message }; }
  }

  res.json({ videoId, results });
});

app.use("/search", searchRouter);
app.use("/stream", streamRouter);

app.use(errorHandler);

export default app;
