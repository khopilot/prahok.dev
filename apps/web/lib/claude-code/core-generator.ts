import { query, type SDKMessage } from "@anthropic-ai/claude-code";
import { randomUUID } from 'crypto';
import { join } from 'path';
import { config } from 'dotenv';

// Load environment variables
config({ path: join(__dirname, '../../.env.local') });

export interface GenerationOptions {
  prompt: string;
  maxTurns?: number;
  outputDirectory?: string;
  projectName?: string;
  allowFileOperations?: boolean;
}

export interface GenerationResult {
  success: boolean;
  sessionId: string;
  messages: SDKMessage[];
  generatedFiles?: string[];
  error?: string;
  executionTime: number;
}

/**
 * Core function to generate code using Claude Code SDK
 * This is the heart of our application - takes a prompt and generates code
 */
export async function generateCode(options: GenerationOptions): Promise<GenerationResult> {
  const startTime = Date.now();
  const sessionId = randomUUID();
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🚀 Starting code generation:', {
      sessionId,
      prompt: options.prompt.substring(0, 100) + '...',
      maxTurns: options.maxTurns || 3,
      outputDirectory: options.outputDirectory || '/tmp'
    });
  }

  try {
    // Verify API key is available
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set in environment variables');
    }

    const messages: SDKMessage[] = [];
    const abortController = new AbortController();
    
    // Set timeout for generation (5 minutes max)
    const timeout = setTimeout(() => {
      abortController.abort();
    }, 5 * 60 * 1000);

    // Enhanced prompt with explicit permissions and project context
    const enhancedPrompt = `
${options.prompt}

CRITICAL INSTRUCTIONS FOR FILE OPERATIONS:
- You MUST create and write files as requested
- You have FULL READ AND WRITE PERMISSIONS 
- Use the Write tool to create all files
- DO NOT just show code - ACTUALLY CREATE THE FILES
- Save files in the current working directory
- Use modern, clean code practices
- Include proper error handling
- Add comments for clarity
- If creating a web project, make it self-contained (HTML/CSS/JS)

PERMISSION GRANT:
I hereby grant you explicit permission to:
1. Create new files in the current directory
2. Write content to files using the Write tool
3. Modify existing files if needed
4. Create subdirectories if required

Project Context:
- Session ID: ${sessionId}
- Project Name: ${options.projectName || 'generated-project'}
- Working Directory: ${options.outputDirectory || process.cwd()}
- File Operations Enabled: ${options.allowFileOperations !== false}

IMPORTANT: After writing any files, confirm their creation and provide the file paths.
`;

    try {
      for await (const message of query({
        prompt: enhancedPrompt,
        abortController,
        options: {
          maxTurns: options.maxTurns || 3,
          cwd: options.outputDirectory || process.cwd(),
          // CRITICAL: Use bypassPermissions mode to allow file operations
          permissionMode: 'bypassPermissions',
          // Enable file system operations explicitly
          allowedTools: [
            'Write',
            'Read', 
            'Edit',
            'MultiEdit',
            'mcp__filesystem__read_file',
            'mcp__filesystem__write_file',
            'mcp__filesystem__list_directory'
          ],
          // Allow all tools by default for development
          disallowedTools: [],
        },
      })) {
        messages.push(message);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('📨 Claude Code message:', {
            type: message.type,
            timestamp: new Date().toISOString()
          });
        }
      }
    } finally {
      clearTimeout(timeout);
    }

    // Extract generated files from messages
    const generatedFiles = extractGeneratedFiles(messages);
    
    const executionTime = Date.now() - startTime;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Code generation completed:', {
        sessionId,
        messagesCount: messages.length,
        generatedFiles,
        executionTime: `${executionTime}ms`
      });
    }

    return {
      success: true,
      sessionId,
      messages,
      generatedFiles,
      executionTime
    };

  } catch (error) {
    const executionTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Code generation failed:', {
        sessionId,
        error: errorMessage,
        executionTime: `${executionTime}ms`
      });
    }

    return {
      success: false,
      sessionId,
      messages: [],
      error: errorMessage,
      executionTime
    };
  }
}

/**
 * Extract list of generated files from Claude Code messages
 */
function extractGeneratedFiles(messages: SDKMessage[]): string[] {
  const files: string[] = [];
  
  for (const message of messages) {
    // Look for file creation patterns in message content
    if (message.type === 'assistant' || message.type === 'result') {
      // Parse tool usage for file operations
      try {
        const content = JSON.stringify(message);
        
        // Look for common file patterns
        const filePatterns = [
          /(?:created?|wrote?|generated?)\s+(?:file\s+)?([^\s]+\.(js|ts|jsx|tsx|html|css|json|md|py|java|cpp|c|go|rs|php|rb|swift|kt))/gi,
          /(?:file_path|fileName|path)["':\s]+([^\s"']+\.(js|ts|jsx|tsx|html|css|json|md|py|java|cpp|c|go|rs|php|rb|swift|kt))/gi
        ];
        
        for (const pattern of filePatterns) {
          let match;
          while ((match = pattern.exec(content)) !== null) {
            const filePath = match[1];
            if (filePath && !files.includes(filePath)) {
              files.push(filePath);
            }
          }
        }
      } catch {
        // Ignore parsing errors
      }
    }
  }
  
  return files;
}

/**
 * Simple wrapper function for quick testing
 */
export async function generateSimpleProject(prompt: string): Promise<GenerationResult> {
  return generateCode({
    prompt,
    maxTurns: 3,
    allowFileOperations: true,
    projectName: 'test-project'
  });
}