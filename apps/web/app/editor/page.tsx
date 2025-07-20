"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { GenerationStream } from "@/components/GenerationStream";
import { SandboxPreview } from "@/components/SandboxPreview";
import { EditorSidebar } from "@/components/EditorSidebar";
import { testCases } from "@/lib/sandbox/test-cases";

interface GenerationResult {
  success: boolean;
  sessionId: string;
  generatedFiles: string[];
  messagesCount: number;
  executionTime: number;
  messages?: { type: string; timestamp: string }[];
  error?: string;
}

export default function EditorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showStream, setShowStream] = useState(false);
  const [useSandbox, setUseSandbox] = useState(true); // Par défaut, utiliser sandbox
  const [sandboxResult, setSandboxResult] = useState<any>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebarCollapsed') === 'true';
    }
    return false;
  });
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [currentProjectId, setCurrentProjectId] = useState<string>();

  useEffect(() => {
    // Get initial prompt from URL if available
    const urlPrompt = searchParams.get("prompt");
    if (urlPrompt) {
      setPrompt(decodeURIComponent(urlPrompt));
    }

    // Redirect to login if not authenticated
    if (!user) {
      router.push("/login");
    }
  }, [searchParams, user, router]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setError("");
    setSandboxResult(null);
    
    if (useSandbox) {
      // Utiliser la génération en sandbox
      try {
        const response = await fetch("/api/generate/sandbox", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            prompt,
            projectName: projectName || `project-${Date.now()}`,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Sandbox generation failed");
        }

        const data = await response.json();
        setSandboxResult(data);
        setIsGenerating(false);
        
        // Save project to database
        if (data.success) {
          await saveProject(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setIsGenerating(false);
      }
    } else {
      // Utiliser l'ancienne méthode de streaming
      setShowStream(true);
    }
  };
  
  const saveProject = async (generationData: any) => {
    try {
      const response = await fetch('http://localhost:5000/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          name: projectName || `គម្រោង ${new Date().toLocaleDateString('km-KH')}`,
          description: projectDescription || prompt.substring(0, 100) + '...',
          prompt,
          sandboxId: generationData.workspaceId,
          previewUrl: generationData.previewUrl,
          generatedFiles: generationData.generatedFiles || [],
        }),
      });
      
      if (response.ok) {
        const { project } = await response.json();
        setCurrentProjectId(project.id);
      }
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };
  
  const loadProject = (project: any) => {
    setPrompt(project.prompt);
    setProjectName(project.name);
    setProjectDescription(project.description);
    setCurrentProjectId(project.id);
    if (project.previewUrl) {
      setSandboxResult({
        success: true,
        workspaceId: project.sandboxId,
        previewUrl: project.previewUrl,
        embedUrl: `${project.previewUrl}?embed=true`,
      });
    }
  };

  const handleGenerationComplete = (data: any) => {
    setResult({
      success: true,
      sessionId: data.sessionId || 'unknown',
      generatedFiles: data.filesGenerated || [],
      messagesCount: data.messageCount || 0,
      executionTime: data.duration || 0,
    });
    setIsGenerating(false);
  };

  const handleGenerationError = (errorMessage: string) => {
    setError(errorMessage);
    setIsGenerating(false);
  };

  if (!user) {
    return null; // Loading or redirecting
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
      {/* Background Image with Overlay - Same as homepage */}
      <div 
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: 'url(/u7965223339_Clean_hero_background_design_stylized_waves_patte_9e1b5d70-2118-403c-a69f-20717c2d39f5_1.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Gradient Overlay for Lovable-style dark theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-pink-500/10 to-transparent z-10" />
      
      {/* User Info - Top Right */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-4">
        <span className="text-white/60 text-sm">{user.email}</span>
        <button
          onClick={async () => {
            try {
              await logout();
            } catch (error) {
              router.push("/");
            }
          }}
          className="text-white/60 hover:text-white transition-colors text-sm font-medium"
        >
          ចាកចេញ
        </button>
      </div>

      {/* Editor Sidebar - Always Visible */}
      <EditorSidebar
        onSelectProject={loadProject}
        currentProjectId={currentProjectId}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => {
          const newState = !sidebarCollapsed;
          setSidebarCollapsed(newState);
          localStorage.setItem('sidebarCollapsed', newState.toString());
        }}
      />
      
      {/* Main Content - Adjusted for Sidebar */}
      <main className={`relative z-20 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-80'} min-h-screen`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
        {/* Enhanced Input Section */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 mb-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400 font-khmer">បង្កើតកម្មវិធីជាមួយ AI</h2>
              {currentProjectId && (
                <p className="text-white/40 text-xs mt-1">កំពុងកែសម្រួលគម្រោង</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-white/60 text-sm">AI Ready</span>
            </div>
          </div>
          
          <div className="space-y-6">
            {/* Project Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-2 font-khmer">
                  ឈ្មោះគម្រោង
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-4 py-3 bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400/50 focus:outline-none transition-all text-white placeholder:text-white/30"
                  placeholder="ឧ. Website Restaurant"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/60 mb-2 font-khmer">
                  ពិពណ៌នាខ្លី
                </label>
                <input
                  type="text"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400/50 focus:outline-none transition-all text-white placeholder:text-white/30"
                  placeholder="គេហទំព័រសម្រាប់ភោជនីយដ្ឋាន"
                />
              </div>
            </div>
            
            {/* Main Prompt */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-3 font-khmer">
                ពិពណ៌នាលម្អិតអំពីអ្វីដែលអ្នកចង់បង្កើត
              </label>
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={5}
                  className="w-full px-6 py-4 bg-black/40 backdrop-blur-sm border border-white/20 rounded-2xl focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400/50 focus:outline-none transition-all font-khmer placeholder:text-white/30 text-white resize-none text-lg shadow-inner"
                  placeholder="ឧទាហរណ៍: បង្កើត website សម្រាប់ restaurant ដែលមានមុខងារកម្មង់អាហារ, ទំព័រមុខស្អាត, និងភាពងាយស្រួលក្នុងការប្រើប្រាស់..."
                />
                <div className="absolute bottom-4 right-4 text-white/30 text-xs">
                  {prompt.length} តួអក្សរ
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="group relative px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-2xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl font-khmer text-lg transform hover:scale-105"
                >
                  <span className="relative z-10">
                    {isGenerating ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        កំពុងបង្កើត...
                      </span>
                    ) : (
                      "បង្កើតកូដ"
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
                </button>
                
                {result && (
                  <div className="flex items-center gap-2 text-white/70 text-sm animate-fadeIn">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="font-khmer">បានបង្កើតរួចរាល់</span>
                  </div>
                )}
              </div>
              
              {/* Advanced Options */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-white/60 text-sm cursor-pointer hover:text-white/80 transition-colors">
                  <input
                    type="checkbox"
                    checked={useSandbox}
                    onChange={(e) => setUseSandbox(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-black/50 text-orange-500 focus:ring-orange-400/50 accent-orange-500"
                  />
                  <span className="font-khmer">Sandbox Mode</span>
                </label>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl backdrop-blur-sm">
              <p className="text-red-200 font-khmer">{error}</p>
            </div>
          )}
        </div>

        {/* Enhanced Test Cases */}
        <div className="bg-gradient-to-br from-white/5 to-transparent backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white font-khmer">ឧទាហរណ៍សាកល្បង</h3>
            <span className="text-xs text-white/40">ចុចដើម្បីប្រើ</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {testCases.slice(0, 8).map((testCase) => (
              <button
                key={testCase.id}
                onClick={() => {
                  setPrompt(testCase.prompt);
                  setProjectName(testCase.name);
                }}
                className="group relative text-left p-4 bg-black/20 hover:bg-black/40 border border-white/5 hover:border-white/20 rounded-xl transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="text-sm font-medium text-white group-hover:text-orange-300 transition-colors mb-1">
                    {testCase.name}
                  </div>
                  <div className="text-xs text-white/40 capitalize">{testCase.category}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Sandbox Preview - Afficher l'URL de prévisualisation */}
        {sandboxResult && sandboxResult.success && (
          <SandboxPreview
            workspaceId={sandboxResult.workspaceId}
            previewUrl={sandboxResult.previewUrl}
            embedUrl={sandboxResult.embedUrl}
            onClose={() => setSandboxResult(null)}
          />
        )}

        {/* Results Section */}
        {result && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white font-khmer">លទ្ធផលបង្កើតកូដ</h3>
              <div className="flex items-center gap-4 text-white/60 text-sm">
                <span>Session: {result.sessionId.substring(0, 8)}...</span>
                <span>{result.executionTime}ms</span>
              </div>
            </div>
            
            {/* Success Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-black/30 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold text-green-400">{result.generatedFiles.length}</div>
                <div className="text-white/60 text-sm font-khmer">ឯកសារបានបង្កើត</div>
              </div>
              <div className="bg-black/30 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold text-blue-400">{result.messagesCount}</div>
                <div className="text-white/60 text-sm font-khmer">ការិយាល័យ AI</div>
              </div>
              <div className="bg-black/30 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold text-orange-400">{(result.executionTime / 1000).toFixed(1)}s</div>
                <div className="text-white/60 text-sm font-khmer">រយៈពេលបង្កើត</div>
              </div>
            </div>

            {/* Generated Files */}
            {result.generatedFiles.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-3 font-khmer">ឯកសារដែលបានបង្កើត</h4>
                <div className="space-y-2">
                  {result.generatedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-black/30 rounded-lg backdrop-blur-sm">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-white/80 font-mono text-sm">{file}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw Result for Debugging */}
            <details className="mt-6">
              <summary className="text-white/60 text-sm cursor-pointer hover:text-white/80 transition-colors">
                មើលលម្អិតបន្ថែម (Debug Info)
              </summary>
              <pre className="mt-3 bg-black/50 text-gray-300 p-4 rounded-xl overflow-x-auto text-xs backdrop-blur-sm">
                <code>{JSON.stringify(result, null, 2)}</code>
              </pre>
            </details>
          </div>
        )}

        {/* Generation Stream - Real-time display */}
        {showStream && (
          <GenerationStream
            prompt={prompt}
            onComplete={handleGenerationComplete}
            onError={handleGenerationError}
          />
        )}
        </div>
      </main>
      
      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/50 to-transparent z-10" />
    </div>
  );
}