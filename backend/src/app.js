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

  // Test 1: Invidious - yewtu.be
  try {
    const r = await fetch(`https://yewtu.be/api/v1/videos/${videoId}`, { signal: AbortSignal.timeout(10000) });
    const body = r.ok ? await r.json() : null;
    const audioFormat = body?.adaptiveFormats?.find(f => f.type?.includes("audio"));
    results.invidious_yewtu = { status: r.status, hasAudio: !!audioFormat, url: audioFormat?.url?.substring(0, 80) };
  } catch(e) { results.invidious_yewtu = { error: e.message }; }

  // Test 2: Invidious - inv.nadeko.net
  try {
    const r = await fetch(`https://inv.nadeko.net/api/v1/videos/${videoId}`, { signal: AbortSignal.timeout(10000) });
    const body = r.ok ? await r.json() : null;
    const audioFormat = body?.adaptiveFormats?.find(f => f.type?.includes("audio"));
    results.invidious_nadeko = { status: r.status, hasAudio: !!audioFormat, url: audioFormat?.url?.substring(0, 80) };
  } catch(e) { results.invidious_nadeko = { error: e.message }; }

  // Test 3: Piped
  try {
    const r = await fetch(`https://pipedapi.kavin.rocks/api/v1/streams/${videoId}`, { signal: AbortSignal.timeout(10000) });
    const body = r.ok ? await r.json() : null;
    results.piped_kavin = { status: r.status, hasAudio: !!(body?.audioStreams?.length) };
  } catch(e) { results.piped_kavin = { error: e.message }; }

  // Test 4: Cobalt
  try {
    const r = await fetch("https://api.cobalt.tools/api/json", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ url: `https://www.youtube.com/watch?v=${videoId}`, downloadMode: "audio", audioFormat: "mp3", isAudioOnly: true }),
      signal: AbortSignal.timeout(10000)
    });
    const body = await r.json();
    results.cobalt = { status: r.status, responseStatus: body.status, hasUrl: !!body.url, body: JSON.stringify(body).substring(0, 200) };
  } catch(e) { results.cobalt = { error: e.message }; }

  res.json({ videoId, results });
});

app.use("/search", searchRouter);
app.use("/stream", streamRouter);

app.use(errorHandler);

export default app;
