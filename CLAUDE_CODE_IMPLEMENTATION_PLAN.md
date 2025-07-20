# Claude Code SDK Implementation Plan - Lovable Clone

## 🎯 Project Overview
Build a web application that generates other web applications using Claude Code SDK, similar to Lovable. The app will accept user prompts in Khmer/English and generate full-stack applications.

## 🏗️ Architecture Overview

```
┌─────────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Next.js Frontend  │────▶│  API Routes      │────▶│ Claude Code SDK │
│   (Prahok UI)       │     │  (TypeScript)    │     │  (Code Gen)     │
└─────────────────────┘     └──────────────────┘     └────────┬────────┘
                                                               │
                                    ┌──────────────────────────┘
                                    ▼
                            ┌─────────────────┐
                            │ Daytona Sandbox │
                            │  (Isolated Env) │
                            └─────────────────┘
```

## 📋 Phase 1: Setup and Core Infrastructure

### 1.1 Project Structure
```
prahok.dev/
├── apps/
│   ├── web/                    # Existing Next.js frontend
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   ├── generate/   # Code generation endpoints
│   │   │   │   └── sandbox/    # Sandbox management
│   │   │   └── builder/        # Builder UI pages
│   │   └── lib/
│   │       ├── claude-code/    # Claude Code SDK wrapper
│   │       └── daytona/        # Daytona integration
│   └── api/                    # Existing Express backend
├── packages/
│   └── code-templates/         # Project templates
└── docker/
    └── claude-code/           # Docker image for sandboxes
```

### 1.2 Environment Setup
```env
# .env.local additions
ANTHROPIC_API_KEY=your_key_here
DAYTONA_API_KEY=your_key_here
DAYTONA_API_URL=https://api.daytona.io
CLAUDE_CODE_MODEL=claude-3-opus-20240229
CODE_GEN_TIMEOUT=300000
```

### 1.3 Dependencies
```json
{
  "dependencies": {
    "@anthropic-ai/claude-code-sdk": "latest",
    "@daytona/sdk": "latest",
    "dockerode": "^4.0.0",
    "socket.io": "^4.6.0",
    "socket.io-client": "^4.6.0",
    "zod": "^3.22.0",
    "react-markdown": "^9.0.0",
    "@monaco-editor/react": "^4.6.0"
  }
}
```

## 📋 Phase 2: Core Code Generation Function

### 2.1 Claude Code SDK Wrapper
```typescript
// apps/web/lib/claude-code/client.ts
import { ClaudeCode } from '@anthropic-ai/claude-code-sdk';

export interface GenerationOptions {
  prompt: string;
  language?: 'km' | 'en';
  projectType?: 'nextjs' | 'react' | 'html' | 'api';
  features?: string[];
}

export class ClaudeCodeClient {
  private client: ClaudeCode;

  constructor(apiKey: string) {
    this.client = new ClaudeCode({
      apiKey,
      model: process.env.CLAUDE_CODE_MODEL,
    });
  }

  async generateProject(options: GenerationOptions): Promise<GenerationResult> {
    // Implementation details
  }
}
```

### 2.2 Project Templates
```typescript
// packages/code-templates/index.ts
export const templates = {
  nextjs: {
    name: 'Next.js App',
    description: 'Modern React framework with SSR',
    basePrompt: 'Create a Next.js application with TypeScript',
    files: ['package.json', 'tsconfig.json', 'next.config.js'],
  },
  react: {
    name: 'React SPA',
    description: 'Single-page React application',
    basePrompt: 'Create a React app with Vite and TypeScript',
  },
  // More templates...
};
```

## 📋 Phase 3: Daytona Sandbox Integration

### 3.1 Sandbox Manager
```typescript
// apps/web/lib/daytona/sandbox.ts
import { DaytonaClient } from '@daytona/sdk';

export class SandboxManager {
  private client: DaytonaClient;

  constructor(apiKey: string) {
    this.client = new DaytonaClient({ apiKey });
  }

  async createSandbox(projectId: string): Promise<Sandbox> {
    const sandbox = await this.client.createWorkspace({
      name: `prahok-${projectId}`,
      image: 'prahok/claude-code:latest',
      resources: {
        cpu: 2,
        memory: 4096,
      },
    });
    
    return sandbox;
  }

  async getPreviewUrl(sandboxId: string): Promise<string> {
    return this.client.getPreviewLink(sandboxId, 3000);
  }
}
```

### 3.2 Docker Image for Sandboxes
```dockerfile
# docker/claude-code/Dockerfile
FROM node:20-alpine

# Install Claude Code SDK and dependencies
RUN npm install -g @anthropic-ai/claude-code-sdk

# Install common development tools
RUN apk add --no-cache git curl bash

# Setup working directory
WORKDIR /workspace

# Entry point script
COPY entrypoint.sh /
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
```

## 📋 Phase 4: API Implementation

### 4.1 Generation Endpoint
```typescript
// apps/web/app/api/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const GenerateSchema = z.object({
  prompt: z.string().min(10),
  projectType: z.enum(['nextjs', 'react', 'html', 'api']),
  features: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { prompt, projectType, features } = GenerateSchema.parse(body);

  // 1. Create sandbox
  const sandbox = await sandboxManager.createSandbox(projectId);
  
  // 2. Generate code using Claude Code
  const project = await claudeCode.generateProject({
    prompt,
    projectType,
    features,
  });
  
  // 3. Deploy to sandbox
  await sandbox.deployCode(project);
  
  // 4. Get preview URL
  const previewUrl = await sandboxManager.getPreviewUrl(sandbox.id);
  
  return NextResponse.json({
    projectId,
    sandboxId: sandbox.id,
    previewUrl,
    status: 'ready',
  });
}
```

### 4.2 Real-time Updates with Socket.io
```typescript
// apps/web/app/api/socket/route.ts
import { Server } from 'socket.io';

export function setupSocketServer(httpServer: any) {
  const io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  io.on('connection', (socket) => {
    socket.on('generate:start', async (data) => {
      const { prompt, sessionId } = data;
      
      // Stream generation progress
      claudeCode.on('progress', (update) => {
        socket.emit('generate:progress', {
          sessionId,
          ...update,
        });
      });
      
      // Start generation
      const result = await generateWithProgress(prompt);
      socket.emit('generate:complete', result);
    });
  });
}
```

## 📋 Phase 5: UI Implementation

### 5.1 Builder Page
```typescript
// apps/web/app/builder/page.tsx
'use client';

import { useState } from 'react';
import { BuilderPrompt } from '@/components/builder/prompt';
import { GenerationProgress } from '@/components/builder/progress';
import { PreviewFrame } from '@/components/builder/preview';

export default function BuilderPage() {
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>();

  const handleGenerate = async (prompt: string) => {
    setGenerating(true);
    
    const response = await fetch('/api/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
    
    const { previewUrl } = await response.json();
    setPreviewUrl(previewUrl);
    setGenerating(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <BuilderPrompt onGenerate={handleGenerate} />
      {generating && <GenerationProgress />}
      {previewUrl && <PreviewFrame url={previewUrl} />}
    </div>
  );
}
```

### 5.2 Real-time Progress Component
```typescript
// apps/web/components/builder/progress.tsx
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export function GenerationProgress() {
  const [messages, setMessages] = useState<string[]>([]);
  
  useEffect(() => {
    const socket = io();
    
    socket.on('generate:progress', (data) => {
      setMessages(prev => [...prev, data.message]);
    });
    
    return () => socket.disconnect();
  }, []);

  return (
    <div className="bg-gray-900 p-6 rounded-lg">
      <h3 className="text-white mb-4">កំពុងបង្កើត...</h3>
      <div className="space-y-2">
        {messages.map((msg, i) => (
          <div key={i} className="text-gray-400 text-sm">
            {msg}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 🧪 Testing Strategy

### 6.1 Unit Tests
```typescript
// tests/claude-code/client.test.ts
describe('ClaudeCodeClient', () => {
  it('should generate a basic HTML project', async () => {
    const client = new ClaudeCodeClient(mockApiKey);
    const result = await client.generateProject({
      prompt: 'Create a tic-tac-toe game',
      projectType: 'html',
    });
    
    expect(result.files).toContain('index.html');
    expect(result.success).toBe(true);
  });
});
```

### 6.2 Integration Tests
```typescript
// tests/integration/generation.test.ts
describe('Code Generation E2E', () => {
  it('should create sandbox and deploy generated code', async () => {
    const response = await request(app)
      .post('/api/generate')
      .send({
        prompt: 'Create a todo app',
        projectType: 'nextjs',
      });
      
    expect(response.status).toBe(200);
    expect(response.body.previewUrl).toMatch(/^https:\/\//);
  });
});
```

### 6.3 E2E Tests
```typescript
// tests/e2e/builder.spec.ts
import { test, expect } from '@playwright/test';

test('complete generation flow', async ({ page }) => {
  await page.goto('/builder');
  
  // Enter prompt
  await page.fill('[data-testid="prompt-input"]', 'Create a blog');
  await page.click('[data-testid="generate-button"]');
  
  // Wait for preview
  await expect(page.locator('iframe')).toBeVisible({ timeout: 60000 });
  
  // Verify preview loads
  const frame = page.frameLocator('iframe');
  await expect(frame.locator('h1')).toContainText('Blog');
});
```

## 🚀 Deployment Plan

### 7.1 Infrastructure Requirements
- **Vercel/Railway**: For Next.js frontend
- **Docker Registry**: For Claude Code sandbox images
- **Redis**: For session management and queuing
- **PostgreSQL**: Extended schema for projects

### 7.2 Environment Variables
```bash
# Production
ANTHROPIC_API_KEY=sk-ant-...
DAYTONA_API_KEY=daytona_...
REDIS_URL=redis://...
DATABASE_URL=postgresql://...
NEXT_PUBLIC_API_URL=https://api.prahok.dev
```

### 7.3 CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy Prahok
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm test
      - run: npm run test:e2e

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: docker build -t prahok/claude-code docker/claude-code
      - run: docker push prahok/claude-code
      - run: vercel deploy --prod
```

## 📊 Success Metrics

1. **Code Generation Success Rate**: >90%
2. **Average Generation Time**: <60 seconds
3. **Sandbox Spin-up Time**: <10 seconds
4. **User Satisfaction**: >4.5/5 stars
5. **Cost per Generation**: <$0.50

## 🔒 Security Considerations

1. **API Key Management**: Use environment variables, never commit
2. **Sandbox Isolation**: Each project runs in isolated Docker container
3. **Rate Limiting**: Max 10 generations per user per hour
4. **Input Validation**: Sanitize all user prompts
5. **Resource Limits**: CPU/Memory caps on sandboxes

## 📝 Next Steps

1. Start with Phase 1: Setup project structure and dependencies
2. Implement minimal viable generation function
3. Test with simple HTML projects first
4. Gradually add complexity (React, Next.js)
5. Integrate Daytona after core generation works
6. Polish UI and add real-time features
7. Deploy MVP and gather feedback