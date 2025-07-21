/**
 * Safe generation script that handles all edge cases
 * Uses multiple fallback strategies to ensure code generation works
 */

import { executeClaudeCodeWithNode, generateWithClaudeAPI } from '../claude-code/node-executor';
import { daytonaService } from '../daytona/client';
import crypto from 'crypto';

export interface SafeGenerationOptions {
  prompt: string;
  userId: string;
  projectName?: string;
  language?: 'km' | 'en';
  useSandbox?: boolean;
}

export interface SafeGenerationResult {
  success: boolean;
  method: 'sandbox' | 'local-node' | 'api-direct';
  projectId: string;
  workspaceId?: string;
  previewUrl?: string;
  generatedFiles: Array<{ path: string; content: string }>;
  messages: Array<{
    type: string;
    content: string;
    timestamp: string;
  }>;
  error?: string;
}

/**
 * Main generation function with multiple fallback strategies
 */
export async function safeGenerateCode(
  options: SafeGenerationOptions
): Promise<SafeGenerationResult> {
  const { prompt, userId, projectName = 'generated-app', language = 'km', useSandbox = true } = options;
  const projectId = crypto.randomUUID();
  const messages: any[] = [];
  
  console.log('🎯 Starting safe code generation...');
  console.log('📝 Prompt:', prompt);
  console.log('🔧 Options:', { useSandbox, projectName, language });
  
  // Add initial status message
  messages.push({
    type: 'status',
    content: language === 'km' 
      ? 'កំពុងចាប់ផ្តើមបង្កើតកូដ...'
      : 'Starting code generation...',
    timestamp: new Date().toISOString()
  });

  // Strategy 1: Try sandbox generation if enabled
  if (useSandbox) {
    try {
      console.log('📦 Attempting sandbox generation...');
      
      const sandboxName = `${userId.replace(/[^a-z0-9]/gi, '-')}-${projectName}-${Date.now()}`;
      const sandbox = await daytonaService.createSandbox(sandboxName);
      
      messages.push({
        type: 'info',
        content: language === 'km'
          ? 'បានបង្កើត sandbox ដោយជោគជ័យ'
          : 'Sandbox created successfully',
        timestamp: new Date().toISOString()
      });
      
      // Get preview URL immediately after creation
      try {
        const preview = await daytonaService.getPreviewLink(sandbox.id, 3000);
        
        // Try to generate code in sandbox using Node executor
        const result = await executeClaudeCodeWithNode(prompt, {
          maxTurns: 5,
          cwd: `/sandbox/${sandbox.id}` // Virtual path
        });
        
        if (result.success && result.files) {
          // Merge Claude Code SDK messages
          if (result.messages && result.messages.length > 0) {
            messages.push(...result.messages);
          }
          
          messages.push({
            type: 'success',
            content: language === 'km'
              ? `បានបង្កើតឯកសារចំនួន ${result.files.length} ដោយជោគជ័យ!`
              : `Successfully generated ${result.files.length} files!`,
            timestamp: new Date().toISOString()
          });
          
          return {
            success: true,
            method: 'sandbox',
            projectId,
            workspaceId: sandbox.id,
            previewUrl: preview.url,
            generatedFiles: result.files,
            messages
          };
        }
      } catch (previewError) {
        console.error('Preview/generation error:', previewError);
        // Continue to fallback
      }
      
      // Clean up sandbox if generation failed
      try {
        await daytonaService.deleteSandbox(sandbox.id);
      } catch (e) {
        // Ignore cleanup errors
      }
    } catch (sandboxError) {
      console.error('Sandbox generation failed:', sandboxError);
      messages.push({
        type: 'warning',
        content: language === 'km'
          ? 'មិនអាចប្រើ sandbox បាន កំពុងប្តូរទៅវិធីផ្សេង...'
          : 'Sandbox unavailable, switching to alternative method...',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Strategy 2: Try local Node.js execution
  try {
    console.log('🖥️ Attempting local Node.js execution...');
    
    const result = await executeClaudeCodeWithNode(prompt, {
      maxTurns: 5,
      cwd: process.cwd()
    });
    
    if (result.success && result.files) {
      // Merge Claude Code SDK messages
      if (result.messages && result.messages.length > 0) {
        messages.push(...result.messages);
      }
      
      messages.push({
        type: 'success',
        content: language === 'km'
          ? `បានបង្កើតឯកសារចំនួន ${result.files.length} ដោយជោគជ័យ!`
          : `Successfully generated ${result.files.length} files!`,
        timestamp: new Date().toISOString()
      });
      
      return {
        success: true,
        method: 'local-node',
        projectId,
        previewUrl: `/preview/${projectId}`,
        generatedFiles: result.files,
        messages
      };
    }
  } catch (nodeError) {
    console.error('Node.js execution failed:', nodeError);
    messages.push({
      type: 'warning',
      content: language === 'km'
        ? 'កំពុងប្តូរទៅការបង្កើតដោយផ្ទាល់...'
        : 'Switching to direct API generation...',
      timestamp: new Date().toISOString()
    });
  }

  // Strategy 3: Direct API call (most reliable fallback)
  try {
    console.log('🌐 Using direct Claude API...');
    
    const result = await generateWithClaudeAPI(prompt);
    
    if (result.success && result.files) {
      messages.push({
        type: 'success',
        content: language === 'km'
          ? `បានបង្កើតឯកសារចំនួន ${result.files.length} ដោយជោគជ័យ!`
          : `Successfully generated ${result.files.length} files!`,
        timestamp: new Date().toISOString()
      });
      
      // Only add default index.html if no framework files are detected
      const hasFrameworkFiles = result.files.some(f => 
        f.path.includes('package.json') || 
        f.path.includes('_app.') || 
        f.path.includes('App.') ||
        f.path.includes('index.js') ||
        f.path.includes('index.jsx') ||
        f.path.includes('index.ts') ||
        f.path.includes('index.tsx')
      );
      
      if (result.files.length > 0 && !hasFrameworkFiles && !result.files.find(f => f.path === 'index.html')) {
        result.files.push({
          path: 'index.html',
          content: createIndexHtml(projectName, result.files)
        });
      }
      
      return {
        success: true,
        method: 'api-direct',
        projectId,
        previewUrl: `/preview/${projectId}`,
        generatedFiles: result.files,
        messages
      };
    } else {
      throw new Error(result.error || 'Generation failed');
    }
  } catch (apiError) {
    console.error('API generation failed:', apiError);
    
    messages.push({
      type: 'error',
      content: language === 'km'
        ? 'សូមអភ័យទោស មានបញ្ហាក្នុងការបង្កើតកូដ'
        : 'Sorry, there was an error generating code',
      timestamp: new Date().toISOString()
    });
    
    return {
      success: false,
      method: 'api-direct',
      projectId,
      generatedFiles: [],
      messages,
      error: apiError instanceof Error ? apiError.message : 'Unknown error'
    };
  }
}

/**
 * Create a default index.html that lists generated files
 */
function createIndexHtml(projectName: string, files: Array<{ path: string; content: string }>): string {
  const cssFiles = files.filter(f => f.path.endsWith('.css'));
  const jsFiles = files.filter(f => f.path.endsWith('.js'));
  
  return `<!DOCTYPE html>
<html lang="km">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName}</title>
    ${cssFiles.map(f => `<link rel="stylesheet" href="${f.path}">`).join('\n    ')}
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.95);
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            margin-bottom: 20px;
            font-size: 2.5em;
        }
        .success {
            color: #10b981;
            font-weight: 600;
        }
        .files-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        .file-card {
            background: #f9fafb;
            padding: 20px;
            border-radius: 10px;
            border: 1px solid #e5e7eb;
            transition: transform 0.2s;
        }
        .file-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .file-path {
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 14px;
            color: #6366f1;
            margin-bottom: 8px;
        }
        .file-size {
            color: #6b7280;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎉 ${projectName}</h1>
        <p class="success">កម្មវិធីរបស់អ្នកត្រូវបានបង្កើតដោយជោគជ័យ!</p>
        <p>Your application has been generated successfully!</p>
        
        <div class="files-grid">
            ${files.map(f => `
                <div class="file-card">
                    <div class="file-path">📄 ${f.path}</div>
                    <div class="file-size">${f.content.length} characters</div>
                </div>
            `).join('')}
        </div>
    </div>
    ${jsFiles.map(f => `<script src="${f.path}"></script>`).join('\n    ')}
</body>
</html>`;
}