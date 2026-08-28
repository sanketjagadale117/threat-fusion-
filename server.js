import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import { connectDB } from "../database/db.js";
import { startScheduler } from "./services/scheduler.js";
import { initRealtime } from "./services/realtime.js";

import threatsRouter from "./routes/threats.js";
import indicatorsRouter from "./routes/indicators.js";
import mitreRouter from "./routes/mitre.js";
import actorsRouter from "./routes/actors.js";
import alertsRouter from "./routes/alerts.js";
import ingestRouter from "./routes/ingest.js";
import taxiiRouter from "./routes/taxii.js";
import metricsRouter from "./routes/metrics.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("CTI Aggregation Platform API is running. Try /api/threats, /api/metrics, or /taxii2/");
});

app.use("/api/threats", threatsRouter);
app.use("/api/indicators", indicatorsRouter);
app.use("/api/mitre", mitreRouter);
app.use("/api/actors", actorsRouter);
app.use("/api/alerts", alertsRouter);
app.use("/api/ingest", ingestRouter);
app.use("/api/metrics", metricsRouter);
app.use("/taxii2", taxiiRouter);

const PORT = process.env.PORT || 5000;

// Socket.io needs the raw http server (not just the Express app) to attach to,
// since it upgrades HTTP connections to WebSockets on the same port.
const httpServer = http.createServer(app);

connectDB()
  .then(() => {
    initRealtime(httpServer);

    httpServer.listen(PORT, () => {
      console.log(`CTI backend running at http://localhost:${PORT}`);
      console.log(`Realtime (Socket.io) attached on the same port — no separate port needed`);
      console.log(`TAXII-shaped endpoints at http://localhost:${PORT}/taxii2/`);
      console.log(`Performance metrics at http://localhost:${PORT}/api/metrics/summary`);
    });
    startScheduler();
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    console.error("Check that MongoDB is running and database/.env MONGO_URI is correct.");
    process.exit(1);
  });
