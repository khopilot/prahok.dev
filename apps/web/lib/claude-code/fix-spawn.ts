/**
 * Fix for Claude Code SDK spawn issue in Next.js environment
 * This module patches the child_process.spawn to handle bun correctly
 */

import { spawn as originalSpawn } from 'child_process';
import * as childProcess from 'child_process';

// Store the original spawn function
const _originalSpawn = originalSpawn;

// Create a patched spawn function
const patchedSpawn: typeof originalSpawn = function(command, args?, options?) {
  // If trying to spawn bun, force using node instead
  if (command === 'bun') {
    console.log('[Claude Code Fix] Intercepting bun spawn, using node instead');
    command = 'node';
    
    // Ensure node is in the PATH by adding common locations
    if (options && typeof options === 'object' && 'env' in options) {
      const env = options.env as any;
      if (env.PATH && !env.PATH.includes('/opt/homebrew/opt/node')) {
        env.PATH = `/opt/homebrew/opt/node@20/bin:/usr/local/bin:/usr/bin:${env.PATH}`;
      }
    } else if (options && typeof options === 'object') {
      // Add env with PATH if not present
      (options as any).env = {
        ...process.env,
        PATH: `/opt/homebrew/opt/node@20/bin:/usr/local/bin:/usr/bin:${process.env.PATH}`,
      };
    }
  }
  
  // Call original spawn with potentially modified command
  return _originalSpawn.call(this, command, args, options);
} as any;

// Patch the child_process module
(childProcess as any).spawn = patchedSpawn;

// Also patch the default export if it exists
if (childProcess.default) {
  (childProcess.default as any).spawn = patchedSpawn;
}

// Export a confirmation that patching is done
export const SPAWN_PATCHED = true;

console.log('[Claude Code Fix] child_process.spawn has been patched to handle bun issues');