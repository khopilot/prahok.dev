/**
 * Test script for Node.js wrapper
 */

import { generateCode, generateCodeDirect } from './lib/claude-code/core-generator-node';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testNodeWrapper() {
  console.log('🧪 Testing Node.js wrapper for Claude Code SDK...\n');

  // Check API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY is not set in .env.local');
    process.exit(1);
  }
  console.log('✅ API key found:', apiKey.substring(0, 10) + '...');

  // Test 1: Using nodeQuery wrapper
  console.log('\n📝 Test 1: Using nodeQuery wrapper...');
  try {
    const result1 = await generateCode({
      prompt: 'Create a simple hello world component in React',
      maxTurns: 1,
      onMessage: (msg) => {
        console.log('Message type:', msg.type);
      }
    });
    
    console.log('✅ Test 1 Result:', {
      success: result1.success,
      messagesCount: result1.messages.length,
      filesCount: result1.files.length,
      error: result1.error
    });
  } catch (error) {
    console.error('❌ Test 1 failed:', error);
  }

  // Test 2: Using direct query with runtime patch
  console.log('\n📝 Test 2: Using direct query with runtime patch...');
  try {
    const result2 = await generateCodeDirect({
      prompt: 'Create a simple button component',
      maxTurns: 1,
      onMessage: (msg) => {
        console.log('Message type:', msg.type);
      }
    });
    
    console.log('✅ Test 2 Result:', {
      success: result2.success,
      messagesCount: result2.messages.length,
      filesCount: result2.files.length,
      error: result2.error
    });
  } catch (error) {
    console.error('❌ Test 2 failed:', error);
  }
}

// Run tests
testNodeWrapper().catch(console.error);