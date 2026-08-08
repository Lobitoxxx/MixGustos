import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || 'mixgustos_dev_secret',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  dbUrl: process.env.DATABASE_URL,
};
