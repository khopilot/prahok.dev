// Test direct du SDK Claude Code
import { query } from "@anthropic-ai/claude-code";

async function testClaudeCodeSDK() {
  console.log("🔍 Testing Claude Code SDK...");
  console.log("ANTHROPIC_API_KEY exists:", !!process.env.ANTHROPIC_API_KEY);
  console.log("ANTHROPIC_API_KEY length:", process.env.ANTHROPIC_API_KEY?.length);
  
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("❌ ANTHROPIC_API_KEY is not set!");
    return;
  }

  try {
    const abortController = new AbortController();
    let messageCount = 0;
    
    console.log("📝 Sending test prompt to Claude Code...");
    
    for await (const message of query({
      prompt: "Create a simple hello world HTML file",
      abortController,
      options: {
        maxTurns: 1,
        permissionMode: 'bypassPermissions',
        cwd: process.cwd(),
      }
    })) {
      messageCount++;
      console.log(`Message ${messageCount}:`, message.type);
    }
    
    console.log("✅ Test completed successfully!");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// Run the test
testClaudeCodeSDK();