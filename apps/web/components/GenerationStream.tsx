"use client";

import { useState, useEffect, useRef } from "react";

interface StreamMessage {
  type: 'status' | 'system' | 'message' | 'file' | 'complete' | 'error';
  data: any;
}

interface GenerationStreamProps {
  prompt: string;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
}

export function GenerationStream({ prompt, onComplete, onError }: GenerationStreamProps) {
  const [messages, setMessages] = useState<StreamMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!prompt || !isGenerating) return;

    const abortController = new AbortController();
    
    // Send the prompt and stream the response
    fetch('/api/generate/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
      signal: abortController.signal,
    }).then(async response => {
      if (!response.ok) {
        throw new Error('Failed to start generation');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              setMessages(prev => [...prev, data]);

              // Handle different message types
              if (data.type === 'file') {
                setGeneratedFiles(prev => [...prev, data.data.path]);
              } else if (data.type === 'complete') {
                setIsGenerating(false);
                if (onComplete) {
                  onComplete(data.data);
                }
              } else if (data.type === 'error') {
                setIsGenerating(false);
                if (onError) {
                  onError(data.data.message);
                }
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
    }).catch(error => {
      console.error('Stream error:', error);
      setIsGenerating(false);
      if (onError) {
        onError(error.message);
      }
    });

    return () => {
      abortController.abort();
    };
  }, [prompt, isGenerating, onComplete, onError]);

  const startGeneration = () => {
    setMessages([]);
    setGeneratedFiles([]);
    setIsGenerating(true);
  };

  return (
    <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white font-khmer">ដំណើរការបង្កើតកូដ</h3>
        {!isGenerating && messages.length === 0 && (
          <button
            onClick={startGeneration}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all"
          >
            ចាប់ផ្តើមបង្កើត
          </button>
        )}
      </div>

      {/* Messages Stream */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {messages.map((msg, index) => (
          <div key={index} className="animate-fadeIn">
            {msg.type === 'status' && (
              <div className="flex items-center gap-3 text-white/70">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-khmer">{msg.data.message}</span>
              </div>
            )}

            {msg.type === 'system' && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <div className="text-blue-300 text-sm font-khmer">{msg.data.message}</div>
                {msg.data.tools && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {msg.data.tools.slice(0, 5).map((tool: string) => (
                      <span key={tool} className="text-xs bg-blue-500/20 px-2 py-1 rounded text-blue-200">
                        {tool}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {msg.type === 'message' && (
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-white/80 text-sm font-khmer leading-relaxed">
                  {msg.data.content}
                </p>
              </div>
            )}

            {msg.type === 'file' && (
              <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-green-300 text-sm font-khmer">{msg.data.message}</span>
                <code className="text-green-200 text-xs bg-green-500/20 px-2 py-1 rounded">
                  {msg.data.path}
                </code>
              </div>
            )}

            {msg.type === 'complete' && (
              <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-lg p-4">
                <div className="text-green-300 font-semibold font-khmer mb-2">
                  {msg.data.message}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-white/60">ឯកសារបានបង្កើត:</span>
                    <span className="text-white ml-2">{msg.data.filesGenerated.length}</span>
                  </div>
                  <div>
                    <span className="text-white/60">រយៈពេល:</span>
                    <span className="text-white ml-2">{(msg.data.duration / 1000).toFixed(1)}s</span>
                  </div>
                </div>
              </div>
            )}

            {msg.type === 'error' && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-red-300 font-khmer">{msg.data.message}</p>
              </div>
            )}
          </div>
        ))}
        
        {isGenerating && (
          <div className="flex items-center gap-3 text-white/50">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
            </div>
            <span className="text-sm font-khmer">AI កំពុងគិត...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Generated Files Summary */}
      {generatedFiles.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <h4 className="text-sm font-semibold text-white/80 mb-2 font-khmer">ឯកសារដែលបានបង្កើត:</h4>
          <div className="grid grid-cols-1 gap-2">
            {generatedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <span className="text-green-400">✓</span>
                <code className="text-white/70">{file}</code>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}