import { ConnectionOptions } from 'typeorm';
/* eslint-disable @typescript-eslint/no-var-requires */
const dotenv = require('dotenv');
const path = require('path');

const srcPath = path.resolve(__dirname, '..');

dotenv.config();

const config: ConnectionOptions = {
  type: process.env.DATABASE_CLIENT as any,
  host: process.env.DATABASE_HOST,
  port: +process.env.DATABASE_PORT,
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [srcPath + '/**/*.entity{.ts,.js}'],
  migrations: [srcPath + '/database/migrations/**/*{.ts,.js}'],
  cli: {
    migrationsDir: 'src/database/migrations',
  },
};

export default config;
