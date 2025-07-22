/**
 * Fix for Claude Code SDK spawn issues
 * This module provides a wrapper to handle bun spawn issues
 */

import { spawn as originalSpawn, SpawnOptions, ChildProcess } from 'child_process';

// Create a spawn wrapper that intercepts bun calls
export function spawn(
  command: string,
  args?: readonly string[],
  options?: SpawnOptions
): ChildProcess {
  // If trying to spawn bun, use node instead
  if (command === 'bun') {
    console.log('[Claude Code Fix] Intercepting bun spawn, using node instead');
    command = 'node';
    
    // Ensure node is in the PATH
    if (options?.env) {
      const env = { ...options.env };
      if (!env.PATH?.includes('/opt/homebrew/opt/node')) {
        env.PATH = `/opt/homebrew/opt/node@20/bin:/usr/local/bin:/usr/bin:${env.PATH || process.env.PATH}`;
      }
      options = { ...options, env };
    }
  }
  
  // Call original spawn with the potentially modified command
  if (args && options) {
    return originalSpawn(command, args, options);
  } else if (args) {
    return originalSpawn(command, args);
  } else {
    return originalSpawn(command);
  }
}

// Export a function to patch the global child_process module
export function patchChildProcess() {
  const cp = require('child_process');
  const original = cp.spawn;
  
  cp.spawn = function(...args: any[]) {
    const [command, ...rest] = args;
    
    if (command === 'bun') {
      console.log('[Claude Code Fix] Global patch: Intercepting bun spawn');
      args[0] = 'node';
      
      // Fix PATH in options if present
      const optionsIndex = rest.length === 2 ? 1 : rest.length === 1 && !Array.isArray(rest[0]) ? 0 : -1;
      if (optionsIndex >= 0 && rest[optionsIndex]?.env) {
        const env = rest[optionsIndex].env;
        if (!env.PATH?.includes('/opt/homebrew/opt/node')) {
          env.PATH = `/opt/homebrew/opt/node@20/bin:/usr/local/bin:/usr/bin:${env.PATH || process.env.PATH}`;
        }
      }
    }
    
    return original.apply(this, args);
  };
  
  console.log('[Claude Code Fix] child_process.spawn patched globally');
}

// Auto-patch on import
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  patchChildProcess();
}

export function ensureSpawnPatch() {
  // This function ensures the patch is applied
  console.log('[Claude Code Fix] Spawn patch is active');
  patchChildProcess();
}