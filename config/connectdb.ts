import type { PoolOptions } from 'mysql2';
import mysql from 'mysql2';

const access: PoolOptions = {
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined,
};

export const pool = mysql.createPool(access);
