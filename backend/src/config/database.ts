import { Dialect } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

interface DatabaseConfig {
  dialect: Dialect;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  define: {
    charset: string;
    collate: string;
    timestamps: boolean;
  };
  timezone: string;
  logging: boolean;
}

const config: DatabaseConfig = {
  dialect: (process.env.DB_DIALECT as Dialect) || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.POSTGRES_DB || 'postgres',
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  define: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_bin',
    timestamps: true,
  },
  timezone: 'UTC',
  logging: false
};

export default config; 