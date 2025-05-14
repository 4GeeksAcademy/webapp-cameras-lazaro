// src/api/streamer.js

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const WebSocket = require("ws");
const { Pool } = require("pg");
const { spawn } = require("child_process");

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("⚠️  Missing DATABASE_URL environment variable");
  process.exit(1);
}

const pool = new Pool({ connectionString: dbUrl });
const wss = new WebSocket.Server({ port: 9999 });

wss.on("connection", async (ws, req) => {
  const parts = req.url.split("/");
  const cameraId = parseInt(parts.pop(), 10);
  if (!cameraId) {
    ws.close(1008, "ID de cámara inválido");
    return;
  }

  try {
    const res = await pool.query(
      "SELECT username, password, ip_address FROM cameras WHERE id=$1",
      [cameraId]
    );
    if (res.rows.length === 0) {
      ws.close(1008, "Cámara no encontrada");
      return;
    }

    const { username, password, ip_address } = res.rows[0];
    const rtspUrl = `rtsp://${username}:${password}@${ip_address}/axis-media/media.amp`;
    console.log(`▶️ Conectando cámara ${cameraId}: ${rtspUrl}`);

    const ffmpeg = spawn("ffmpeg", [
      "-rtsp_transport",
      "tcp",
      "-i",
      rtspUrl,
      "-f",
      "mpegts",
      "-codec:v",
      "mpeg1video",
      "-r",
      "30",
      "-b:v",
      "1000k",
      "-",
    ]);

    ffmpeg.stdout.on("data", (chunk) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(chunk);
    });

    ffmpeg.stderr.on("data", (data) => {
      console.error(`FFmpeg [${cameraId}]:`, data.toString());
    });

    ffmpeg.on("close", (code) => {
      console.log(`❌ FFmpeg cámara ${cameraId} finalizado con código ${code}`);
      // Esperar un poco para asegurar que el mensaje llegue
      setTimeout(() => {
        if (code !== 0 && ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              error: `FFmpeg exited with code ${code}`,
              cameraId,
            })
          );
          ws.close(1011, "FFmpeg error");
        }
      }, 300); // Esperamos 300ms antes de cerrar el socket
    });

    ws.on("close", () => ffmpeg.kill("SIGKILL"));
  } catch (err) {
    console.error("Error interno streamer:", err);
    ws.close(1011, "Error interno");
  }
});

console.log(
  "WebSocket streamer listening on ws://0.0.0.0:9999/stream/<cameraId>"
);
