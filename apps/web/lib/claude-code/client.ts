import { ClaudeCodeWrapper } from './wrapper';

export interface GenerationOptions {
  prompt: string;
  language?: 'km' | 'en';
  projectType?: 'nextjs' | 'react' | 'html' | 'api';
  features?: string[];
  maxTurns?: number;
}

export interface GenerationResult {
  success: boolean;
  output: string;
  files: string[];
  error?: string;
}

export class ClaudeCodeClient {
  private wrapper: ClaudeCodeWrapper;

  constructor(private apiKey?: string) {
    // API key can come from environment variable or constructor
    if (!this.apiKey && !process.env.ANTHROPIC_API_KEY) {
      throw new Error("Anthropic API key is required");
    }
    
    this.wrapper = new ClaudeCodeWrapper();
  }

  async generateProject(options: GenerationOptions): Promise<GenerationResult> {
    try {
      // Build the enhanced prompt based on project type and language
      const enhancedPrompt = this.buildPrompt(options);

      // Use Claude Code CLI wrapper
      const result = await this.wrapper.generate({
        prompt: enhancedPrompt,
        outputFormat: 'json',
        maxTurns: options.maxTurns || 5,
        model: process.env.CLAUDE_CODE_MODEL,
      });

      return {
        success: result.success,
        output: result.output,
        files: result.files || [],
        error: result.error,
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        files: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private buildPrompt(options: GenerationOptions): string {
    const { prompt, language, projectType, features } = options;
    
    let enhancedPrompt = '';
    
    // Add language context
    if (language === 'km') {
      enhancedPrompt += `Please provide responses and comments in Khmer where appropriate. `;
    }
    
    // Add project type context
    switch (projectType) {
      case 'nextjs':
        enhancedPrompt += `Create a Next.js application with TypeScript, Tailwind CSS, and App Router. `;
        break;
      case 'react':
        enhancedPrompt += `Create a React application with Vite, TypeScript, and Tailwind CSS. `;
        break;
      case 'html':
        enhancedPrompt += `Create a simple HTML/CSS/JavaScript application. `;
        break;
      case 'api':
        enhancedPrompt += `Create a REST API with Express.js and TypeScript. `;
        break;
    }
    
    // Add features
    if (features && features.length > 0) {
      enhancedPrompt += `Include these features: ${features.join(', ')}. `;
    }
    
    // Add the user's prompt
    enhancedPrompt += prompt;
    
    return enhancedPrompt;
  }
}