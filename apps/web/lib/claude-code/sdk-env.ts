/**
 * Simple environment configuration for Claude Code SDK
 * Forces the SDK to use Node.js runtime instead of bun
 */

// Set environment variables to force Node.js runtime
process.env.CLAUDE_CODE_RUNTIME = 'node';
process.env.BUN_RUNTIME = 'false';
process.env.CLAUDE_SDK_RUNTIME = 'node';
process.env.ANTHROPIC_SDK_RUNTIME = 'node';
process.env.DISABLE_BUN = 'true';
process.env.FORCE_NODE_RUNTIME = 'true';

// Export a simple init function
export function initClaudeSDK() {
  console.log('[Claude SDK] Configured for Node.js runtime');
}

// Auto-initialize
initClaudeSDK();