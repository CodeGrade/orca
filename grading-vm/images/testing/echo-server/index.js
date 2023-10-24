import express, { json } from "express";

const PORT = 9001;

const app = express();
app.use(json({ limit: "1mb" }));

const responses = {};

app.get("/", (_, res) => {
  res.send("Hello world!");
});

app.get("/job-output", (req, res) => res.json(Object.keys(responses)));

app.get("/job-output/:key", (req, res) => {
  const { key } = req.params;
  if (responses[key]) {
    return res.json(responses[key]);
  }
  return res.sendStatus(404);
});

app.post("/job-output", (req, res) => {
  const { key, output } = req.body;
  if (key && output) {
    responses[key] = output;
    return res.sendStatus(200);
  }
  responses[key] = result;
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}.`);
});
