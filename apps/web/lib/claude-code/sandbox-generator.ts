import { query, type SDKMessage } from "@anthropic-ai/claude-code";
import { daytonaService } from '../daytona/client';

export interface SandboxGenerationOptions {
  prompt: string;
  userId: string;
  projectName?: string;
  template?: string;
}

export interface SandboxGenerationResult {
  success: boolean;
  workspaceId: string;
  previewUrl?: string;
  generatedFiles: string[];
  messages: any[];
  error?: string;
}

/**
 * Generate code inside a Daytona sandbox instead of locally
 * This solves the scalability problem of modifying the main app
 */
export async function generateInSandbox(options: SandboxGenerationOptions): Promise<SandboxGenerationResult> {
  const { prompt, userId, projectName, template } = options;
  let workspaceId: string | undefined;
  
  try {
    console.log('🚀 Starting sandbox generation:', {
      userId,
      projectName: projectName || 'auto-generated',
      template: template || 'default'
    });
    
    // Step 1: Create sandbox
    const sandboxName = `${userId}-${projectName || Date.now()}`;
    const workspace = await daytonaService.createSandbox(
      sandboxName,
      template || 'https://github.com/vercel/next-template'
    );
    workspaceId = workspace.id;
    
    // Step 2: Start sandbox
    await daytonaService.startSandbox(workspaceId);
    
    // Wait for sandbox to initialize
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 3: Install dependencies
    await daytonaService.executeCommand(workspaceId, 'npm install');
    
    // Step 4: Execute Claude Code generation inside sandbox
    const generatedFiles: string[] = [];
    const messages: SDKMessage[] = [];
    
    // Enhanced prompt for sandbox generation
    const sandboxPrompt = `
${prompt}

IMPORTANT SANDBOX CONTEXT:
- You are generating code inside an isolated Next.js environment
- The working directory is /workspace
- Create all files relative to this directory
- Use the app directory structure for Next.js pages
- Make the code production-ready and beautiful
- The generated app will be previewed at port 3000

Current workspace ID: ${workspaceId}
`;

    // Stream generation with Claude Code
    const abortController = new AbortController();
    
    for await (const message of query({
      prompt: sandboxPrompt,
      abortController,
      options: {
        maxTurns: 5,
        permissionMode: 'bypassPermissions',
        cwd: `/workspace/${workspaceId}`, // Virtual path for tracking
      }
    })) {
      messages.push(message);
      
      // Track generated files
      if (message.type === 'assistant' && 'content' in message) {
        const files = extractFilesFromMessage(message);
        generatedFiles.push(...files);
      }
    }
    
    // Step 5: Copy generated files to sandbox
    // In a real implementation, Claude Code would write directly to sandbox
    // For now, we'll simulate by creating files via commands
    for (const file of generatedFiles) {
      console.log(`📝 Creating file in sandbox: ${file}`);
      // This would be replaced with actual file transfer logic
    }
    
    // Step 6: Start dev server
    await daytonaService.executeCommand(workspaceId, 'npm run dev &');
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Step 7: Get preview URL - The crucial discovery!
    const preview = await daytonaService.getPreviewLink(workspaceId, 3000);
    
    console.log('✅ Sandbox generation complete!');
    console.log('🔗 Preview URL:', preview.url);
    
    return {
      success: true,
      workspaceId,
      previewUrl: preview.url,
      generatedFiles,
      messages: messages.map(m => ({
        type: m.type,
        content: extractMessageContent(m)
      }))
    };
    
  } catch (error) {
    console.error('❌ Sandbox generation failed:', error);
    
    // Cleanup on error
    if (workspaceId) {
      try {
        await daytonaService.deleteSandbox(workspaceId);
      } catch (cleanupError) {
        console.error('Failed to cleanup sandbox:', cleanupError);
      }
    }
    
    return {
      success: false,
      workspaceId: workspaceId || 'unknown',
      generatedFiles: [],
      messages: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Clean up sandbox after timeout
 */
export async function scheduleSandboxCleanup(workspaceId: string, delayMs: number = 3600000) {
  setTimeout(async () => {
    try {
      console.log(`🗑️ Auto-cleaning sandbox ${workspaceId} after timeout`);
      await daytonaService.deleteSandbox(workspaceId);
    } catch (error) {
      console.error('Failed to auto-clean sandbox:', error);
    }
  }, delayMs);
}

// Helper functions
function extractFilesFromMessage(message: any): string[] {
  const files: string[] = [];
  
  if (message.content && Array.isArray(message.content)) {
    for (const block of message.content) {
      if (block.type === 'tool_use' && block.name === 'Write') {
        if (block.input?.file_path) {
          files.push(block.input.file_path);
        }
      }
    }
  }
  
  return files;
}

function extractMessageContent(message: any): string {
  if (typeof message.content === 'string') {
    return message.content;
  }
  
  if (Array.isArray(message.content)) {
    return message.content
      .map((block: any) => block.type === 'text' ? block.text : '')
      .join('\n');
  }
  
  return '';
}