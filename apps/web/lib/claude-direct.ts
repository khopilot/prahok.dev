// Alternative implementation using Anthropic SDK directly
export async function generateWithClaude(prompt: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not found');
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: `You are a web developer. ${prompt}. 
          
          Generate the code for this request. For HTML projects, create a single index.html file. 
          For Next.js projects, create the necessary files.
          
          Return the code in a structured format with file paths and content.`
        }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return {
      success: true,
      content: data.content[0].text,
      usage: data.usage,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}