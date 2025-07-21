"use client";

import { useState, useEffect } from "react";

interface SandboxPreviewProps {
  workspaceId: string;
  previewUrl: string;
  embedUrl?: string;
  onClose?: () => void;
}

export function SandboxPreview({ workspaceId, previewUrl, embedUrl, onClose }: SandboxPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [showFullscreen, setShowFullscreen] = useState(false);

  useEffect(() => {
    // Simulate loading time for iframe
    const timer = setTimeout(() => setIsLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-black/30 border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white font-khmer">
              ការមើលជាមុនកម្មវិធីរបស់អ្នក
            </h3>
            <p className="text-sm text-white/60 mt-1">
              Workspace: {workspaceId ? `${workspaceId.substring(0, 8)}...` : 'N/A'}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              បើកក្នុងផ្ទាំងថ្មី
            </a>
            
            <button
              onClick={() => setShowFullscreen(!showFullscreen)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5h-4m4 0v-4m0 4l-5-5" />
              </svg>
            </button>
            
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Preview Container */}
      <div className={`relative ${showFullscreen ? 'fixed inset-0 z-50 bg-black' : 'h-[600px]'}`}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-orange-400/30 border-t-orange-400 mx-auto mb-4"></div>
              <p className="text-white/70 font-khmer">កំពុងផ្ទុកការមើលជាមុន...</p>
            </div>
          </div>
        )}
        
        {/* Iframe */}
        <iframe
          src={embedUrl || previewUrl}
          className="w-full h-full bg-white"
          onLoad={() => setIsLoading(false)}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
        
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

      {/* Footer Info */}
      <div className="bg-black/30 border-t border-white/10 p-4">
        <div className="flex items-center justify-between text-sm">
          <div className="text-white/60">
            <span className="font-khmer">Sandbox នឹងផុតកំណត់ក្នុងរយៈពេល 1 ម៉ោង</span>
          </div>
          <div className="flex items-center gap-2 text-white/40">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Live Preview</span>
          </div>
        </div>
      </div>
    </div>
  );
}