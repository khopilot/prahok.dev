import { spawn } from 'child_process';
import { randomUUID } from 'crypto';

export interface ClaudeCodeOptions {
  prompt: string;
  outputFormat?: 'json' | 'stream-json' | 'text';
  maxTurns?: number;
  model?: string;
  cwd?: string;
}

export interface ClaudeCodeResult {
  success: boolean;
  output: string;
  error?: string;
  files?: string[];
}

/**
 * Wrapper for Claude Code CLI
 * This uses the installed CLI to generate code
 */
export class ClaudeCodeWrapper {
  private claudePath: string;

  constructor() {
    // The claude CLI should be available after npm install
    this.claudePath = 'npx';
  }

  async generate(options: ClaudeCodeOptions): Promise<ClaudeCodeResult> {
    return new Promise((resolve) => {
      const args = [
        '@anthropic-ai/claude-code',
        '-p',
        options.prompt,
      ];

      // Add optional arguments
      if (options.outputFormat) {
        args.push('--output-format', options.outputFormat);
      }

      if (options.maxTurns) {
        args.push('--max-turns', options.maxTurns.toString());
      }

      if (options.model) {
        args.push('--model', options.model);
      }

      // Create a temporary directory for the generated code
      const sessionId = randomUUID();
      const outputDir = `/tmp/claude-code-${sessionId}`;
      
      const env = {
        ...process.env,
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      };

      const claudeProcess = spawn('npx', args, {
        cwd: options.cwd || outputDir,
        env,
        shell: false,
      });

      let output = '';
      let error = '';

      claudeProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      claudeProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      claudeProcess.on('close', (code) => {
        if (code === 0) {
          // Parse output to extract file information
          const files = this.extractFilesFromOutput(output);
          
          resolve({
            success: true,
            output,
            files,
          });
        } else {
          resolve({
            success: false,
            output,
            error: error || `Process exited with code ${code}`,
          });
        }
      });

      claudeProcess.on('error', (err) => {
        resolve({
          success: false,
          output,
          error: err.message,
        });
      });
    });
  }

  private extractFilesFromOutput(output: string): string[] {
    const files: string[] = [];
    
    // Look for file paths in the output
    // This is a simple pattern - adjust based on actual Claude Code output
    const filePattern = /(?:created?|wrote?|modified?)\s+(?:file\s+)?([^\s]+\.(js|ts|jsx|tsx|html|css|json|md))/gi;
    let match;
    
    while ((match = filePattern.exec(output)) !== null) {
      if (match[1] && !files.includes(match[1])) {
        files.push(match[1]);
      }
    }

    // Also look for Write tool usage in JSON output
    try {
      const lines = output.split('\n');
      for (const line of lines) {
        if (line.trim().startsWith('{')) {
          const json = JSON.parse(line);
          if (json.type === 'tool_use' && json.name === 'Write' && json.input?.file_path) {
            if (!files.includes(json.input.file_path)) {
              files.push(json.input.file_path);
            }
          }
        }
      }
    } catch {
      // Ignore JSON parsing errors
    }

    return files;
  }
}