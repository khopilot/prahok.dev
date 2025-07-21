#!/usr/bin/env node

/**
 * Test script for core code generation functionality
 * This will test our Claude Code integration by generating a simple Tic-Tac-Toe game
 */

import { generateSimpleProject } from './lib/claude-code/core-generator';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(__dirname, '.env.local') });

async function testCodeGeneration() {
  console.log('🧪 Testing Core Code Generation Function');
  console.log('=====================================\n');

  // Test prompt: Simple HTML Tic-Tac-Toe game
  const testPrompt = `
Create a simple Tic-Tac-Toe game in HTML. Requirements:
- Single HTML file with embedded CSS and JavaScript
- Clean, modern design
- Functional game logic
- Player vs Player (X and O)
- Win detection
- Reset button
- Responsive design

Make it visually appealing with modern CSS styling.
Save it as "tic-tac-toe.html"
`;

  console.log('📝 Test Prompt:');
  console.log(testPrompt);
  console.log('\n🚀 Starting generation...\n');

  try {
    const result = await generateSimpleProject(testPrompt);

    console.log('\n📊 Generation Results:');
    console.log('====================');
    console.log(`✅ Success: ${result.success}`);
    console.log(`🆔 Session ID: ${result.sessionId}`);
    console.log(`⏱️  Execution Time: ${result.executionTime}ms`);
    console.log(`📨 Messages Count: ${result.messages.length}`);
    
    if (result.generatedFiles && result.generatedFiles.length > 0) {
      console.log(`📁 Generated Files: ${result.generatedFiles.join(', ')}`);
    }

    if (result.error) {
      console.log(`❌ Error: ${result.error}`);
    }

    // Display detailed messages in development
    if (process.env.NODE_ENV === 'development' && result.messages.length > 0) {
      console.log('\n🔍 Detailed Messages:');
      console.log('=====================');
      
      result.messages.forEach((message, index) => {
        console.log(`\n${index + 1}. Type: ${message.type}`);
        
        // Show relevant content without overwhelming output
        if (message.type === 'assistant') {
          console.log('   💬 Claude response');
        } else if (message.type === 'result') {
          console.log('   ✅ Result');
        }
      });
    }

    // Success summary
    if (result.success) {
      console.log('\n🎉 Test Completed Successfully!');
      console.log('================================');
      console.log('✅ Core generation function is working');
      console.log('✅ Claude Code SDK integration successful');
      console.log('✅ File permissions configured correctly');
      
      if (result.generatedFiles && result.generatedFiles.includes('tic-tac-toe.html')) {
        console.log('✅ Test file (tic-tac-toe.html) generated');
        console.log('\n💡 You can now open tic-tac-toe.html in your browser to test the game!');
      }
    } else {
      console.log('\n❌ Test Failed');
      console.log('===============');
      console.log('The core generation function encountered an error.');
      console.log('Please check the error details above and fix the issues.');
    }

  } catch (error) {
    console.error('\n💥 Unexpected Error During Test:');
    console.error('=================================');
    console.error(error);
    
    // Provide debugging guidance
    console.log('\n🔧 Debugging Steps:');
    console.log('1. Verify ANTHROPIC_API_KEY is set in .env.local');
    console.log('2. Check internet connection');
    console.log('3. Ensure Claude Code SDK is properly installed');
    console.log('4. Review file permissions in current directory');
  }
}

// Run the test
if (require.main === module) {
  testCodeGeneration().catch(console.error);
}

export { testCodeGeneration };