import { Dialect } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

interface DatabaseConfig {
  dialect: Dialect;
  dialectOptions: {
    charset: string;
    collate: string;
  };
  host: string;
  username: string;
  password: string;
  database: string;
  port: number;
  timezone: string;
  logging: boolean;
}

const config: DatabaseConfig = {
  dialect: (process.env.DB_DIALECT as Dialect) || 'postgres',
  dialectOptions: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_bin'
  },
  host: process.env.POSTGRES_HOST || 'localhost',
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'zpro',
  port: Number(process.env.DB_PORT) || 5432,
  timezone: '+00:00',
  logging: false
};

export default config; 