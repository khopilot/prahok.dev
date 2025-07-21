import { NextRequest, NextResponse } from "next/server";
import '@/lib/load-env';
// Import SDK environment config BEFORE any Claude Code imports
import '@/lib/claude-code/sdk-env';
import { generateCodeLocally } from "@/lib/sandbox/local-generation";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest) {
  try {
    // Get user from JWT token
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token");
    let userId = 'anonymous';
    
    if (token) {
      try {
        const decoded = jwt.verify(token.value, process.env.JWT_SECRET!) as any;
        userId = decoded.userId || 'anonymous';
      } catch (error) {
        console.log('Token verification failed:', error);
      }
    }
    
    const { prompt, projectName } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    console.log('🏗️ API: Starting local code generation for user:', userId);
    
    // Use local generation
    const result = await generateCodeLocally({
      prompt,
      userId,
      projectName,
      language: 'km' // Khmer by default
    });

    console.log('✅ API: Local generation completed:', {
      success: result.success,
      projectId: result.projectId,
      filesCount: result.generatedFiles.length
    });

    if (result.success) {
      // Store project data for preview (in a real app, use a database or file storage)
      const projectData = {
        projectId: result.projectId,
        generatedFiles: result.generatedFiles,
        createdAt: new Date().toISOString()
      };
      
      return NextResponse.json({
        success: true,
        projectId: result.projectId,
        generatedFiles: result.generatedFiles,
        messages: result.messages,
        // For local generation, we'll need a different preview solution
        previewUrl: `/preview/${result.projectId}`,
        embedUrl: `/preview/${result.projectId}?embed=true`,
        // Include project data for client-side storage
        projectData
      });
    } else {
      return NextResponse.json(
        { 
          success: false,
          error: result.error || "Code generation failed",
          projectId: result.projectId
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ API: Local generation error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    const errorDetails = {
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? {
        stack: error instanceof Error ? error.stack : undefined,
        apiKeyStatus: process.env.ANTHROPIC_API_KEY ? 'Present' : 'Missing',
      } : undefined
    };
    
    return NextResponse.json(errorDetails, { status: 500 });
  }
}