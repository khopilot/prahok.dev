# Prahok.dev - Documentation Complète pour Claude Code

## Vue d'ensemble du projet
Prahok.dev est une plateforme de génération de code assistée par IA, inspirée de Lovable.dev, conçue spécifiquement pour les développeurs khmers.

## Architecture et pile technologique

### Monorepo Structure
```
prahok.dev/
├── apps/
│   ├── api/          # Backend API (Node.js, Express, Prisma)
│   └── web/          # Frontend (Next.js 14, TypeScript, Tailwind)
├── packages/         # Shared packages
└── docker/          # Docker configurations
```

### Technologies principales
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, Prisma ORM
- **Base de données**: PostgreSQL
- **Cache**: Redis
- **IA**: Claude Code SDK (@anthropic-ai/claude-code)
- **Sandboxes**: Daytona SDK
- **Authentification**: JWT avec cookies

## Modèles architecturaux

### Flux de génération de code
1. L'utilisateur entre un prompt dans l'éditeur
2. Le système tente d'abord la génération avec sandbox (Daytona)
3. Si échec, fallback vers génération locale
4. Les fichiers générés sont stockés et prévisualisés

### API Routes critiques
- `/api/generate/sandbox` - Génération avec sandbox Daytona
- `/api/generate/local` - Génération locale (fallback)
- `/api/projects` - CRUD pour les projets
- `/api/auth/*` - Authentification

## Solutions aux bugs courants

### 🐛 Erreur 500: "Failed to spawn Claude Code process: spawn bun ENOENT"

**Symptômes**:
- API `/api/generate/sandbox` retourne 500
- Message d'erreur: "Failed to spawn Claude Code process: spawn bun ENOENT"
- Le sandbox Daytona est créé avec succès mais l'erreur survient lors de l'utilisation de Claude Code SDK

**Cause racine**:
Le Claude Code SDK essaie d'utiliser `bun` (un runtime JavaScript) qui n'est pas dans le PATH de l'environnement Next.js, même s'il est installé sur le système.

**Solutions appliquées**:

1. **Configuration d'environnement** (`/lib/claude-code/sdk-env.ts`):
```typescript
process.env.CLAUDE_CODE_RUNTIME = 'node';
process.env.BUN_RUNTIME = 'false';
process.env.CLAUDE_SDK_RUNTIME = 'node';
process.env.ANTHROPIC_SDK_RUNTIME = 'node';
```

2. **Ajout du PATH bun** dans les scripts de génération:
```typescript
if (!process.env.PATH?.includes('/.bun/bin')) {
  process.env.PATH = `/Users/niko/.bun/bin:${process.env.PATH}`;
}
```

3. **Import du configurateur** avant tout import Claude Code:
```typescript
import '@/lib/load-env';
import '@/lib/claude-code/sdk-env';
// Puis les imports Claude Code
```

**Solution de contournement active**:
Utilisation automatique de la génération locale (`/api/generate/local`) comme fallback quand le sandbox échoue.

### 🐛 Erreur 401: "JWT secret or public key must be provided"

**Symptômes**:
- Erreurs 401 sur les endpoints protégés
- Message: "secret or public key must be provided"

**Cause**:
`JWT_SECRET` n'est pas défini dans l'environnement frontend (Next.js)

**Solution**:
Le JWT_SECRET doit être dans le backend uniquement. Les routes API qui vérifient les tokens doivent gérer gracieusement l'absence de token.

### 🐛 TypeError: "Cannot read properties of undefined (reading 'substring')"

**Symptômes**:
- Erreur dans SandboxPreview component
- Page crash quand workspaceId est undefined

**Solution appliquée**:
```typescript
Workspace: {workspaceId ? `${workspaceId.substring(0, 8)}...` : 'N/A'}
```

## Conventions de code

### Structure des composants React
```typescript
// Imports
import { useState, useEffect } from 'react';
import { ComponentProps } from './types';

// Interface/Types
interface Props {
  // ...
}

// Component
export function ComponentName({ prop1, prop2 }: Props) {
  // State
  const [state, setState] = useState();
  
  // Effects
  useEffect(() => {
    // ...
  }, []);
  
  // Handlers
  const handleClick = () => {
    // ...
  };
  
  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### Gestion d'erreurs API
```typescript
try {
  // Operation
} catch (error) {
  console.error('Context:', error);
  return NextResponse.json(
    { 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? {
        stack: error instanceof Error ? error.stack : undefined,
      } : undefined
    },
    { status: 500 }
  );
}
```

## Configuration de l'environnement

### Variables d'environnement requises

**Frontend (`apps/web/.env.local`)**:
```env
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
ANTHROPIC_API_KEY="sk-ant-api..."
DAYTONA_API_KEY="dtn_..."
DAYTONA_API_URL="https://app.daytona.io/api"
```

**Backend (`apps/api/.env`)**:
```env
DATABASE_URL="postgresql://..."
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secret"
PORT=5000
```

## Workflows de débogage

### Debug de l'erreur 500 sur génération
1. Vérifier les logs du serveur Next.js
2. Confirmer que les variables d'environnement sont chargées
3. Tester d'abord `/api/test-generate` pour isoler le problème
4. Si bun error, vérifier PATH et utiliser fallback local
5. Vérifier les crédits Daytona si sandbox échoue

### Debug de l'authentification
1. Vérifier que le backend est lancé (port 5000)
2. Confirmer que les cookies sont définis correctement
3. Vérifier les intercepteurs axios dans `/lib/api.ts`
4. Tester avec la page `/test-auth`

## Commandes utiles

### Développement
```bash
# Lancer tout
npm run dev

# Lancer séparément
cd apps/api && npm run dev
cd apps/web && npm run dev

# Build production
./build.sh

# Déploiement
./deploy.sh production all
```

### Tests API
```bash
# Test génération locale
curl -X POST http://localhost:3000/api/generate/local \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create a hello world page"}'

# Test sandbox
curl -X POST http://localhost:3000/api/generate/sandbox \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create a website"}'
```

## Intégrations externes

### Daytona SDK
- **Statut**: Partiellement fonctionnel
- **Problèmes**: Command execution non disponible, état sandbox
- **Alternative**: Génération locale comme fallback

### Claude Code SDK  
- **Statut**: Fonctionnel avec configuration
- **Problème principal**: Tentative d'utilisation de bun
- **Solution**: Forcer Node.js runtime

## Notes pour l'amélioration future

1. **Implémenter un vrai système de fichiers** pour la génération locale au lieu de localStorage
2. **Ajouter des webhooks Daytona** pour le statut en temps réel
3. **Implémenter un système de queue** pour les générations
4. **Ajouter des métriques et monitoring** (Sentry, etc.)
5. **Optimiser la gestion des tokens Claude** pour réduire les coûts

---
*Ce document est maintenu pour faciliter le contexte de Claude Code. Mettre à jour après chaque résolution de bug majeur.*