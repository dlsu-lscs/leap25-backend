import express, { urlencoded, json } from 'express';
import 'dotenv/config';
import userRouter from './routes/user.routes';

const app = express();
const port = process.env.PORT || 3000;

app.use(urlencoded({ extended: true }));
app.use(json());

app.use('/users', userRouter);

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});

export default app;
