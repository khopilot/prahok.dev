import { NextRequest, NextResponse } from "next/server";
import '@/lib/load-env';
// Import SDK environment config BEFORE any Claude Code imports
import '@/lib/claude-code/sdk-env';
import { query } from "@anthropic-ai/claude-code";

export async function POST(request: NextRequest) {
  console.log("=== TEST GENERATE API ===");
  console.log("ENV check:", {
    hasKey: !!process.env.ANTHROPIC_API_KEY,
    keyLength: process.env.ANTHROPIC_API_KEY?.length,
    keyStart: process.env.ANTHROPIC_API_KEY?.substring(0, 10)
  });

  try {
    const { prompt } = await request.json();
    
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        error: "ANTHROPIC_API_KEY not found in environment variables",
        debug: {
          nodeEnv: process.env.NODE_ENV,
          hasKey: false
        }
      }, { status: 500 });
    }

    // Test simple query
    const abortController = new AbortController();
    const messages = [];
    
    for await (const message of query({
      prompt: prompt || "Create a hello world HTML file",
      abortController,
      options: {
        maxTurns: 1,
        permissionMode: 'bypassPermissions',
        cwd: '/tmp',
        runtime: 'node', // Force Node.js instead of bun
      }
    })) {
      messages.push({
        type: message.type,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      messageCount: messages.length,
      messages
    });

  } catch (error) {
    console.error("Error in test-generate:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}