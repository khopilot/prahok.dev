"use client";

import { useState } from 'react';

export default function TestLocalGenerationPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('Create a beautiful restaurant website for Prahok specialty cuisine with Khmer design elements');

  const testLocalGeneration = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/generate/local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt,
          projectName: 'prahok-restaurant'
        }),
      });
      const data = await response.json();
      setResult(data);
      
      // Store in localStorage for preview
      if (data.projectData) {
        localStorage.setItem(`project_${data.projectId}`, JSON.stringify(data.projectData));
      }
    } catch (error) {
      setResult({ error: error.toString() });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Test Local Generation</h1>
      
      <div className="mb-6">
        <label className="block mb-2">Test Prompt:</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full p-3 bg-gray-800 border border-gray-700 rounded"
          rows={4}
        />
      </div>

      <button
        onClick={testLocalGeneration}
        disabled={loading}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50 mb-8"
      >
        {loading ? 'Generating...' : 'Test Local Generation'}
      </button>

      {result && (
        <div className="bg-gray-800 p-6 rounded">
          <h2 className="text-xl font-semibold mb-3">Result:</h2>
          
          {result.success && (
            <div className="mb-4">
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
          
          <pre className="whitespace-pre-wrap overflow-auto text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}