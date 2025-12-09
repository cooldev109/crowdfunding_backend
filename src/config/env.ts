import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
  MONGO_URI: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  CLIENT_URL: string;
  PAGSEGURO_TOKEN?: string;
  PAGSEGURO_EMAIL?: string;
  EMAIL_HOST?: string;
  EMAIL_PORT: number;
  EMAIL_USER?: string;
  EMAIL_PASS?: string;
  EMAIL_FROM?: string;
  CLOUDINARY_CLOUD_NAME?: string;
  CLOUDINARY_API_KEY?: string;
  CLOUDINARY_API_SECRET?: string;
  MAX_FILE_SIZE: number;
  ALLOWED_FILE_TYPES: string;
  // Wompi (Colombian Payment Gateway)
  WOMPI_PUBLIC_KEY?: string;
  WOMPI_PRIVATE_KEY?: string;
  WOMPI_EVENTS_SECRET?: string;
  WOMPI_INTEGRITY_SECRET?: string;
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
  PAGSEGURO_TOKEN: process.env.PAGSEGURO_TOKEN,
  PAGSEGURO_EMAIL: process.env.PAGSEGURO_EMAIL,
  EMAIL_HOST: process.env.EMAIL_HOST || process.env.SMTP_HOST,
  EMAIL_PORT: getEnvNumber('EMAIL_PORT', 587),
  EMAIL_USER: process.env.EMAIL_USER || process.env.SMTP_USER,
  EMAIL_PASS: process.env.EMAIL_PASS || process.env.SMTP_PASSWORD,
  EMAIL_FROM: process.env.EMAIL_FROM || process.env.EMAIL_FROM_ADDRESS,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  MAX_FILE_SIZE: getEnvNumber('MAX_FILE_SIZE', 5242880),
  ALLOWED_FILE_TYPES: getEnvVar('ALLOWED_FILE_TYPES', '.xlsx,.csv'),
  // Wompi (Colombian Payment Gateway)
  WOMPI_PUBLIC_KEY: process.env.WOMPI_PUBLIC_KEY,
  WOMPI_PRIVATE_KEY: process.env.WOMPI_PRIVATE_KEY,
  WOMPI_EVENTS_SECRET: process.env.WOMPI_EVENTS_SECRET,
  WOMPI_INTEGRITY_SECRET: process.env.WOMPI_INTEGRITY_SECRET,
};
