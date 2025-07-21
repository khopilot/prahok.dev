import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // List all env vars that start with ANTHROPIC or CLAUDE
  const relevantEnvVars: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(process.env)) {
    if (key.includes('ANTHROPIC') || key.includes('CLAUDE') || key === 'NODE_ENV') {
      relevantEnvVars[key] = value ? `${value.substring(0, 20)}...` : 'undefined';
    }
  }

  return NextResponse.json({
    envVars: relevantEnvVars,
    hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
    nodeEnv: process.env.NODE_ENV,
  });
}