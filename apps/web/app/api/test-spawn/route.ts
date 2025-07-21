import { NextRequest, NextResponse } from "next/server";
import { spawn } from 'child_process';

export async function GET(request: NextRequest) {
  const results: any = {
    env: {
      PATH: process.env.PATH,
      CLAUDE_CODE_RUNTIME: process.env.CLAUDE_CODE_RUNTIME,
      NODE_ENV: process.env.NODE_ENV,
    },
    tests: {}
  };

  // Test 1: Try to spawn node
  try {
    await new Promise((resolve, reject) => {
      const nodeProc = spawn('node', ['--version']);
      let output = '';
      nodeProc.stdout.on('data', (data) => { output += data.toString(); });
      nodeProc.on('close', (code) => {
        if (code === 0) {
          results.tests.node = { success: true, version: output.trim() };
          resolve(true);
        } else {
          reject(new Error(`Node exited with code ${code}`));
        }
      });
      nodeProc.on('error', reject);
    });
  } catch (error: any) {
    results.tests.node = { success: false, error: error.message };
  }

  // Test 2: Try to spawn bun
  try {
    await new Promise((resolve, reject) => {
      const bunProc = spawn('bun', ['--version']);
      let output = '';
      bunProc.stdout.on('data', (data) => { output += data.toString(); });
      bunProc.on('close', (code) => {
        if (code === 0) {
          results.tests.bun = { success: true, version: output.trim() };
          resolve(true);
        } else {
          reject(new Error(`Bun exited with code ${code}`));
        }
      });
      bunProc.on('error', reject);
    });
  } catch (error: any) {
    results.tests.bun = { success: false, error: error.message };
  }

  // Test 3: Try to spawn with full path
  try {
    await new Promise((resolve, reject) => {
      const bunProc = spawn('/Users/niko/.bun/bin/bun', ['--version']);
      let output = '';
      bunProc.stdout.on('data', (data) => { output += data.toString(); });
      bunProc.on('close', (code) => {
        if (code === 0) {
          results.tests.bunFullPath = { success: true, version: output.trim() };
          resolve(true);
        } else {
          reject(new Error(`Bun (full path) exited with code ${code}`));
        }
      });
      bunProc.on('error', reject);
    });
  } catch (error: any) {
    results.tests.bunFullPath = { success: false, error: error.message };
  }

  // Test 4: Check if we can access Claude Code SDK
  try {
    require.resolve('@anthropic-ai/claude-code');
    results.tests.claudeCodeSDK = { success: true, found: true };
  } catch (error: any) {
    results.tests.claudeCodeSDK = { success: false, error: error.message };
  }

  return NextResponse.json(results);
}