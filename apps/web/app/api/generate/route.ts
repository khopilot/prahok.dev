import { NextRequest, NextResponse } from "next/server";
import { generateCode } from "@/lib/claude-code/core-generator";

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    console.log('🚀 API: Starting code generation for prompt:', prompt.substring(0, 100) + '...');

    // Use the proven core generation function
    const result = await generateCode({
      prompt,
      maxTurns: 3,
      allowFileOperations: true,
      projectName: `project-${Date.now()}`,
      outputDirectory: process.cwd()
    });

    console.log('✅ API: Generation completed:', {
      success: result.success,
      sessionId: result.sessionId,
      filesCount: result.generatedFiles?.length || 0,
      executionTime: result.executionTime
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        sessionId: result.sessionId,
        generatedFiles: result.generatedFiles || [],
        messagesCount: result.messages.length,
        executionTime: result.executionTime,
        // Include first few messages for debugging
        messages: result.messages.slice(0, 3).map(msg => ({
          type: msg.type,
          timestamp: new Date().toISOString()
        }))
      });
    } else {
      return NextResponse.json(
        { 
          success: false,
          error: result.error || "Code generation failed",
          sessionId: result.sessionId,
          executionTime: result.executionTime
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("❌ API: Generation error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Internal server error" 
      },
      { status: 500 }
    );
  }
}