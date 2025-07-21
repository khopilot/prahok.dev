import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Simple test to check if Claude Code SDK can use the API key
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        error: "ANTHROPIC_API_KEY not found in environment",
        env: process.env.NODE_ENV,
      });
    }

    // Try a simple API call
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    });

    const result = await response.text();
    const isValid = response.ok;

    return NextResponse.json({
      apiKeyFound: true,
      apiKeyFirst10: apiKey.substring(0, 10),
      apiKeyLength: apiKey.length,
      apiTestResult: isValid ? 'Valid' : 'Invalid',
      statusCode: response.status,
      error: !isValid ? result : null,
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}