"use client";

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

interface GeneratedFile {
  path: string;
  content: string;
}

export default function PreviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.projectId as string;
  const isEmbed = searchParams.get('embed') === 'true';
  
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showCode, setShowCode] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  
  useEffect(() => {
    // In a real implementation, we would fetch the files from a storage service
    // For now, we'll use localStorage as a simple demo
    const storedProject = localStorage.getItem(`project_${projectId}`);
    
    if (storedProject) {
      const projectData = JSON.parse(storedProject);
      setFiles(projectData.generatedFiles || []);
      
      // Select index.html by default if it exists
      const indexFile = projectData.generatedFiles?.find((f: GeneratedFile) => 
        f.path === 'index.html' || f.path === 'src/index.html'
      );
      if (indexFile) {
        setSelectedFile(indexFile.path);
      } else if (projectData.generatedFiles?.length > 0) {
        setSelectedFile(projectData.generatedFiles[0].path);
      }
    }
    
    setLoading(false);
  }, [projectId]);
  
  const selectedFileContent = files.find(f => f.path === selectedFile)?.content || '';
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }
  
  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white">No files found for this project</div>
      </div>
    );
  }
  
  // Check if this is a Next.js/React project
  const hasPackageJson = files.some(f => f.path === 'package.json');
  const packageJson = hasPackageJson ? JSON.parse(files.find(f => f.path === 'package.json')?.content || '{}') : null;
  const isNextJs = packageJson?.dependencies?.next || packageJson?.devDependencies?.next;
  const isReact = packageJson?.dependencies?.react || packageJson?.devDependencies?.react;
  
  // If embedded mode
  if (isEmbed) {
    // For framework projects, show a message to run the dev server
    if (hasPackageJson && (isNextJs || isReact)) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
          <div className="text-center p-8 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 max-w-2xl">
            <div className="text-6xl mb-4">🚀</div>
            <h1 className="text-3xl font-bold text-white mb-4 font-khmer">
              {isNextJs ? 'Next.js' : 'React'} គម្រោងត្រូវបានបង្កើត!
            </h1>
            <p className="text-white/80 mb-6">
              Your {isNextJs ? 'Next.js' : 'React'} application has been generated successfully.
            </p>
            
            <div className="bg-black/30 rounded-lg p-4 mb-6 text-left">
              <p className="text-white/60 text-sm mb-2">To run this application locally:</p>
              <pre className="text-green-400 font-mono text-sm">
                <code>{`cd ${projectId}
npm install
npm run dev`}</code>
              </pre>
            </div>
            
            <div className="space-y-2">
              <p className="text-white/70 text-sm">
                <span className="font-semibold">Files generated:</span> {files.length}
              </p>
              <p className="text-white/70 text-sm">
                <span className="font-semibold">Framework:</span> {isNextJs ? 'Next.js' : 'React'}
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    // For static HTML files
    if (selectedFile.endsWith('.html')) {
    // Process HTML to inline CSS and JS files
    let processedHtml = selectedFileContent;
    
    // Replace CSS link tags with inline styles
    const cssLinkRegex = /<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g;
    processedHtml = processedHtml.replace(cssLinkRegex, (match, href) => {
      const cssFile = files.find(f => f.path === href || f.path.endsWith(href));
      if (cssFile) {
        return `<style>${cssFile.content}</style>`;
      }
      return match;
    });
    
    // Replace script src tags with inline scripts
    const scriptSrcRegex = /<script[^>]*src="([^"]+)"[^>]*><\/script>/g;
    processedHtml = processedHtml.replace(scriptSrcRegex, (match, src) => {
      const jsFile = files.find(f => f.path === src || f.path.endsWith(src));
      if (jsFile) {
        return `<script>${jsFile.content}</script>`;
      }
      return match;
    });
    
      return (
        <div 
          className="w-full h-screen"
          dangerouslySetInnerHTML={{ __html: processedHtml }}
        />
      );
    }
    
    // For non-HTML files in embed mode
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white">Preview not available for this file type</div>
      </div>
    );
  }
  
  // Find the main HTML file to preview
  const indexFile = files.find(f => 
    f.path === 'index.html' || 
    f.path === 'src/index.html' ||
    f.path === 'public/index.html'
  );
  
  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">
      {/* File Explorer - Collapsible */}
      {showCode && (
        <div className="w-80 bg-gray-800 border-r border-gray-700 overflow-y-auto flex-shrink-0">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold font-khmer">ឯកសារដែលបានបង្កើត</h3>
              <button
                onClick={() => setShowCode(false)}
                className="text-gray-400 hover:text-white p-1"
                title="Hide code"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            </div>
            <div className="space-y-1">
              {files.map((file) => {
                // Get file icon based on extension
                const getFileIcon = (path: string) => {
                  if (path.endsWith('.json')) return '📦';
                  if (path.endsWith('.js') || path.endsWith('.jsx')) return '🟨';
                  if (path.endsWith('.ts') || path.endsWith('.tsx')) return '🟦';
                  if (path.endsWith('.css')) return '🎨';
                  if (path.endsWith('.html')) return '🌐';
                  if (path.includes('component')) return '🧩';
                  if (path.includes('page')) return '📄';
                  return '📄';
                };
                
                return (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file.path)}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors flex items-center gap-2 ${
                      selectedFile === file.path
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <span className="flex-shrink-0">{getFileIcon(file.path)}</span>
                    <span className="truncate">{file.path}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      
      {/* Toggle button when code is hidden */}
      {!showCode && (
        <button
          onClick={() => setShowCode(true)}
          className="bg-gray-800 hover:bg-gray-700 p-2 border-r border-gray-700"
          title="Show code"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      )}
      
      {/* Split View - Code Editor and Preview */}
      <div className="flex-1 flex min-h-0">
        {/* Code Editor Section */}
        {showCode && (
          <div className="w-1/2 flex flex-col border-r border-gray-700 min-w-0">
            <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
              <span className="text-gray-300 text-sm flex items-center gap-2">
                <span className="text-gray-500">📁</span>
                {selectedFile}
              </span>
              <span className="text-gray-500 text-xs">
                {selectedFileContent.length} characters
              </span>
            </div>
            
            <div className="flex-1 overflow-auto bg-gray-950">
              <pre className="p-4 text-gray-300 text-sm font-mono leading-relaxed">
                <code>{selectedFileContent}</code>
              </pre>
            </div>
          </div>
        )}
        
        {/* Preview Section */}
        <div className="flex-1 flex flex-col bg-white min-w-0">
          <div className="bg-gray-100 border-b px-4 py-2 flex items-center justify-between">
            <span className="text-gray-700 text-sm font-medium flex items-center gap-2">
              <span>🌐</span>
              Preview
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-gray-600 hover:text-gray-800 p-1"
                title={showPreview ? "Hide preview" : "Show preview"}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showPreview ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  )}
                </svg>
              </button>
            </div>
          </div>
          
          {showPreview && (
            <div className="flex-1 relative">
              {indexFile ? (
                <iframe
                  srcDoc={(() => {
                    // Process HTML to inline CSS and JS files
                    let processedHtml = indexFile.content;
                    
                    // Replace CSS link tags with inline styles
                    const cssLinkRegex = /<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g;
                    processedHtml = processedHtml.replace(cssLinkRegex, (match, href) => {
                      const cssFile = files.find(f => f.path === href || f.path.endsWith(href));
                      if (cssFile) {
                        return `<style>${cssFile.content}</style>`;
                      }
                      return match;
                    });
                    
                    // Replace script src tags with inline scripts
                    const scriptSrcRegex = /<script[^>]*src="([^"]+)"[^>]*><\/script>/g;
                    processedHtml = processedHtml.replace(scriptSrcRegex, (match, src) => {
                      const jsFile = files.find(f => f.path === src || f.path.endsWith(src));
                      if (jsFile) {
                        return `<script>${jsFile.content}</script>`;
                      }
                      return match;
                    });
                    
                    return processedHtml;
                  })()}
                  className="absolute inset-0 w-full h-full"
                  title="Application Preview"
                  sandbox="allow-scripts allow-same-origin allow-forms"
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-50">
                  <div className="text-center">
                    <p className="text-gray-600 mb-2">No index.html file found</p>
                    <p className="text-gray-500 text-sm">This appears to be a framework project that needs to be built first.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}