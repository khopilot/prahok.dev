/**
 * Script complet orchestrant l'ensemble du processus de génération
 * Ce script encapsule toutes les étapes développées et testées isolément
 */

// Import SDK environment config and spawn fix BEFORE any Claude Code imports
import '../claude-code/sdk-env';
import '../claude-code/fix-spawn';
import { query, type SDKMessage } from "@anthropic-ai/claude-code";
import { daytonaService } from '../daytona/client';
import { promises as fs } from 'fs';
import path from 'path';

// Ensure API key is loaded at module level
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export interface CompleteGenerationOptions {
  prompt: string;
  userId: string;
  projectName?: string;
  language?: 'km' | 'en';
}

export interface CompleteGenerationResult {
  success: boolean;
  workspaceId: string;
  previewUrl: string;
  embedUrl: string;
  generatedFiles: string[];
  executionTime: number;
  messages: Array<{
    type: string;
    content: string;
    timestamp: string;
  }>;
  error?: string;
}

/**
 * Script unique qui encapsule l'ensemble du processus de génération de code
 */
export async function completeGenerationProcess(
  options: CompleteGenerationOptions
): Promise<CompleteGenerationResult> {
  const startTime = Date.now();
  const { prompt, userId, projectName = 'generated-app', language = 'km' } = options;
  
  let workspaceId: string | undefined;
  const messages: any[] = [];
  const generatedFiles: string[] = [];
  
  console.log('🎯 Starting complete generation process...');
  console.log('📝 User prompt:', prompt);

  try {
    // Étape 1: Créer une sandbox Daytona
    console.log('\n📦 Step 1: Creating Daytona sandbox...');
    messages.push({
      type: 'status',
      content: language === 'km' 
        ? 'កំពុងបង្កើត sandbox សម្រាប់កម្មវិធីរបស់អ្នក...'
        : 'Creating sandbox for your application...',
      timestamp: new Date().toISOString()
    });

    const sandboxName = `${userId.replace(/[^a-z0-9]/gi, '-')}-${projectName}-${Date.now()}`;
    const workspace = await daytonaService.createSandbox(
      sandboxName,
      'https://github.com/vercel/next-template' // Template Next.js de base
    );
    workspaceId = workspace.id;
    
    console.log('✅ Sandbox created:', workspaceId);
    messages.push({
      type: 'success',
      content: language === 'km'
        ? 'បានបង្កើត sandbox ដោយជោគជ័យ!'
        : 'Sandbox created successfully!',
      timestamp: new Date().toISOString()
    });

    // Étape 2: Démarrer la sandbox (avec gestion d'état améliorée)
    console.log('\n▶️ Step 2: Starting sandbox...');
    messages.push({
      type: 'status',
      content: language === 'km'
        ? 'កំពុងចាប់ផ្តើម sandbox...'
        : 'Starting sandbox...',
      timestamp: new Date().toISOString()
    });
    
    try {
      await daytonaService.startSandbox(workspaceId);
      messages.push({
        type: 'success',
        content: language === 'km'
          ? 'Sandbox បានចាប់ផ្តើមដោយជោគជ័យ!'
          : 'Sandbox started successfully!',
        timestamp: new Date().toISOString()
      });
    } catch (startError: any) {
      console.log('⚠️ Sandbox start issue:', startError.message);
      // Continue anyway - the sandbox might already be in a usable state
      messages.push({
        type: 'info',
        content: language === 'km'
          ? 'កំពុងបន្តដោយមិនគិតពីស្ថានភាព sandbox...'
          : 'Continuing regardless of sandbox state...',
        timestamp: new Date().toISOString()
      });
    }
    
    // Attendre que la sandbox soit prête
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Étape 3: Installer le SDK de Claude Code dans la sandbox
    console.log('\n📥 Step 3: Installing Claude Code SDK in sandbox...');
    messages.push({
      type: 'status',
      content: language === 'km'
        ? 'កំពុងដំឡើង Claude Code SDK...'
        : 'Installing Claude Code SDK...',
      timestamp: new Date().toISOString()
    });

    // Installer les dépendances nécessaires
    const installCommands = [
      'npm install @anthropic-ai/claude-code',
      'npm install dotenv',
      'npm install --save-dev @types/node typescript tsx'
    ];

    for (const cmd of installCommands) {
      await daytonaService.executeCommand(workspaceId, cmd);
    }
    
    console.log('✅ Dependencies installed');

    // Étape 4: Générer un site web personnalisé avec Claude Code
    console.log('\n🤖 Step 4: Generating custom website with Claude Code...');
    messages.push({
      type: 'status',
      content: language === 'km'
        ? 'AI កំពុងសរសេរកូដសម្រាប់អ្នក...'
        : 'AI is writing code for you...',
      timestamp: new Date().toISOString()
    });

    // Prompt amélioré pour la génération
    const enhancedPrompt = `
${prompt}

IMPORTANT INSTRUCTIONS:
- Generate a complete Next.js application
- Use TypeScript and Tailwind CSS
- Create all necessary pages in the app directory
- Make the design modern and beautiful
- Add proper error handling
- Include responsive design
- ${language === 'km' ? 'Add Khmer language support where appropriate' : ''}
- Make it production-ready

You are generating code inside a Next.js 14 environment with:
- App directory structure
- TypeScript configured
- Tailwind CSS ready
- Working directory: /workspace

Create all files relative to the app directory.
`;

    // Exécuter la génération avec Claude Code
    const abortController = new AbortController();
    let fileCount = 0;
    
    // Ensure API key is available
    console.log('🔑 Checking API key...');
    const apiKey = process.env.ANTHROPIC_API_KEY || ANTHROPIC_API_KEY;
    console.log('API Key exists:', !!apiKey);
    console.log('API Key first 10 chars:', apiKey?.substring(0, 10));
    
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured. Please set it in your .env.local file');
    }
    
    // Set the API key in environment if needed
    if (!process.env.ANTHROPIC_API_KEY) {
      process.env.ANTHROPIC_API_KEY = apiKey;
    }
    
    // Set Node.js runtime to avoid bun error
    process.env.CLAUDE_CODE_RUNTIME = 'node';
    
    for await (const message of query({
      prompt: enhancedPrompt,
      abortController,
      options: {
        maxTurns: 7,
        permissionMode: 'bypassPermissions',
        cwd: `/tmp/sandbox-${workspaceId}`, // Chemin virtuel pour tracking
        runtime: 'node', // Force Node.js instead of bun
      }
    })) {
      // Traiter les messages de Claude
      if (message.type === 'assistant' && 'content' in message) {
        const content = extractReadableContent(message);
        if (content) {
          messages.push({
            type: 'assistant',
            content: formatMessageForUser(content, language),
            timestamp: new Date().toISOString()
          });
        }
        
        // Détecter les fichiers créés
        const files = extractFilesFromMessage(message);
        for (const file of files) {
          fileCount++;
          generatedFiles.push(file);
          messages.push({
            type: 'file',
            content: language === 'km'
              ? `បានបង្កើតឯកសារ ${fileCount}: ${file}`
              : `Created file ${fileCount}: ${file}`,
            timestamp: new Date().toISOString()
          });
          
          // TODO: Transférer le fichier vers la sandbox
          // Pour l'instant, on simule avec une commande echo
          const fileContent = extractFileContent(message, file);
          if (fileContent) {
            const escapedContent = fileContent.replace(/'/g, "'\"'\"'");
            await daytonaService.executeCommand(
              workspaceId,
              `echo '${escapedContent}' > ${file}`
            );
          }
        }
      }
    }

    console.log(`✅ Generated ${fileCount} files`);

    // Étape 5: Démarrer le serveur de développement
    console.log('\n🚀 Step 5: Starting development server...');
    messages.push({
      type: 'status',
      content: language === 'km'
        ? 'កំពុងចាប់ផ្តើមម៉ាស៊ីនមេ...'
        : 'Starting development server...',
      timestamp: new Date().toISOString()
    });

    await daytonaService.executeCommand(workspaceId, 'npm run dev &');
    
    // Attendre que le serveur démarre
    await new Promise(resolve => setTimeout(resolve, 8000));

    // Étape 6: Obtenir l'URL de prévisualisation
    console.log('\n🔗 Step 6: Getting preview URL...');
    const preview = await daytonaService.getPreviewLink(workspaceId, 3000);
    
    const executionTime = Date.now() - startTime;
    
    console.log('\n✨ GENERATION COMPLETE! ✨');
    console.log('📱 Preview URL:', preview.url);
    console.log('⏱️ Total time:', executionTime / 1000, 'seconds');
    console.log('📁 Files generated:', generatedFiles.length);

    messages.push({
      type: 'complete',
      content: language === 'km'
        ? `បានបង្កើតកម្មវិធីដោយជោគជ័យ! មើលលទ្ធផលនៅ: ${preview.url}`
        : `Application generated successfully! View at: ${preview.url}`,
      timestamp: new Date().toISOString()
    });

    // Planifier le nettoyage automatique après 1 heure
    scheduleSandboxCleanup(workspaceId, 3600000);

    return {
      success: true,
      workspaceId,
      previewUrl: preview.url,
      embedUrl: `${preview.url}?embed=true`,
      generatedFiles,
      executionTime,
      messages
    };

  } catch (error) {
    console.error('\n❌ GENERATION FAILED:', error);
    
    // Nettoyer en cas d'erreur
    if (workspaceId) {
      try {
        await daytonaService.deleteSandbox(workspaceId);
      } catch (cleanupError) {
        console.error('Failed to cleanup sandbox:', cleanupError);
      }
    }

    // Provide user-friendly error messages
    let userError = 'Unknown error occurred';
    if (error instanceof Error) {
      if (error.message.includes('Depleted credits') || error.message.includes('suspended')) {
        userError = language === 'km' 
          ? 'សេវា Sandbox អស់ credits ហើយ។ សូមទាក់ទងអ្នកគ្រប់គ្រង។'
          : 'Sandbox service has depleted credits. Please contact administrator.';
        messages.push({
          type: 'error',
          content: userError,
          timestamp: new Date().toISOString()
        });
      } else if (error.message.includes('ANTHROPIC_API_KEY')) {
        userError = language === 'km'
          ? 'API Key មិនត្រូវបានកំណត់។ សូមពិនិត្យការកំណត់រចនាសម្ព័ន្ធ។'
          : 'API Key not configured. Please check configuration.';
      } else {
        userError = error.message;
      }
    }

    return {
      success: false,
      workspaceId: workspaceId || 'unknown',
      previewUrl: '',
      embedUrl: '',
      generatedFiles: [],
      executionTime: Date.now() - startTime,
      messages,
      error: userError
    };
  }
}

// Fonctions utilitaires
function extractReadableContent(message: any): string {
  if (typeof message.content === 'string') {
    return message.content;
  }
  
  if (Array.isArray(message.content)) {
    return message.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('\n');
  }
  
  return '';
}

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

function extractFileContent(message: any, filePath: string): string | null {
  if (message.content && Array.isArray(message.content)) {
    for (const block of message.content) {
      if (block.type === 'tool_use' && 
          block.name === 'Write' && 
          block.input?.file_path === filePath) {
        return block.input.content || null;
      }
    }
  }
  return null;
}

function formatMessageForUser(content: string, language: 'km' | 'en'): string {
  // Supprimer le jargon technique
  let formatted = content
    .replace(/```[\s\S]*?```/g, '') // Supprimer les blocs de code
    .replace(/`[^`]+`/g, (match) => `**${match.slice(1, -1)}**`)
    .trim();

  if (language === 'km') {
    // Traductions spécifiques au khmer
    const translations: Record<string, string> = {
      'Creating': 'កំពុងបង្កើត',
      'Writing': 'កំពុងសរសេរ',
      'Installing': 'កំពុងដំឡើង',
      'file': 'ឯកសារ',
      'component': 'សមាសភាគ',
      'page': 'ទំព័រ',
      'Complete': 'បានបញ្ចប់',
    };

    for (const [eng, khm] of Object.entries(translations)) {
      formatted = formatted.replace(new RegExp(eng, 'gi'), khm);
    }
  }

  return formatted;
}

function scheduleSandboxCleanup(workspaceId: string, delayMs: number) {
  setTimeout(async () => {
    try {
      console.log(`🗑️ Auto-cleaning sandbox ${workspaceId}`);
      await daytonaService.deleteSandbox(workspaceId);
    } catch (error) {
      console.error('Auto-cleanup failed:', error);
    }
  }, delayMs);
}

// Export pour utilisation
export { scheduleSandboxCleanup };