import { NextRequest, NextResponse } from "next/server";
import '@/lib/load-env';
import { safeGenerateCode } from "@/lib/sandbox/safe-generation";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest) {
  try {
    // Get user from JWT token
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token");
    let userId = 'anonymous';
    
    if (token && process.env.JWT_SECRET) {
      try {
        const decoded = jwt.verify(token.value, process.env.JWT_SECRET) as any;
        userId = decoded.userId || 'anonymous';
      } catch (error) {
        console.log('Token verification skipped:', error);
      }
    }
    
    const { prompt, projectName, useSandbox = true } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    console.log('🏗️ API: Starting safe code generation for user:', userId);
    console.log('📝 Prompt:', prompt.substring(0, 100) + '...');
    console.log('🔧 Use sandbox:', useSandbox);
    
    // Use safe generation with multiple fallbacks
    const result = await safeGenerateCode({
      prompt,
      userId,
      projectName,
      language: 'km',
      useSandbox
    });

    console.log('✅ API: Safe generation completed:', {
      success: result.success,
      method: result.method,
      projectId: result.projectId,
      filesCount: result.generatedFiles.length
    });

    if (result.success) {
      // Store project data for preview
      const projectData = {
        projectId: result.projectId,
        generatedFiles: result.generatedFiles,
        createdAt: new Date().toISOString(),
        method: result.method
      };
      
      return NextResponse.json({
        success: true,
        method: result.method,
        projectId: result.projectId,
        workspaceId: result.workspaceId,
        previewUrl: result.previewUrl || `/preview/${result.projectId}`,
        embedUrl: result.previewUrl ? `${result.previewUrl}?embed=true` : `/preview/${result.projectId}?embed=true`,
        generatedFiles: result.generatedFiles,
        messages: result.messages,
        projectData // Include for client-side storage
      });
    } else {
      return NextResponse.json(
        { 
          success: false,
          error: result.error || "Code generation failed",
          messages: result.messages,
          method: result.method
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ API: Safe generation error:', error);
    
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? {
        stack: error instanceof Error ? error.stack : undefined,
        apiKeyStatus: process.env.ANTHROPIC_API_KEY ? 'Present' : 'Missing',
      } : undefined
    }, { status: 500 });
  }
}