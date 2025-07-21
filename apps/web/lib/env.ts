// Environment variable validation and loading
export function validateEnvironment() {
  const required = ['ANTHROPIC_API_KEY'];
  const missing = [];

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY!,
    NODE_ENV: process.env.NODE_ENV || 'development',
  };
}