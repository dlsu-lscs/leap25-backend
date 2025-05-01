import mysql from 'mysql2/promise';
import 'dotenv/config';

const db = mysql.createPool({
  host: process.env.DB_HOST!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASS!,
  database: process.env.DB_DATABASE!,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined,
});

export default db;
