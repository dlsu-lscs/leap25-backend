import express, { urlencoded, json } from 'express';
import 'dotenv/config';
import authRouter from './routes/auth.routes';

const app = express();
const port = process.env.PORT || 3000;

app.use(urlencoded({ extended: true }));
app.use(json());

// General endpoints
app.use('/oauth2', authRouter);

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});

export default app;
