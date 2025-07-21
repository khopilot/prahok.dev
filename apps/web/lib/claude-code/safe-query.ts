/**
 * Safe wrapper for Claude Code SDK query function
 * This ensures the SDK works properly in Next.js environment
 */

import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

export interface QueryOptions {
  prompt: string;
  abortController?: AbortController;
  options?: {
    maxTurns?: number;
    permissionMode?: string;
    cwd?: string;
    runtime?: string;
  };
}

/**
 * Generator function that executes Claude Code query in a safe environment
 */
export async function* safeQuery(queryOptions: QueryOptions): AsyncGenerator<any, void, unknown> {
  const { prompt, options = {} } = queryOptions;
  
  // Ensure API key is available
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }
  
  // Create a temporary directory for the execution
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-query-'));
  const scriptPath = path.join(tmpDir, 'query.js');
  const outputPath = path.join(tmpDir, 'output.json');
  
  try {
    // Create the query script
    const script = `
const { query } = require('@anthropic-ai/claude-code');
const fs = require('fs');

process.env.ANTHROPIC_API_KEY = ${JSON.stringify(apiKey)};
process.env.CLAUDE_CODE_RUNTIME = 'node';

async function run() {
  const messages = [];
  
  try {
    for await (const message of query({
      prompt: ${JSON.stringify(prompt)},
      options: ${JSON.stringify(options)}
    })) {
      messages.push(message);
      // Write messages incrementally
      fs.writeFileSync(${JSON.stringify(outputPath)}, JSON.stringify(messages, null, 2));
    }
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
}

run().catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});
`;
    
    fs.writeFileSync(scriptPath, script);
    
    // Execute the script with proper node path
    const nodePath = '/opt/homebrew/opt/node@20/bin/node';
    const result = execSync(`${nodePath} ${scriptPath}`, {
      cwd: tmpDir,
      env: {
        ...process.env,
        PATH: `/opt/homebrew/opt/node@20/bin:/usr/local/bin:/usr/bin:/bin:${process.env.PATH}`,
        ANTHROPIC_API_KEY: apiKey,
        CLAUDE_CODE_RUNTIME: 'node',
      },
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer
    });
    
    // Read and parse the output
    if (fs.existsSync(outputPath)) {
      const messages = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
      for (const message of messages) {
        yield message;
      }
    }
    
  } finally {
    // Cleanup
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (e) {
      console.error('Cleanup error:', e);
    }
  }
}

// Re-export types from the original SDK
export type { SDKMessage } from '@anthropic-ai/claude-code';