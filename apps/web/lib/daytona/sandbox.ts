import { Daytona } from '@daytonaio/sdk';
import type { Sandbox } from '@daytonaio/sdk';

export interface SandboxConfig {
  projectId: string;
  language?: string;
  envVars?: Record<string, string>;
}

export interface SandboxResult {
  sandboxId: string;
  previewUrl?: string;
  status: 'creating' | 'ready' | 'failed';
  error?: string;
}

export class SandboxManager {
  private client: Daytona;
  private activeSandboxes: Map<string, Sandbox> = new Map();

  constructor(apiKey?: string) {
    // Initialize Daytona client with API key
    this.client = new Daytona({
      apiKey: apiKey || process.env.DAYTONA_API_KEY,
      apiUrl: process.env.DAYTONA_API_URL || 'https://app.daytona.io/api',
      target: (process.env.DAYTONA_TARGET || 'us') as any,
    });
  }

  async createSandbox(config: SandboxConfig): Promise<SandboxResult> {
    try {
      // Create sandbox with appropriate language and environment
      const sandbox = await this.client.create({
        language: config.language || 'typescript',
        envVars: {
          NODE_ENV: 'development',
          ...config.envVars,
        },
      });

      // Store sandbox reference
      this.activeSandboxes.set(config.projectId, sandbox);

      return {
        sandboxId: sandbox.id,
        status: 'creating',
      };
    } catch (error) {
      return {
        sandboxId: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to create sandbox',
      };
    }
  }

  async deploySandbox(projectId: string, files: Record<string, string>): Promise<boolean> {
    const sandbox = this.activeSandboxes.get(projectId);
    if (!sandbox) {
      throw new Error('Sandbox not found');
    }

    try {
      // Write all files to the sandbox
      // TODO: Implement file writing when Daytona SDK API is clarified
      console.log('Writing files to sandbox:', Object.keys(files).length);

      // Install dependencies if package.json exists
      if (files['package.json']) {
        // TODO: Implement npm install when Daytona SDK API is clarified
        console.log('Would install dependencies');
      }

      // Start the development server
      const projectType = this.detectProjectType(files);
      await this.startDevServer(sandbox, projectType);

      return true;
    } catch (error) {
      console.error('Failed to deploy to sandbox:', error);
      return false;
    }
  }

  async getPreviewUrl(projectId: string): Promise<string | null> {
    const sandbox = this.activeSandboxes.get(projectId);
    if (!sandbox) {
      return null;
    }

    try {
      // Get the preview URL for the sandbox
      // The SDK should provide a method to get preview URLs
      // This is a placeholder - check Daytona docs for exact method
      const previewUrl = await this.generatePreviewUrl(sandbox);
      return previewUrl;
    } catch (error) {
      console.error('Failed to get preview URL:', error);
      return null;
    }
  }

  async removeSandbox(projectId: string): Promise<void> {
    const sandbox = this.activeSandboxes.get(projectId);
    if (sandbox) {
      try {
        await sandbox.delete();
        this.activeSandboxes.delete(projectId);
      } catch (error) {
        console.error('Failed to remove sandbox:', error);
      }
    }
  }

  async executeCommand(projectId: string, command: string): Promise<string> {
    const sandbox = this.activeSandboxes.get(projectId);
    if (!sandbox) {
      throw new Error('Sandbox not found');
    }

    // TODO: Implement command execution when Daytona SDK API is clarified
    console.log('Would execute command:', command);
    return 'Command execution not implemented';
  }

  private detectProjectType(files: Record<string, string>): string {
    if (files['next.config.js'] || files['next.config.ts']) {
      return 'nextjs';
    }
    if (files['vite.config.js'] || files['vite.config.ts']) {
      return 'vite';
    }
    if (files['package.json']) {
      const packageJson = JSON.parse(files['package.json']);
      if (packageJson.scripts?.dev) {
        return 'node';
      }
    }
    return 'static';
  }

  private async startDevServer(sandbox: Sandbox, projectType: string): Promise<void> {
    let command = '';
    
    switch (projectType) {
      case 'nextjs':
        command = 'npm run dev';
        break;
      case 'vite':
        command = 'npm run dev';
        break;
      case 'node':
        command = 'npm run dev';
        break;
      case 'static':
        // For static files, we might use a simple HTTP server
        command = 'npx serve .';
        break;
    }

    if (command) {
      // Run the dev server in the background
      // TODO: Implement dev server start when Daytona SDK API is clarified
      console.log('Would start dev server with:', command);
    }
  }

  private async generatePreviewUrl(sandbox: Sandbox): Promise<string> {
    // This is a placeholder - the actual implementation depends on Daytona's API
    // You might need to construct the URL based on sandbox ID and region
    const baseUrl = process.env.DAYTONA_PREVIEW_BASE_URL || 'https://preview.daytona.io';
    return `${baseUrl}/${sandbox.id}`;
  }
}