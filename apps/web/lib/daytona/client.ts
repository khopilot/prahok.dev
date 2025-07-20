import { DaytonaClient, Configuration } from '@daytonaio/sdk';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(__dirname, '../../.env.local') });

export interface DaytoneConfig {
  apiKey: string;
  apiUrl?: string;
  target?: string;
}

export class DaytonaService {
  private client: DaytonaClient;
  private config: DaytoneConfig;

  constructor(config?: Partial<DaytoneConfig>) {
    this.config = {
      apiKey: config?.apiKey || process.env.DAYTONA_API_KEY || 'dtn_e749c6a86719444c6c3379e8d28813a8b3cfe97aaaeb187282697772e704f173',
      apiUrl: config?.apiUrl || process.env.DAYTONA_API_URL || 'https://api.daytona.io',
      target: config?.target || process.env.DAYTONA_TARGET || 'us'
    };

    if (!this.config.apiKey) {
      throw new Error('Daytona API key is required');
    }

    // Initialize Daytona client
    const configuration = new Configuration({
      apiKey: this.config.apiKey,
      basePath: this.config.apiUrl,
    });

    this.client = new DaytonaClient(configuration);
  }

  /**
   * Create a new sandbox workspace
   */
  async createSandbox(name: string, template?: string) {
    try {
      console.log('🚀 Creating Daytona sandbox:', { name, template });
      
      const workspace = await this.client.workspaces.create({
        name,
        target: this.config.target,
        gitProviderConfigId: null,
        source: {
          repository: {
            url: template || 'https://github.com/daytonaio/samples',
            branch: 'main'
          }
        }
      });

      console.log('✅ Sandbox created:', workspace.id);
      return workspace;
    } catch (error) {
      console.error('❌ Failed to create sandbox:', error);
      throw error;
    }
  }

  /**
   * Start a sandbox workspace
   */
  async startSandbox(workspaceId: string) {
    try {
      console.log('▶️ Starting sandbox:', workspaceId);
      await this.client.workspaces.start(workspaceId);
      console.log('✅ Sandbox started');
    } catch (error) {
      console.error('❌ Failed to start sandbox:', error);
      throw error;
    }
  }

  /**
   * Get sandbox info including the preview URL
   */
  async getSandboxInfo(workspaceId: string) {
    try {
      const workspace = await this.client.workspaces.get(workspaceId);
      return workspace;
    } catch (error) {
      console.error('❌ Failed to get sandbox info:', error);
      throw error;
    }
  }

  /**
   * Get preview link for the sandbox - This is the crucial function!
   */
  async getPreviewLink(workspaceId: string, port: number = 3000) {
    try {
      console.log('🔗 Getting preview link for sandbox:', workspaceId);
      
      // This is the key discovery - Daytona provides a preview URL
      const workspaceInfo = await this.getSandboxInfo(workspaceId);
      
      // Construct preview URL based on Daytona's pattern
      const previewBaseUrl = process.env.DAYTONA_PREVIEW_BASE_URL || 'https://preview.daytona.io';
      const previewUrl = `${previewBaseUrl}/${workspaceId}/${port}`;
      
      console.log('✅ Preview URL:', previewUrl);
      return {
        url: previewUrl,
        token: this.config.apiKey, // Token for authentication
        workspaceId
      };
    } catch (error) {
      console.error('❌ Failed to get preview link:', error);
      throw error;
    }
  }

  /**
   * Execute command in sandbox
   */
  async executeCommand(workspaceId: string, command: string) {
    try {
      console.log('🖥️ Executing command in sandbox:', { workspaceId, command });
      
      // Use Daytona's SSH or exec capabilities
      const result = await this.client.workspaces.exec(workspaceId, {
        command,
        workingDir: '/workspace'
      });
      
      console.log('✅ Command executed');
      return result;
    } catch (error) {
      console.error('❌ Failed to execute command:', error);
      throw error;
    }
  }

  /**
   * Stop and delete sandbox
   */
  async deleteSandbox(workspaceId: string) {
    try {
      console.log('🗑️ Deleting sandbox:', workspaceId);
      await this.client.workspaces.stop(workspaceId);
      await this.client.workspaces.delete(workspaceId);
      console.log('✅ Sandbox deleted');
    } catch (error) {
      console.error('❌ Failed to delete sandbox:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const daytonaService = new DaytonaService();