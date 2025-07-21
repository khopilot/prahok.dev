import { Daytona, Sandbox } from '@daytonaio/sdk';

export interface DaytoneConfig {
  apiKey: string;
  apiUrl?: string;
  target?: string;
}

export class DaytonaService {
  private client: Daytona;
  private config: DaytoneConfig;

  constructor(config?: Partial<DaytoneConfig>) {
    this.config = {
      apiKey: config?.apiKey || process.env.DAYTONA_API_KEY || 'dtn_aa79c1f1fcc0b6ef56139fc8458d2b99d91b2eb763f60c854298ec444a3cc061',
      apiUrl: config?.apiUrl || process.env.DAYTONA_API_URL || 'https://app.daytona.io/api',
      target: config?.target || process.env.DAYTONA_TARGET || 'us'
    };

    if (!this.config.apiKey) {
      throw new Error('Daytona API key is required');
    }

    // Initialize Daytona client
    this.client = new Daytona({
      apiKey: this.config.apiKey,
      apiUrl: this.config.apiUrl,
      target: this.config.target,
    });
  }

  /**
   * Create a new sandbox workspace
   */
  async createSandbox(name: string, template?: string) {
    try {
      console.log('🚀 Creating Daytona sandbox:', { name, template });
      
      // Create a new sandbox using the Daytona SDK
      const sandbox = await this.client.create();

      console.log('✅ Sandbox created:', sandbox.id);
      console.log('📋 Sandbox details:', {
        id: sandbox.id,
        state: sandbox.state,
        // Log any other available properties
        ...sandbox
      });
      
      return sandbox;
    } catch (error) {
      console.error('❌ Failed to create sandbox:', error);
      throw error;
    }
  }

  /**
   * Start a sandbox workspace
   */
  async startSandbox(sandboxId: string) {
    try {
      console.log('▶️ Starting sandbox:', sandboxId);
      
      // Get sandbox info first
      const sandbox = await this.client.get(sandboxId);
      console.log('📋 Current sandbox state:', sandbox.state);
      
      // Check if sandbox is already running or doesn't need to be started
      if (sandbox.state === 'running' || sandbox.state === 'active') {
        console.log('✅ Sandbox is already running');
        return;
      }
      
      // Only try to start if sandbox is in a startable state
      if (sandbox.state === 'stopped' || sandbox.state === 'created') {
        console.log('⏳ Waiting for sandbox to be ready...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        try {
          await sandbox.start();
          console.log('✅ Sandbox started successfully');
        } catch (startError: any) {
          // Log the error but don't throw if it's an expected state issue
          console.log('⚠️ Start error (may be expected):', startError.message);
          
          // Re-check the state
          const updatedSandbox = await this.client.get(sandboxId);
          console.log('📋 Updated sandbox state after start attempt:', updatedSandbox.state);
          
          // If it's running now, consider it a success
          if (updatedSandbox.state === 'running' || updatedSandbox.state === 'active') {
            console.log('✅ Sandbox is now running despite error');
            return;
          }
          
          // Otherwise, throw the error
          throw startError;
        }
      } else {
        console.log(`⚠️ Sandbox is in state '${sandbox.state}' - skipping start`);
      }
    } catch (error) {
      console.error('❌ Failed to start sandbox:', error);
      throw error;
    }
  }

  /**
   * Get sandbox info including the preview URL
   */
  async getSandboxInfo(sandboxId: string) {
    try {
      const sandbox = await this.client.get(sandboxId);
      return sandbox;
    } catch (error) {
      console.error('❌ Failed to get sandbox info:', error);
      throw error;
    }
  }

  /**
   * Get preview link for the sandbox - This is the crucial function!
   */
  async getPreviewLink(sandboxId: string, port: number = 3000) {
    try {
      console.log('🔗 Getting preview link for sandbox:', sandboxId);
      
      // Get the sandbox instance
      const sandbox = await this.client.get(sandboxId);
      
      // Use the getPreviewLink method from the Sandbox class
      const previewUrl = await sandbox.getPreviewLink(port);
      
      console.log('✅ Preview URL:', previewUrl);
      return {
        url: previewUrl.url,
        token: this.config.apiKey, // Token for authentication
        sandboxId
      };
    } catch (error) {
      console.error('❌ Failed to get preview link:', error);
      throw error;
    }
  }

  /**
   * Execute command in sandbox
   */
  async executeCommand(sandboxId: string, command: string) {
    try {
      console.log('🖥️ Executing command in sandbox:', { sandboxId, command: command.substring(0, 100) + '...' });
      
      // Get the sandbox
      const sandbox = await this.client.get(sandboxId);
      
      // Check if sandbox has an exec method
      if (typeof sandbox.exec === 'function') {
        const result = await sandbox.exec(command);
        console.log('✅ Command executed via SDK');
        return result;
      } else if (typeof sandbox.execute === 'function') {
        const result = await sandbox.execute(command);
        console.log('✅ Command executed via SDK');
        return result;
      } else {
        console.warn('⚠️ Command execution not available in SDK, skipping:', command.substring(0, 50) + '...');
        // Return a mock result to allow the process to continue
        return { 
          stdout: 'Command execution skipped - SDK method not available',
          stderr: '',
          code: 0
        };
      }
    } catch (error) {
      console.error('❌ Failed to execute command:', error);
      // Don't throw - allow the process to continue
      return {
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Unknown error',
        code: 1
      };
    }
  }

  /**
   * Stop and delete sandbox
   */
  async deleteSandbox(sandboxId: string) {
    try {
      console.log('🗑️ Deleting sandbox:', sandboxId);
      const sandbox = await this.client.get(sandboxId);
      await sandbox.stop();
      await sandbox.delete();
      console.log('✅ Sandbox deleted');
    } catch (error) {
      console.error('❌ Failed to delete sandbox:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const daytonaService = new DaytonaService();