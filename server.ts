import express from "express";

const app = express();
const port = process.env.PORT || 4000;

app.get("/", (req, res) => {
  res.send("A rumbling amongst the waves...");
})

app.listen(port, () => {
  console.log(`Listening on port ${port}.`)
})