import express, { Express } from "express";
import cors from "cors";
import { createClient, RedisClientType } from "redis";
import gradingQueueRouter from "./routes/grading-queue";

const app: Express = express();
const PORT = process.env.PORT || 4000;

// Default Redis port is 6379
export const client: RedisClientType = createClient();

app.use(cors());
app.use(express.json());

client.on("error", (err) => console.log("Redis Client Error", err));

// awaited in example
client.connect();

app.use("/api/v1", gradingQueueRouter);

app.listen(PORT, () => {
  console.info(`Server listening on port ${PORT}`);
});
