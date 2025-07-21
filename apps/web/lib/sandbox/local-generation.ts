/**
 * Local code generation without sandboxes
 * This is a fallback when Daytona is not available
 */

// Import SDK environment config BEFORE any Claude Code imports to fix bun error
import '../claude-code/sdk-env';
import { query } from "@anthropic-ai/claude-code";
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface LocalGenerationOptions {
  prompt: string;
  userId: string;
  projectName?: string;
  language?: 'km' | 'en';
}

export interface LocalGenerationResult {
  success: boolean;
  projectId: string;
  generatedFiles: Array<{
    path: string;
    content: string;
  }>;
  messages: Array<{
    type: string;
    content: string;
    timestamp: string;
  }>;
  error?: string;
}

/**
 * Generate code locally without sandbox
 */
export async function generateCodeLocally(
  options: LocalGenerationOptions
): Promise<LocalGenerationResult> {
  const { prompt, userId, projectName = 'generated-app', language = 'km' } = options;
  const projectId = crypto.randomUUID();
  
  const messages: any[] = [];
  const generatedFiles: Array<{ path: string; content: string }> = [];
  
  console.log('🎯 Starting local code generation...');
  console.log('📝 User prompt:', prompt);

  try {
    messages.push({
      type: 'status',
      content: language === 'km' 
        ? 'កំពុងបង្កើតកូដសម្រាប់អ្នក...'
        : 'Generating code for you...',
      timestamp: new Date().toISOString()
    });

    // Enhanced prompt for better code generation
    const enhancedPrompt = `
${prompt}

IMPORTANT INSTRUCTIONS:
- Generate a complete, working web application
- Use modern web technologies (HTML5, CSS3, JavaScript/TypeScript)
- If the user wants a React/Next.js app, create proper component structure
- Make the design modern and beautiful
- Add proper error handling
- Include responsive design
- ${language === 'km' ? 'Add Khmer language support where appropriate' : ''}
- Make it production-ready

Generate all necessary files with their full content.
For each file, clearly indicate:
1. The file path (e.g., index.html, src/App.tsx, etc.)
2. The complete file content

Start with a simple structure that can be viewed in a browser.
`;

    // Execute generation with Claude Code
    const abortController = new AbortController();
    let fileCount = 0;
    
    console.log('🔑 Using Claude Code SDK for generation...');
    
    // Add bun to PATH if it exists
    if (!process.env.PATH?.includes('/.bun/bin')) {
      process.env.PATH = `/Users/niko/.bun/bin:${process.env.PATH}`;
    }
    
    for await (const message of query({
      prompt: enhancedPrompt,
      abortController,
      options: {
        maxTurns: 5,
        permissionMode: 'bypassPermissions',
        cwd: process.cwd(),
        runtime: 'node', // Force Node.js instead of bun
      }
    })) {
      // Process messages from Claude
      if (message.type === 'assistant' && 'content' in message) {
        const content = extractReadableContent(message);
        if (content) {
          messages.push({
            type: 'assistant',
            content: formatMessageForUser(content, language),
            timestamp: new Date().toISOString()
          });
        }
        
        // Extract files from message
        const files = extractFilesFromMessage(message);
        for (const file of files) {
          fileCount++;
          const fileContent = extractFileContent(message, file.path);
          
          if (fileContent) {
            generatedFiles.push({
              path: file.path,
              content: fileContent
            });
            
            messages.push({
              type: 'file',
              content: language === 'km'
                ? `បានបង្កើតឯកសារ ${fileCount}: ${file.path}`
                : `Created file ${fileCount}: ${file.path}`,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    }

    console.log(`✅ Generated ${fileCount} files`);

    // Add entry point if not exists
    if (!generatedFiles.find(f => f.path === 'index.html' || f.path === 'src/index.html')) {
      // Create a simple index.html if none exists
      const hasReactFiles = generatedFiles.some(f => f.path.includes('.jsx') || f.path.includes('.tsx'));
      
      if (!hasReactFiles) {
        generatedFiles.push({
          path: 'index.html',
          content: createDefaultIndexHtml(projectName, generatedFiles)
        });
      }
    }

    messages.push({
      type: 'complete',
      content: language === 'km'
        ? `បានបង្កើតកូដដោយជោគជ័យ! មានឯកសារ ${generatedFiles.length} ត្រូវបានបង្កើត។`
        : `Code generated successfully! ${generatedFiles.length} files created.`,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      projectId,
      generatedFiles,
      messages
    };

  } catch (error) {
    console.error('❌ Local generation failed:', error);
    
    return {
      success: false,
      projectId,
      generatedFiles: [],
      messages,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Utility functions
function extractReadableContent(message: any): string {
  if (typeof message.content === 'string') {
    return message.content;
  }
  
  if (Array.isArray(message.content)) {
    return message.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('\n');
  }
  
  return '';
}

function extractFilesFromMessage(message: any): Array<{ path: string }> {
  const files: Array<{ path: string }> = [];
  
  if (message.content && Array.isArray(message.content)) {
    for (const block of message.content) {
      if (block.type === 'tool_use' && 
          (block.name === 'Write' || block.name === 'Edit' || block.name === 'MultiEdit')) {
        if (block.input?.file_path) {
          files.push({ path: block.input.file_path });
        }
      }
    }
  }
  
  return files;
}

function extractFileContent(message: any, filePath: string): string | null {
  if (message.content && Array.isArray(message.content)) {
    for (const block of message.content) {
      if (block.type === 'tool_use' && 
          block.name === 'Write' && 
          block.input?.file_path === filePath) {
        return block.input.content || null;
      }
    }
  }
  return null;
}

function formatMessageForUser(content: string, language: 'km' | 'en'): string {
  // Remove code blocks and technical jargon
  let formatted = content
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`[^`]+`/g, (match) => `**${match.slice(1, -1)}**`)
    .trim();

  if (language === 'km') {
    // Khmer translations
    const translations: Record<string, string> = {
      'Creating': 'កំពុងបង្កើត',
      'Writing': 'កំពុងសរសេរ',
      'Installing': 'កំពុងដំឡើង',
      'file': 'ឯកសារ',
      'component': 'សមាសភាគ',
      'page': 'ទំព័រ',
      'Complete': 'បានបញ្ចប់',
    };

    for (const [eng, khm] of Object.entries(translations)) {
      formatted = formatted.replace(new RegExp(eng, 'gi'), khm);
    }
  }

  return formatted;
}

function createDefaultIndexHtml(projectName: string, files: Array<{ path: string; content: string }>): string {
  // Check if there are CSS or JS files
  const cssFiles = files.filter(f => f.path.endsWith('.css'));
  const jsFiles = files.filter(f => f.path.endsWith('.js'));

  return `<!DOCTYPE html>
<html lang="km">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName}</title>
    ${cssFiles.map(f => `<link rel="stylesheet" href="${f.path}">`).join('\n    ')}
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            margin-bottom: 20px;
        }
        .files-list {
            margin-top: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 5px;
        }
        .file-item {
            padding: 8px 0;
            border-bottom: 1px solid #e0e0e0;
        }
        .file-item:last-child {
            border-bottom: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎉 ${projectName}</h1>
        <p>Your project has been generated successfully!</p>
        
        <div class="files-list">
            <h3>Generated Files:</h3>
            ${files.map(f => `<div class="file-item">📄 ${f.path}</div>`).join('\n            ')}
        </div>
    </div>
    ${jsFiles.map(f => `<script src="${f.path}"></script>`).join('\n    ')}
</body>
</html>`;
}