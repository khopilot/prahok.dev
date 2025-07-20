import { NextRequest } from "next/server";
import { query, type SDKMessage } from "@anthropic-ai/claude-code";

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sessionId = crypto.randomUUID();
        const abortController = new AbortController();
        
        // Send initial status
        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({
            type: 'status',
            data: { 
              sessionId,
              status: 'starting',
              message: 'កំពុងចាប់ផ្តើមបង្កើតកូដ...' 
            }
          })}\n\n`
        ));

        try {
          const messages: SDKMessage[] = [];
          const generatedFiles: string[] = [];
          let messageCount = 0;

          // Enhanced prompt with better instructions
          const enhancedPrompt = `
${prompt}

CRITICAL INSTRUCTIONS:
- You MUST create actual files using the Write tool
- Add comments in Khmer (ភាសាខ្មែរ) where appropriate
- Make the code production-ready and beautiful
- Use modern best practices
- Explain what you're doing in a friendly way

Project: ${sessionId}
`;

          // Stream messages from Claude Code
          for await (const message of query({
            prompt: enhancedPrompt,
            abortController,
            options: {
              maxTurns: 5,
              permissionMode: 'bypassPermissions',
              cwd: process.cwd(),
            }
          })) {
            messages.push(message);
            messageCount++;

            // Format and send different types of updates
            if (message.type === 'system' && 'subtype' in message && message.subtype === 'init') {
              controller.enqueue(encoder.encode(
                `data: ${JSON.stringify({
                  type: 'system',
                  data: {
                    message: 'ប្រព័ន្ធត្រៀមរួចរាល់ 🚀',
                    tools: (message as any).tools || [],
                    model: (message as any).model
                  }
                })}\n\n`
              ));
            } else if (message.type === 'assistant') {
              const content = extractReadableContent(message);
              const files = extractFilesFromMessage(message);
              
              // Send readable message
              if (content) {
                controller.enqueue(encoder.encode(
                  `data: ${JSON.stringify({
                    type: 'message',
                    data: {
                      content: formatMessageForUser(content),
                      raw: content,
                      messageNumber: messageCount
                    }
                  })}\n\n`
                ));
              }

              // Send file creation updates
              for (const file of files) {
                if (!generatedFiles.includes(file)) {
                  generatedFiles.push(file);
                  controller.enqueue(encoder.encode(
                    `data: ${JSON.stringify({
                      type: 'file',
                      data: {
                        path: file,
                        action: 'created',
                        message: `បានបង្កើតឯកសារ: ${file} ✨`
                      }
                    })}\n\n`
                  ));
                }
              }
            } else if (message.type === 'result') {
              const resultMsg = message as any;
              controller.enqueue(encoder.encode(
                `data: ${JSON.stringify({
                  type: 'complete',
                  data: {
                    success: !resultMsg.is_error,
                    duration: resultMsg.duration_ms,
                    filesGenerated: generatedFiles,
                    messageCount: messages.length,
                    message: resultMsg.is_error 
                      ? 'មានបញ្ហាក្នុងការបង្កើតកូដ 😞' 
                      : 'បានបង្កើតកូដដោយជោគជ័យ! 🎉'
                  }
                })}\n\n`
              ));
            }
          }

        } catch (error: any) {
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({
              type: 'error',
              data: {
                error: error.message || 'Unknown error',
                message: 'សូមអភ័យទោស មានបញ្ហាក្នុងការបង្កើតកូដ 😔'
              }
            })}\n\n`
          ));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Stream error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Internal server error" 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// Extract readable content from Claude's messages
function extractReadableContent(message: any): string {
  if (typeof message.content === 'string') {
    return message.content;
  }
  
  if (Array.isArray(message.content)) {
    const textParts: string[] = [];
    
    for (const block of message.content) {
      if (block.type === 'text') {
        textParts.push(block.text);
      } else if (block.type === 'tool_use') {
        // Add friendly tool usage messages
        if (block.name === 'Write') {
          textParts.push(`📝 កំពុងសរសេរឯកសារ...`);
        } else if (block.name === 'Read') {
          textParts.push(`📖 កំពុងអានឯកសារ...`);
        } else {
          textParts.push(`🔧 កំពុងប្រើឧបករណ៍ ${block.name}...`);
        }
      }
    }
    
    return textParts.join('\n');
  }
  
  return '';
}

// Extract file paths from messages
function extractFilesFromMessage(message: any): string[] {
  const files: string[] = [];
  
  if (message.content && Array.isArray(message.content)) {
    for (const block of message.content) {
      if (block.type === 'tool_use' && block.name === 'Write') {
        if (block.input?.file_path) {
          files.push(block.input.file_path);
        }
      }
    }
  }
  
  return files;
}

// Format technical messages into user-friendly Khmer
function formatMessageForUser(content: string): string {
  // Remove overly technical jargon
  let formatted = content
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`[^`]+`/g, (match) => `**${match.slice(1, -1)}**`) // Format inline code
    .trim();

  // Translate common technical phrases to Khmer
  const translations: Record<string, string> = {
    'Creating': 'កំពុងបង្កើត',
    'Writing': 'កំពុងសរសេរ',
    'Generating': 'កំពុងបង្កើត',
    'file': 'ឯកសារ',
    'code': 'កូដ',
    'function': 'មុខងារ',
    'component': 'សមាសភាគ',
    'Complete': 'បានបញ្ចប់',
    'Done': 'រួចរាល់',
    'Error': 'កំហុស',
    'Warning': 'ការព្រមាន',
  };

  for (const [eng, khm] of Object.entries(translations)) {
    formatted = formatted.replace(new RegExp(eng, 'gi'), khm);
  }

  // Make it more conversational
  if (formatted.length > 0 && !formatted.match(/[។!?]$/)) {
    formatted += ' ។';
  }

  return formatted;
}