/**
 * Proxy module for Claude Code SDK to force Node.js runtime
 * This module sets environment variables to ensure Node.js is used
 */

import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

/**
 * Create a shim for the bun command that redirects to node
 */
function createBunShim() {
  try {
    // Create a temporary directory for our shim
    const shimDir = path.join(os.tmpdir(), 'claude-sdk-shim');
    if (!fs.existsSync(shimDir)) {
      fs.mkdirSync(shimDir, { recursive: true });
    }
    
    // Create a bun shim that redirects to node
    const bunShimPath = path.join(shimDir, 'bun');
    const shimContent = `#!/bin/bash
# Shim to redirect bun calls to node
exec node "$@"
`;
    
    fs.writeFileSync(bunShimPath, shimContent);
    fs.chmodSync(bunShimPath, '755');
    
    // Prepend shim directory to PATH
    process.env.PATH = `${shimDir}:${process.env.PATH}`;
    
    console.log('[SDK Proxy] Created bun shim at:', bunShimPath);
    
    return bunShimPath;
  } catch (error) {
    console.error('[SDK Proxy] Failed to create bun shim:', error);
  }
}

/**
 * Initialize the proxy settings
 */
function initializeProxy() {
  // Set environment variables to force Node.js
  process.env.CLAUDE_CODE_RUNTIME = 'node';
  process.env.BUN_RUNTIME = 'false';
  process.env.CLAUDE_SDK_RUNTIME = 'node';
  process.env.ANTHROPIC_SDK_RUNTIME = 'node';
  
  // Create bun shim if not disabled
  if (!process.env.DISABLE_BUN_SHIM) {
    createBunShim();
  }
  
  console.log('[SDK Proxy] Initialized with Node.js runtime');
}

// Monkey patch spawn to intercept bun calls
const originalSpawn = spawn;
(global as any).spawn = function(command: string, args?: any[], options?: any) {
  if (command === 'bun' || command.endsWith('/bun')) {
    console.log('[SDK Proxy] Intercepting bun spawn, replacing with node');
    command = 'node';
    
    // Adjust arguments if needed
    if (Array.isArray(args)) {
      args = args.map(arg => {
        // Replace bun-specific flags
        if (arg === '--hot') return '--watch';
        if (arg && arg.startsWith('--bun')) return null;
        return arg;
      }).filter(Boolean);
    }
  }
  
  return originalSpawn(command, args, options);
};

// Also patch child_process.spawn
const cp = require('child_process');
if (cp && cp.spawn) {
  const originalCpSpawn = cp.spawn;
  cp.spawn = function(command: string, args?: any[], options?: any) {
    if (command === 'bun' || command.endsWith('/bun')) {
      console.log('[SDK Proxy] Intercepting bun spawn via child_process, replacing with node');
      command = 'node';
      
      if (Array.isArray(args)) {
        args = args.map(arg => {
          if (arg === '--hot') return '--watch';
          if (arg && arg.startsWith('--bun')) return null;
          return arg;
        }).filter(Boolean);
      }
    }
    
    return originalCpSpawn(command, args, options);
  };
}

// Auto-initialize on import
initializeProxy();

// Export for explicit initialization if needed
export { initializeProxy };