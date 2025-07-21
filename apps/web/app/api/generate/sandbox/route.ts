import { NextRequest, NextResponse } from "next/server";
import '@/lib/load-env';
// Import SDK environment config BEFORE any Claude Code imports
import '@/lib/claude-code/sdk-env';
import '@/lib/claude-code/fix-spawn';
import { completeGenerationProcess } from "@/lib/sandbox/complete-generation-script";
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
    
    const { prompt, projectName, template } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    console.log('🏗️ API: Starting complete sandbox generation for user:', userId);
    console.log('🔑 API Key status:', process.env.ANTHROPIC_API_KEY ? 'Present' : 'Missing');
    console.log('🔐 API Key length:', process.env.ANTHROPIC_API_KEY?.length || 0);
    console.log('🌍 Environment:', process.env.NODE_ENV);

    // Utiliser le script complet de génération
    const result = await completeGenerationProcess({
      prompt,
      userId: userId.replace(/[^a-z0-9]/gi, '-'), // Sanitize for sandbox naming
      projectName,
      language: 'km' // Khmer par défaut
    });

    console.log('✅ API: Sandbox generation completed:', {
      success: result.success,
      workspaceId: result.workspaceId,
      previewUrl: result.previewUrl,
      filesCount: result.generatedFiles.length
    });

    if (result.success) {
      // Le nettoyage est déjà planifié dans le script complet
      
      return NextResponse.json({
        success: true,
        workspaceId: result.workspaceId,
        previewUrl: result.previewUrl,
        generatedFiles: result.generatedFiles,
        messages: result.messages,
        // Add iframe-friendly URL for embedding
        embedUrl: `${result.previewUrl}?embed=true`,
        expiresIn: 3600 // seconds
      });
    } else {
      return NextResponse.json(
        { 
          success: false,
          error: result.error || "Sandbox generation failed",
          workspaceId: result.workspaceId
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ API: Sandbox generation error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // More detailed error response
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