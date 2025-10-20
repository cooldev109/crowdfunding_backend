import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
  MONGO_URI: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  CLIENT_URL: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_PUBLISHABLE_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  PAGSEGURO_TOKEN?: string;
  PAGSEGURO_EMAIL?: string;
  EMAIL_HOST: string;
  EMAIL_PORT: number;
  EMAIL_USER: string;
  EMAIL_PASS: string;
  EMAIL_FROM: string;
  CLOUDINARY_CLOUD_NAME?: string;
  CLOUDINARY_API_KEY?: string;
  CLOUDINARY_API_SECRET?: string;
  MAX_FILE_SIZE: number;
  ALLOWED_FILE_TYPES: string;
}

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
};

export const ENV: EnvConfig = {
  PORT: getEnvNumber('PORT', 4000),
  NODE_ENV: getEnvVar('NODE_ENV', 'development'),
  MONGO_URI: getEnvVar('MONGO_URI'),
  JWT_SECRET: getEnvVar('JWT_SECRET'),
  JWT_EXPIRES_IN: getEnvVar('JWT_EXPIRES_IN', '7d'),
  CLIENT_URL: getEnvVar('CLIENT_URL'),
  STRIPE_SECRET_KEY: getEnvVar('STRIPE_SECRET_KEY'),
  STRIPE_PUBLISHABLE_KEY: getEnvVar('STRIPE_PUBLISHABLE_KEY'),
  STRIPE_WEBHOOK_SECRET: getEnvVar('STRIPE_WEBHOOK_SECRET'),
  PAGSEGURO_TOKEN: process.env.PAGSEGURO_TOKEN,
  PAGSEGURO_EMAIL: process.env.PAGSEGURO_EMAIL,
  EMAIL_HOST: getEnvVar('EMAIL_HOST'),
  EMAIL_PORT: getEnvNumber('EMAIL_PORT', 587),
  EMAIL_USER: getEnvVar('EMAIL_USER'),
  EMAIL_PASS: getEnvVar('EMAIL_PASS'),
  EMAIL_FROM: getEnvVar('EMAIL_FROM'),
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  MAX_FILE_SIZE: getEnvNumber('MAX_FILE_SIZE', 5242880),
  ALLOWED_FILE_TYPES: getEnvVar('ALLOWED_FILE_TYPES', '.xlsx,.csv'),
};
