import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  console.log("=== DEBUG ENV VARIABLES ===");
  console.log("ANTHROPIC_API_KEY exists:", !!process.env.ANTHROPIC_API_KEY);
  console.log("ANTHROPIC_API_KEY length:", process.env.ANTHROPIC_API_KEY?.length);
  console.log("ANTHROPIC_API_KEY first 10:", process.env.ANTHROPIC_API_KEY?.substring(0, 10));
  console.log("All env keys:", Object.keys(process.env).filter(k => k.includes('ANTHROPIC') || k.includes('CLAUDE')));
  
  return NextResponse.json({
    hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
    keyLength: process.env.ANTHROPIC_API_KEY?.length,
    keyPreview: process.env.ANTHROPIC_API_KEY?.substring(0, 10) + "...",
    nodeEnv: process.env.NODE_ENV,
    allClaudeKeys: Object.keys(process.env).filter(k => k.includes('ANTHROPIC') || k.includes('CLAUDE'))
  });
}