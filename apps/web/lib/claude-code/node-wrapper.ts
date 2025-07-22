/**
 * Node.js wrapper for Claude Code SDK to avoid bun spawn issues in Next.js
 * This creates a child process that runs the Claude Code SDK in a clean Node.js environment
 */

import { spawn } from 'child_process';
import path from 'path';
import { promises as fs } from 'fs';
import os from 'os';

export interface ClaudeCodeOptions {
  prompt: string;
  apiKey: string;
  maxTurns?: number;
  cwd?: string;
}

export interface ClaudeCodeMessage {
  type: string;
  content?: any;
  error?: string;
}

/**
 * Execute Claude Code query in a separate Node.js process
 * This avoids the bun spawn issue in Next.js environment
 */
export async function executeClaudeCode(options: ClaudeCodeOptions): Promise<ClaudeCodeMessage[]> {
  const { prompt, apiKey, maxTurns = 7, cwd = process.cwd() } = options;
  
  // Create a temporary file for the Node.js script
  const tmpDir = os.tmpdir();
  const scriptPath = path.join(tmpDir, `claude-code-${Date.now()}.js`);
  
  // Create the script content
  const scriptContent = `
// Auto-generated Claude Code execution script
process.env.ANTHROPIC_API_KEY = '${apiKey}';
process.env.CLAUDE_CODE_RUNTIME = 'node';

const { query } = require('@anthropic-ai/claude-code');

async function run() {
  const messages = [];
  
  try {
    for await (const message of query({
      prompt: ${JSON.stringify(prompt)},
      options: {
        maxTurns: ${maxTurns},
        permissionMode: 'bypassPermissions',
        cwd: ${JSON.stringify(cwd)},
        runtime: 'node',
      }
    })) {
      // Send each message to parent process
      process.send({ type: 'message', data: message });
      messages.push(message);
    }
    
    process.send({ type: 'complete', data: messages });
    process.exit(0);
  } catch (error) {
    process.send({ type: 'error', error: error.message, stack: error.stack });
    process.exit(1);
  }
}

run();
  `;
  
  // Write the script to a temporary file
  await fs.writeFile(scriptPath, scriptContent, 'utf8');
  
  return new Promise((resolve, reject) => {
    const messages: ClaudeCodeMessage[] = [];
    
    // Spawn a Node.js process to run the script
    const nodeProcess = spawn('node', [scriptPath], {
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      env: {
        ...process.env,
        PATH: `/opt/homebrew/opt/node@20/bin:/usr/local/bin:/usr/bin:/bin:${process.env.PATH}`,
        ANTHROPIC_API_KEY: apiKey,
        CLAUDE_CODE_RUNTIME: 'node',
      }
    });
    
    // Handle messages from child process
    nodeProcess.on('message', (message: any) => {
      if (message.type === 'message') {
        messages.push(message.data);
      } else if (message.type === 'complete') {
        // Clean up and resolve
        fs.unlink(scriptPath).catch(() => {});
        resolve(messages);
      } else if (message.type === 'error') {
        fs.unlink(scriptPath).catch(() => {});
        reject(new Error(message.error));
      }
    });
    
    // Handle process errors
    nodeProcess.on('error', (error) => {
      fs.unlink(scriptPath).catch(() => {});
      reject(error);
    });
    
    // Handle stderr
    if (nodeProcess.stderr) {
      nodeProcess.stderr.on('data', (data) => {
        console.error('Claude Code stderr:', data.toString());
      });
    }
    
    // Handle process exit
    nodeProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        fs.unlink(scriptPath).catch(() => {});
        reject(new Error(`Claude Code process exited with code ${code}`));
      }
    });
  });
}

/**
 * Alternative: Execute Claude Code using a pre-written script
 */
export async function executeClaudeCodeWithScript(options: ClaudeCodeOptions): Promise<ClaudeCodeMessage[]> {
  const scriptPath = path.join(__dirname, 'claude-executor.js');
  
  return new Promise((resolve, reject) => {
    const messages: ClaudeCodeMessage[] = [];
    
    const nodeProcess = spawn('node', [scriptPath], {
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      env: {
        ...process.env,
        ANTHROPIC_API_KEY: options.apiKey,
        CLAUDE_CODE_RUNTIME: 'node',
        CLAUDE_PROMPT: options.prompt,
        CLAUDE_MAX_TURNS: String(options.maxTurns || 7),
        CLAUDE_CWD: options.cwd || process.cwd(),
      }
    });
    
    nodeProcess.on('message', (message: any) => {
      if (message.type === 'message') {
        messages.push(message.data);
      } else if (message.type === 'complete') {
        resolve(messages);
      } else if (message.type === 'error') {
        reject(new Error(message.error));
      }
    });
    
    nodeProcess.on('error', reject);
    
    nodeProcess.stderr.on('data', (data) => {
      console.error('Claude Code stderr:', data.toString());
    });
    
    nodeProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        reject(new Error(`Claude Code process exited with code ${code}`));
      }
    });
  });
}