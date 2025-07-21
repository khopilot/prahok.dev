"use client";

import { useState, useEffect } from "react";

interface SandboxPreviewProps {
  workspaceId: string;
  previewUrl: string;
  embedUrl?: string;
  onClose?: () => void;
  generationMessages?: Array<{
    type: string;
    content: string;
    timestamp: string;
  }>;
  isGenerating?: boolean;
}

export function SandboxPreview({ workspaceId, previewUrl, embedUrl, onClose, generationMessages = [], isGenerating = false }: SandboxPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [showFullscreen, setShowFullscreen] = useState(false);
  // Always start with generation view when component mounts
  const [currentView, setCurrentView] = useState<'generation' | 'preview'>('generation');

  useEffect(() => {
    // Simulate loading time for iframe
    const timer = setTimeout(() => setIsLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Reset to generation view when isGenerating becomes true
  useEffect(() => {
    if (isGenerating) {
      setCurrentView('generation');
    }
  }, [isGenerating]);
  
  // Auto switch to preview when generation is complete
  useEffect(() => {
    if (!isGenerating && generationMessages.length > 0 && currentView === 'generation') {
      // Check if we have a success message
      const hasSuccess = generationMessages.some(msg => msg.type === 'success');
      if (hasSuccess) {
        // Give user time to see the success message
        setTimeout(() => setCurrentView('preview'), 2000);
      }
    }
  }, [isGenerating, generationMessages, currentView]);

  return (
    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden">
      {/* Compact Header */}
      <div className="bg-black/40 border-b border-gray-700/50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <h3 className="text-sm font-medium text-white/90">
                {workspaceId === 'generating' ? 'AI កំពុងបង្កើតកូដ' : 'Workspace Preview'}
              </h3>
            </div>
            
            <div className="flex items-center gap-2">
              {currentView === 'preview' && (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  title="បើកក្នុងផ្ទាំងថ្មី"
                >
                  <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
              
              <button
                onClick={() => setShowFullscreen(!showFullscreen)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                title="Fullscreen"
              >
                <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5h-4m4 0v-4m0 4l-5-5" />
                </svg>
              </button>
              
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  title="Close"
                >
                  <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            </div>
          
          {/* Compact View Tabs */}
          <div className="flex gap-1 px-4 pb-2">
            <button
              onClick={() => setCurrentView('generation')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentView === 'generation' 
                  ? 'bg-orange-500/20 text-orange-300' 
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <span>កូដ</span>
              </span>
            </button>
            <button
              onClick={() => setCurrentView('preview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentView === 'preview' 
                  ? 'bg-blue-500/20 text-blue-300' 
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>មើល</span>
              </span>
            </button>
            <button
              onClick={() => {
                // Open in new window
                window.open(previewUrl, '_blank');
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-white/60 hover:text-white/80"
            >
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span>ទាំងពីរ</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className={showFullscreen ? 'fixed inset-0 z-50 bg-black' : 'relative h-[450px]'}>
        {/* Generation View */}
        {currentView === 'generation' && (
          <div className="h-full overflow-y-auto bg-gray-900/50 p-6">
            <div className="max-w-4xl mx-auto space-y-3">
              {generationMessages.length === 0 && isGenerating && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-2 border-orange-400/30 border-t-orange-400 mx-auto mb-4"></div>
                  <p className="text-white/70 font-khmer text-lg">AI កំពុងចាប់ផ្តើមបង្កើតកូដ...</p>
                </div>
              )}
              
              {generationMessages.map((msg, index) => (
                <div key={index} className="animate-fadeIn">
                  {msg.type === 'status' && (
                    <div className="flex items-center gap-3 text-white/70">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <span className="text-sm font-khmer">{msg.content}</span>
                    </div>
                  )}

                  {msg.type === 'thinking' && (
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 my-2">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="text-purple-300 text-xs font-semibold mb-1">AI Thinking</div>
                          <pre className="text-purple-200 text-sm whitespace-pre-wrap font-mono">{msg.content}</pre>
                        </div>
                      </div>
                    </div>
                  )}

                  {msg.type === 'tool' && (
                    <div className="flex items-center gap-3 text-emerald-400/80">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                      <span className="text-sm font-mono">{msg.content}</span>
                    </div>
                  )}

                  {msg.type === 'file' && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 my-1">
                      <div className="text-green-300 text-sm font-mono flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {msg.content}
                      </div>
                    </div>
                  )}

                  {msg.type === 'info' && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                      <div className="text-blue-300 text-sm font-khmer">{msg.content}</div>
                    </div>
                  )}

                  {msg.type === 'warning' && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                      <div className="text-yellow-300 text-sm font-khmer">{msg.content}</div>
                    </div>
                  )}

                  {msg.type === 'success' && (
                    <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-lg p-4">
                      <div className="text-green-300 font-semibold font-khmer">{msg.content}</div>
                    </div>
                  )}

                  {msg.type === 'error' && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                      <p className="text-red-300 font-khmer">{msg.content}</p>
                    </div>
                  )}
                </div>
              ))}
              
              {isGenerating && generationMessages.length > 0 && (
                <div className="flex items-center gap-3 text-white/50">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                  </div>
                  <span className="text-sm font-khmer">AI កំពុងគិត...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preview View */}
        {currentView === 'preview' && (
          <>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-2 border-orange-400/30 border-t-orange-400 mx-auto mb-4"></div>
                  <p className="text-white/70 font-khmer">កំពុងផ្ទុកការមើលជាមុន...</p>
                </div>
              </div>
            )}
            
            {/* Iframe - Only load when generation is complete */}
            {isGenerating || workspaceId === 'generating' ? (
              <div className="w-full h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-400/30 border-t-orange-400 mx-auto mb-6"></div>
                  <h2 className="text-2xl font-bold text-white mb-3 font-khmer">កំពុងបង្កើតកូដ...</h2>
                  <p className="text-white/70">Please wait while your code is being generated</p>
                </div>
              </div>
            ) : (
              <iframe
                src={embedUrl || previewUrl}
                className="w-full h-full bg-white"
                onLoad={() => setIsLoading(false)}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            )}
          </>
        )}
        
        {/* Fullscreen Close Button */}
        {showFullscreen && (
          <button
            onClick={() => setShowFullscreen(false)}
            className="absolute top-4 right-4 p-3 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Compact Footer */}
      <div className="bg-black/40 border-t border-gray-700/50 px-4 py-2">
        <div className="flex items-center justify-between text-xs">
          <div className="text-white/50">
            {currentView === 'generation' ? 'AI Processing' : 'Live Preview'}
          </div>
          <div className="flex items-center gap-2 text-white/40">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
            <span>{workspaceId === 'generating' ? 'Generating...' : 'Active'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}