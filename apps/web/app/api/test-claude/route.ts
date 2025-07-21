import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Test environment variables
    const apiKeyStatus = {
      ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
      CLAUDE_API_KEY: !!process.env.CLAUDE_API_KEY,
      NODE_ENV: process.env.NODE_ENV,
      apiKeyFirst10: process.env.ANTHROPIC_API_KEY?.substring(0, 10),
    };

    // Try to import Claude Code SDK
    let sdkStatus = "not tested";
    try {
      const { query } = await import("@anthropic-ai/claude-code");
      sdkStatus = "imported successfully";
    } catch (error) {
      sdkStatus = `import failed: ${error}`;
    }

    return NextResponse.json({
      success: true,
      apiKeyStatus,
      sdkStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}