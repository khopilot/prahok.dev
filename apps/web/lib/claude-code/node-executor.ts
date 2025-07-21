/**
 * Node.js executor for Claude Code SDK
 * This bypasses the bun requirement by executing through Node.js directly
 */

import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  files?: Array<{ path: string; content: string }>;
  messages?: Array<{ type: string; content: string; timestamp: string }>;
}

/**
 * Execute Claude Code generation through Node.js
 */
export async function executeClaudeCodeWithNode(
  prompt: string,
  options: {
    maxTurns?: number;
    cwd?: string;
  } = {}
): Promise<ExecutionResult> {
  return new Promise((resolve) => {
    try {
      // Create a temporary script that uses Claude Code SDK
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-code-'));
      const scriptPath = path.join(tempDir, 'generate.js');
      
      const scriptContent = `
const { query } = require('@anthropic-ai/claude-code');

async function generate() {
  const prompt = ${JSON.stringify(prompt)};
  const files = [];
  const messages = [];
  const processedMessages = [];
  
  try {
    const abortController = new AbortController();
    
    for await (const message of query({
      prompt,
      abortController,
      options: {
        maxTurns: ${options.maxTurns || 5},
        permissionMode: 'bypassPermissions',
        cwd: '${options.cwd || process.cwd()}'
      }
    })) {
      // Process different message types
      if (message.type === 'assistant' && message.content) {
        // Extract text content
        let textContent = '';
        if (typeof message.content === 'string') {
          textContent = message.content;
        } else if (Array.isArray(message.content)) {
          for (const block of message.content) {
            if (block.type === 'text') {
              textContent += block.text + '\\n';
            } else if (block.type === 'tool_use') {
              processedMessages.push({
                type: 'tool',
                content: \`Using tool: \${block.name}\`,
                timestamp: new Date().toISOString()
              });
              
              if (block.name === 'Write' && block.input) {
                files.push({
                  path: block.input.file_path,
                  content: block.input.content
                });
                processedMessages.push({
                  type: 'file',
                  content: \`Created file: \${block.input.file_path}\`,
                  timestamp: new Date().toISOString()
                });
              }
            }
          }
        }
        
        if (textContent.trim()) {
          processedMessages.push({
            type: 'thinking',
            content: textContent.trim(),
            timestamp: new Date().toISOString()
          });
        }
      } else if (message.type === 'human') {
        processedMessages.push({
          type: 'status',
          content: 'Processing your request...',
          timestamp: new Date().toISOString()
        });
      }
      
      messages.push(message);
    }
    
    console.log(JSON.stringify({ 
      success: true, 
      files, 
      messageCount: messages.length,
      messages: processedMessages 
    }));
  } catch (error) {
    console.error(JSON.stringify({ success: false, error: error.message }));
    process.exit(1);
  }
}

generate();
`;

      fs.writeFileSync(scriptPath, scriptContent);
      
      // Execute the script with Node.js
      const nodeProcess = spawn('node', [scriptPath], {
        env: {
          ...process.env,
          ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
          CLAUDE_CODE_RUNTIME: 'node',
          NODE_ENV: 'production'
        },
        cwd: options.cwd || process.cwd()
      });
      
      let output = '';
      let errorOutput = '';
      
      nodeProcess.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      nodeProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      nodeProcess.on('close', (code) => {
        // Clean up temp files
        try {
          fs.rmSync(tempDir, { recursive: true });
        } catch (e) {
          // Ignore cleanup errors
        }
        
        if (code === 0 && output) {
          try {
            const result = JSON.parse(output);
            resolve({
              success: true,
              files: result.files,
              output: `Generated ${result.files?.length || 0} files`,
              messages: result.messages || []
            });
          } catch (e) {
            resolve({
              success: false,
              error: 'Failed to parse generation result',
              output
            });
          }
        } else {
          resolve({
            success: false,
            error: errorOutput || `Process exited with code ${code}`,
            output
          });
        }
      });
      
      nodeProcess.on('error', (error) => {
        resolve({
          success: false,
          error: `Failed to spawn Node.js process: ${error.message}`
        });
      });
      
    } catch (error) {
      resolve({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

/**
 * Alternative: Direct API call to Claude without SDK
 */
export async function generateWithClaudeAPI(prompt: string): Promise<ExecutionResult> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: `You are an expert web developer. ${prompt}
          
          Generate a complete, working application with all necessary files.
          
          IMPORTANT INSTRUCTIONS:
          1. For React/Next.js projects: Include package.json with all dependencies
          2. Create a proper project structure (src/, components/, pages/, etc.)
          3. Include all necessary configuration files (tsconfig.json, tailwind.config.js, etc.)
          4. Make sure the application can run with 'npm install && npm run dev'
          5. Use modern best practices and clean code
          
          For each file, provide:
          - The file path
          - The complete file content
          
          Format your response as a series of file blocks:
          
          FILE: path/to/file.ext
          \`\`\`
          file content here
          \`\`\`
          
          Make the application modern, beautiful, and production-ready.`
        }],
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    // Parse files from response
    const files: Array<{ path: string; content: string }> = [];
    const fileRegex = /FILE:\s*([^\n]+)\n```[^\n]*\n([\s\S]*?)```/g;
    let match;
    
    while ((match = fileRegex.exec(content)) !== null) {
      files.push({
        path: match[1].trim(),
        content: match[2].trim()
      });
    }
    
    return {
      success: true,
      files,
      output: `Generated ${files.length} files via API`
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}