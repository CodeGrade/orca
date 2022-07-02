import express, { Express, Request, Response } from 'express';

const app: Express = express();
const PORT = process.env.PORT || 3001;

app.get('/', (req: Request, res: Response) => {
  return res.send('Hello world!');
});

app.listen(PORT, () => {
  console.info(`Server listening on port ${PORT}`);
});
