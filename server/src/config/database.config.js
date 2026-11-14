import { registerAs } from '@nestjs/config';

// Explicit environment configuration only; never embed database credentials.
export default registerAs('database', () => ({
  url: process.env.DATABASE_URL,
}));
