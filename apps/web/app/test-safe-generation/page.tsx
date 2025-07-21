"use client";

import { useState } from 'react';

export default function TestSafeGenerationPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('Create a beautiful restaurant website for Prahok specialty cuisine with modern design and animations');
  const [useSandbox, setUseSandbox] = useState(true);

  const testGeneration = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/generate/safe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt,
          projectName: 'test-prahok-restaurant',
          useSandbox
        }),
      });
      
      const data = await response.json();
      setResult(data);
      
      // Store in localStorage for preview if successful
      if (data.success && data.projectData) {
        localStorage.setItem(`project_${data.projectId}`, JSON.stringify(data.projectData));
      }
    } catch (error) {
      setResult({ error: error.toString() });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Test Safe Generation</h1>
      
      <div className="mb-6">
        <label className="block mb-2">Test Prompt:</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full p-3 bg-gray-800 border border-gray-700 rounded"
          rows={4}
        />
      </div>

      <div className="mb-6">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={useSandbox}
            onChange={(e) => setUseSandbox(e.target.checked)}
            className="w-4 h-4"
          />
          <span>Use Sandbox (will fallback if fails)</span>
        </label>
      </div>

      <button
        onClick={testGeneration}
        disabled={loading}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50 mb-8"
      >
        {loading ? 'Generating...' : 'Test Safe Generation'}
      </button>

      {result && (
        <div className="bg-gray-800 p-6 rounded">
          <h2 className="text-xl font-semibold mb-3">Result:</h2>
          
          {result.success && (
            <div className="mb-4 space-y-2">
              <p className="text-green-400">✅ Success! Method: {result.method}</p>
              <p>Generated {result.generatedFiles?.length || 0} files</p>
              {result.previewUrl && (
                <div className="mt-4">
                  <a 
                    href={result.previewUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    Open Preview →
                  </a>
                </div>
              )}
            </div>
          )}
          
          {result.messages && (
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Messages:</h3>
              <div className="space-y-1">
                {result.messages.map((msg: any, i: number) => (
                  <div key={i} className={`text-sm ${
                    msg.type === 'error' ? 'text-red-400' : 
                    msg.type === 'warning' ? 'text-yellow-400' :
                    msg.type === 'success' ? 'text-green-400' :
                    'text-gray-400'
                  }`}>
                    [{msg.type}] {msg.content}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <details className="mt-4">
            <summary className="cursor-pointer text-gray-400 hover:text-gray-300">
              Full Response
            </summary>
            <pre className="whitespace-pre-wrap overflow-auto text-sm mt-2">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}