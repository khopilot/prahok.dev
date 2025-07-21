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
  
  // If it's an HTML file and embedded, render it directly
  if (isEmbed && selectedFile.endsWith('.html')) {
    return (
      <div 
        className="w-full h-screen"
        dangerouslySetInnerHTML={{ __html: selectedFileContent }}
      />
    );
  }
  
  return (
    <div className="flex h-screen bg-gray-900">
      {/* File Explorer */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-white font-semibold mb-4">Generated Files</h3>
          <div className="space-y-1">
            {files.map((file) => (
              <button
                key={file.path}
                onClick={() => setSelectedFile(file.path)}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                  selectedFile === file.path
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                📄 {file.path}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* File Content */}
      <div className="flex-1 flex flex-col">
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
          <span className="text-gray-300 text-sm">{selectedFile}</span>
        </div>
        
        <div className="flex-1 overflow-auto">
          {selectedFile.endsWith('.html') ? (
            <iframe
              srcDoc={selectedFileContent}
              className="w-full h-full bg-white"
              title="Preview"
              sandbox="allow-scripts allow-same-origin"
            />
          ) : (
            <pre className="p-4 text-gray-300 text-sm">
              <code>{selectedFileContent}</code>
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}