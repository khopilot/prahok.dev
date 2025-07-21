"use client";

import { useState } from 'react';

export default function TestGenerationPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('Create a simple hello world HTML page');

  const testDirectAPI = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      setResult({ type: 'direct', data });
    } catch (error) {
      setResult({ type: 'direct', error: error.toString() });
    }
    setLoading(false);
  };

  const testGenerateAPI = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      setResult({ type: 'generate', data });
    } catch (error) {
      setResult({ type: 'generate', error: error.toString() });
    }
    setLoading(false);
  };

  const testSandboxAPI = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/generate/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt,
          projectName: 'test-project'
        }),
      });
      const data = await response.json();
      setResult({ type: 'sandbox', data });
    } catch (error) {
      setResult({ type: 'sandbox', error: error.toString() });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Test Generation APIs</h1>
      
      <div className="mb-6">
        <label className="block mb-2">Test Prompt:</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full p-3 bg-gray-800 border border-gray-700 rounded"
          rows={3}
        />
      </div>

      <div className="space-y-4 mb-8">
        <button
          onClick={testDirectAPI}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
        >
          Test Direct Claude API
        </button>

        <button
          onClick={testGenerateAPI}
          disabled={loading}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded disabled:opacity-50 ml-4"
        >
          Test Claude Code SDK
        </button>

        <button
          onClick={testSandboxAPI}
          disabled={loading}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded disabled:opacity-50 ml-4"
        >
          Test Sandbox Generation
        </button>
      </div>

      {loading && <div className="text-yellow-400">Loading...</div>}

      {result && (
        <div className="bg-gray-800 p-6 rounded">
          <h2 className="text-xl font-semibold mb-3">
            Result from {result.type} API:
          </h2>
          <pre className="whitespace-pre-wrap overflow-auto">
            {JSON.stringify(result.data || result.error, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}