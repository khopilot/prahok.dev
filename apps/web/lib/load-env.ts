import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
// This is necessary for API routes which don't automatically load .env.local
export function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  const result = config({ path: envPath });
  
  if (result.error) {
    console.error('Failed to load .env.local:', result.error);
  } else {
    console.log('Successfully loaded .env.local');
    console.log('ANTHROPIC_API_KEY loaded:', !!process.env.ANTHROPIC_API_KEY);
  }
  
  return result;
}

// Ensure environment variables are loaded when this module is imported
loadEnv();