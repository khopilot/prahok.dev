import { NextRequest, NextResponse } from "next/server";
import { completeGenerationProcess } from "@/lib/sandbox/complete-generation-script";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest) {
  try {
    // Get user from JWT token
    const cookieStore = cookies();
    const token = cookieStore.get("token");
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
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Internal server error" 
      },
      { status: 500 }
    );
  }
}