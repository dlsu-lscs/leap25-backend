import express, { urlencoded, json } from "express";
import "dotenv/config";

const app = express();

app.use(urlencoded({ extended: true }));
app.use(json());

app.listen(process.env.PORT || 3000, function () {
  console.log(`Server running on port: ${process.env.PORT}`);
});
