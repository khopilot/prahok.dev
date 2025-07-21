import { NextRequest, NextResponse } from "next/server";
import { generateWithClaude } from "@/lib/claude-direct";
import '@/lib/load-env';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    console.log("Testing direct Claude API...");
    console.log("API Key exists:", !!process.env.ANTHROPIC_API_KEY);
    
    const result = await generateWithClaude(prompt || "Create a simple hello world HTML page");
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      hasApiKey: !!process.env.ANTHROPIC_API_KEY,
    }, { status: 500 });
  }
}