import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { query, type SDKMessage } from '@anthropic-ai/claude-code';
import winston from 'winston';
import jwt from 'jsonwebtoken';

const logger = winston.createLogger({
  transports: [new winston.transports.Console()]
});

interface GenerationRequest {
  prompt: string;
  sessionId: string;
  userId: string;
}

interface GenerationUpdate {
  type: 'status' | 'message' | 'file' | 'error' | 'complete';
  data: any;
  timestamp: string;
}

export function setupGenerationSocket(server: HTTPServer) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      socket.data.userId = decoded.userId;
      socket.data.email = decoded.email;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`WebSocket connected: ${socket.id} (User: ${socket.data.email})`);

    socket.on('start-generation', async (request: GenerationRequest) => {
      const { prompt, sessionId } = request;
      const roomId = `generation-${sessionId}`;
      
      // Join room for this generation session
      socket.join(roomId);
      
      // Send initial status
      const sendUpdate = (update: GenerationUpdate) => {
        io.to(roomId).emit('generation-update', update);
      };

      sendUpdate({
        type: 'status',
        data: { 
          status: 'starting', 
          message: 'កំពុងចាប់ផ្តើមបង្កើតកូដ...' 
        },
        timestamp: new Date().toISOString()
      });

      try {
        const abortController = new AbortController();
        const messages: SDKMessage[] = [];
        const generatedFiles: string[] = [];
        
        // Store abort controller for potential cancellation
        socket.data.abortController = abortController;

        // Enhanced prompt with Khmer context
        const enhancedPrompt = `
${prompt}

IMPORTANT: Generate working code with these requirements:
- Create actual files using the Write tool
- Include comments in Khmer where appropriate
- Make the code production-ready
- Use modern best practices
- If creating a web app, make it responsive and beautiful

Session ID: ${sessionId}
Timestamp: ${new Date().toISOString()}
`;

        // Stream messages from Claude Code
        for await (const message of query({
          prompt: enhancedPrompt,
          abortController,
          options: {
            maxTurns: 5,
            permissionMode: 'bypassPermissions',
            cwd: `/tmp/prahok-projects/${sessionId}`,
          }
        })) {
          messages.push(message);
          
          // Send different types of updates based on message type
          if (message.type === 'assistant') {
            sendUpdate({
              type: 'message',
              data: {
                role: 'assistant',
                content: extractMessageContent(message),
                messageType: message.type
              },
              timestamp: new Date().toISOString()
            });

            // Check for file creation
            const files = extractFilesFromMessage(message);
            for (const file of files) {
              if (!generatedFiles.includes(file)) {
                generatedFiles.push(file);
                sendUpdate({
                  type: 'file',
                  data: {
                    path: file,
                    action: 'created'
                  },
                  timestamp: new Date().toISOString()
                });
              }
            }
          } else if (message.type === 'system') {
            sendUpdate({
              type: 'status',
              data: {
                status: 'system',
                message: 'ប្រព័ន្ធកំពុងដំណើរការ...'
              },
              timestamp: new Date().toISOString()
            });
          }
        }

        // Send completion status
        sendUpdate({
          type: 'complete',
          data: {
            success: true,
            filesGenerated: generatedFiles,
            messageCount: messages.length,
            message: 'បានបង្កើតកូដដោយជោគជ័យ!'
          },
          timestamp: new Date().toISOString()
        });

      } catch (error: any) {
        logger.error('Generation error:', error);
        sendUpdate({
          type: 'error',
          data: {
            error: error.message || 'មានបញ្ហាក្នុងការបង្កើតកូដ',
            details: error.stack
          },
          timestamp: new Date().toISOString()
        });
      }
    });

    socket.on('cancel-generation', () => {
      if (socket.data.abortController) {
        socket.data.abortController.abort();
        logger.info(`Generation cancelled by user ${socket.data.email}`);
      }
    });

    socket.on('disconnect', () => {
      logger.info(`WebSocket disconnected: ${socket.id}`);
      if (socket.data.abortController) {
        socket.data.abortController.abort();
      }
    });
  });

  return io;
}

function extractMessageContent(message: any): string {
  if (typeof message.content === 'string') {
    return message.content;
  }
  
  if (Array.isArray(message.content)) {
    return message.content
      .map((block: any) => {
        if (block.type === 'text') {
          return block.text;
        }
        return '';
      })
      .join('\n');
  }
  
  return '';
}

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