import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
const result = dotenv.config({ path: resolve(__dirname, '../../.env') });

if (result.error) {
  console.error('❌ Error loading .env file:', result.error);
  throw result.error;
}

// Verify critical environment variables
const requiredEnvVars = [
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'MONGODB_URI'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('💡 Please check your .env file');
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

console.log('✅ Environment variables loaded successfully');

export default process.env;
