/**
 * Core generator using Node.js wrapper for Claude Code SDK
 */

import { executeClaudeCode } from './node-wrapper';
import type { SDKMessage } from "@anthropic-ai/claude-code";

export interface GenerationOptions {
  prompt: string;
  language?: 'km' | 'en';
  projectType?: 'nextjs' | 'react' | 'html' | 'api';
  features?: string[];
  maxTurns?: number;
  onMessage?: (message: any) => void;
  abortController?: AbortController;
}

export interface GenerationResult {
  success: boolean;
  messages: any[];
  files: Array<{
    path: string;
    content: string;
  }>;
  error?: string;
}

export async function generateCode(options: GenerationOptions): Promise<GenerationResult> {
  const { 
    prompt, 
    language = 'en', 
    projectType = 'nextjs',
    features = [],
    maxTurns = 5,
    onMessage,
    abortController
  } = options;

  const messages: any[] = [];
  const files: Array<{ path: string; content: string }> = [];

  try {
    // Build enhanced prompt
    const enhancedPrompt = buildEnhancedPrompt(prompt, language, projectType, features);

    // Use our Node.js wrapper
    const nodeMessages = await executeClaudeCode({
      prompt: enhancedPrompt,
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      maxTurns,
      cwd: '/tmp'
    });
    
    for (const message of nodeMessages) {
      messages.push(message);
      
      // Call callback if provided
      if (onMessage) {
        onMessage(message);
      }

      // Extract files from tool use
      if (message.type === 'assistant' && (message as any).content) {
        const extractedFiles = extractFilesFromMessage(message);
        files.push(...extractedFiles);
      }
    }

    return {
      success: true,
      messages,
      files
    };
  } catch (error) {
    console.error('Generation error:', error);
    return {
      success: false,
      messages,
      files,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Alternative: Use the query function directly with runtime patch
 */
export async function generateCodeDirect(options: GenerationOptions): Promise<GenerationResult> {
  // Import query after patching
  const { query } = await import('@anthropic-ai/claude-code');
  
  const { 
    prompt, 
    language = 'en', 
    projectType = 'nextjs',
    features = [],
    maxTurns = 5,
    onMessage,
    abortController = new AbortController()
  } = options;

  const messages: any[] = [];
  const files: Array<{ path: string; content: string }> = [];

  try {
    const enhancedPrompt = buildEnhancedPrompt(prompt, language, projectType, features);

    for await (const message of query({
      prompt: enhancedPrompt,
      abortController,
      options: {
        maxTurns,
        permissionMode: 'bypassPermissions',
        model: process.env.CLAUDE_CODE_MODEL
      }
    })) {
      messages.push(message);
      
      if (onMessage) {
        onMessage(message);
      }

      if (message.type === 'assistant' && (message as any).content) {
        const extractedFiles = extractFilesFromMessage(message);
        files.push(...extractedFiles);
      }
    }

    return {
      success: true,
      messages,
      files
    };
  } catch (error) {
    console.error('Generation error:', error);
    return {
      success: false,
      messages,
      files,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

function buildEnhancedPrompt(
  prompt: string, 
  language: 'km' | 'en',
  projectType: string,
  features: string[]
): string {
  let enhanced = '';

  // Add language context
  if (language === 'km') {
    enhanced += 'Please provide responses and comments in Khmer where appropriate. ';
  }

  // Add project type context
  switch (projectType) {
    case 'nextjs':
      enhanced += 'Create a Next.js application with TypeScript, Tailwind CSS, and App Router. ';
      break;
    case 'react':
      enhanced += 'Create a React application with Vite, TypeScript, and Tailwind CSS. ';
      break;
    case 'html':
      enhanced += 'Create a simple HTML/CSS/JavaScript application. ';
      break;
    case 'api':
      enhanced += 'Create a REST API with Express.js and TypeScript. ';
      break;
  }

  // Add features
  if (features.length > 0) {
    enhanced += `Include these features: ${features.join(', ')}. `;
  }

  // Add base instructions
  enhanced += `
IMPORTANT INSTRUCTIONS:
- Generate production-ready code
- Include proper error handling
- Add responsive design
- Make it modern and beautiful
- Include all necessary files

${prompt}`;

  return enhanced;
}

function extractFilesFromMessage(message: any): Array<{ path: string; content: string }> {
  const files: Array<{ path: string; content: string }> = [];

  if (Array.isArray(message.content)) {
    for (const block of message.content) {
      if (block.type === 'tool_use' && block.name === 'Write' && block.input) {
        if (block.input.file_path && block.input.content) {
          files.push({
            path: block.input.file_path,
            content: block.input.content
          });
        }
      }
    }
  }

  return files;
}