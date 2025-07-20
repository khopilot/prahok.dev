/**
 * Test script for Claude Code SDK integration
 * Run with: npx tsx lib/claude-code/test.ts
 */

import { ClaudeCodeClient } from './client';

async function testClaudeCodeGeneration() {
  console.log('🧪 Testing Claude Code SDK integration...\n');

  // Check if API key is set
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_anthropic_api_key_here') {
    console.error('❌ Error: Please set ANTHROPIC_API_KEY in .env.local');
    console.log('   Get your API key from: https://console.anthropic.com/');
    process.exit(1);
  }

  try {
    // Initialize client
    const client = new ClaudeCodeClient();
    console.log('✅ Claude Code client initialized');

    // Test 1: Simple HTML generation
    console.log('\n📝 Test 1: Generating simple HTML tic-tac-toe game...');
    const result = await client.generateProject({
      prompt: 'Create a simple tic-tac-toe game with a nice UI',
      projectType: 'html',
      maxTurns: 3,
    });

    if (result.success) {
      console.log('✅ Generation successful!');
      console.log(`   Generated ${result.files.length} files`);
      console.log('   Files:', result.files);
      console.log(`   Output length: ${result.output.length} characters`);
    } else {
      console.error('❌ Generation failed:', result.error);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }

  console.log('\n✅ All tests completed!');
}

// Run the test
testClaudeCodeGeneration().catch(console.error);