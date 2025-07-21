"use client";

import { useState } from "react";

export default function DebugSandbox() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()} - ${message}`]);
  };

  const testSandboxGeneration = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    setLogs([]);
    
    addLog("Starting sandbox generation test...");
    
    try {
      addLog("Sending POST request to /api/generate/sandbox");
      
      const response = await fetch("/api/generate/sandbox", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: "Create a simple hello world Next.js page",
          projectName: "debug-test",
        }),
      });

      addLog(`Response status: ${response.status} ${response.statusText}`);
      
      const responseText = await response.text();
      addLog(`Response body: ${responseText.substring(0, 500)}...`);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        addLog("Failed to parse response as JSON");
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      if (!response.ok) {
        addLog(`Error response: ${JSON.stringify(data, null, 2)}`);
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      addLog("Success! Setting result...");
      setResult(data);
      
    } catch (err: any) {
      addLog(`Error caught: ${err.message}`);
      console.error("Full error:", err);
      setError({
        message: err.message,
        stack: err.stack,
        details: err
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Sandbox Generation Debug</h1>
        
        <div className="mb-8">
          <button
            onClick={testSandboxGeneration}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Testing..." : "Test Sandbox Generation"}
          </button>
        </div>

        {/* Logs Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-2">Execution Logs</h2>
          <div className="bg-gray-800 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet. Click the test button to start.</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="mb-1 text-gray-300">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Error Section */}
        {error && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-2 text-red-400">Error Details</h2>
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
              <p className="font-semibold mb-2">{error.message}</p>
              {error.stack && (
                <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                  {error.stack}
                </pre>
              )}
              <details className="mt-4">
                <summary className="cursor-pointer text-sm">Full Error Object</summary>
                <pre className="mt-2 text-xs overflow-x-auto">
                  {JSON.stringify(error.details, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        )}

        {/* Success Result */}
        {result && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-2 text-green-400">Success Result</h2>
            <div className="bg-green-900/20 border border-green-500 rounded-lg p-4">
              <div className="space-y-2 mb-4">
                <p><strong>Workspace ID:</strong> {result.workspaceId}</p>
                <p><strong>Preview URL:</strong> <a href={result.previewUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{result.previewUrl}</a></p>
                <p><strong>Embed URL:</strong> {result.embedUrl}</p>
                <p><strong>Files Generated:</strong> {result.generatedFiles?.length || 0}</p>
              </div>
              <details>
                <summary className="cursor-pointer text-sm">Full Response</summary>
                <pre className="mt-2 text-xs overflow-x-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        )}

        {/* Environment Info */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-2">Environment Info</h2>
          <div className="bg-gray-800 rounded-lg p-4 font-mono text-sm">
            <p>NODE_ENV: {process.env.NODE_ENV}</p>
            <p>Browser: {typeof window !== 'undefined' ? navigator.userAgent : 'SSR'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}