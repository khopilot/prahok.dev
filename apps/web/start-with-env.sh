#!/bin/bash
# Script pour démarrer Next.js avec les variables d'environnement

# Load .env.local
export $(cat .env.local | grep -v '^#' | xargs)

# Start Next.js
npm run dev