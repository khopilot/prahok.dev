"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { GenerationStream } from "@/components/GenerationStream";
import { SandboxPreview } from "@/components/SandboxPreview";
import { EditorSidebar } from "@/components/EditorSidebar";
import { testCases } from "@/lib/sandbox/test-cases";
import api from "@/lib/api";

interface GenerationResult {
  success: boolean;
  sessionId: string;
  generatedFiles: string[];
  messagesCount: number;
  executionTime: number;
  messages?: { type: string; timestamp: string }[];
  error?: string;
}

function EditorContent() {
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
  const [generationMessages, setGenerationMessages] = useState<Array<{type: string; content: string; timestamp: string}>>([]);

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
    setGenerationMessages([]);
    
    // Show sandbox preview immediately with generation view
    setSandboxResult({
      success: false,
      isGenerating: true,
      workspaceId: 'generating',
      previewUrl: '',
      embedUrl: ''
    });
    
    if (useSandbox) {
      // Utiliser la génération sécurisée avec sandbox
      try {
        // Add initial messages while waiting
        const initialMessages = [
          {
            type: 'status',
            content: 'កំពុងភ្ជាប់ទៅ AI...',
            timestamp: new Date().toISOString()
          },
          {
            type: 'info',
            content: 'កំពុងវិភាគសំណើររបស់អ្នក...',
            timestamp: new Date().toISOString()
          }
        ];
        setGenerationMessages(initialMessages);

        const response = await fetch("/api/generate/safe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            prompt,
            projectName: projectName || `project-${Date.now()}`,
            useSandbox: true
          }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || "Code generation failed");
        }

        // Update messages if available
        if (data.messages && data.messages.length > 0) {
          setGenerationMessages(data.messages);
        }

        setSandboxResult({
          ...data,
          isGenerating: false
        });
        setIsGenerating(false);
        
        // Store project data in localStorage for preview
        if (data.generatedFiles && data.generatedFiles.length > 0) {
          const projectData = {
            projectId: data.projectId,
            generatedFiles: data.generatedFiles,
            createdAt: new Date().toISOString(),
            method: data.method
          };
          localStorage.setItem(`project_${data.projectId}`, JSON.stringify(projectData));
        } else if (data.projectData) {
          localStorage.setItem(`project_${data.projectId}`, JSON.stringify(data.projectData));
        }
        
        // Save project to database
        if (data.success) {
          await saveProject(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setIsGenerating(false);
        setSandboxResult(null);
      }
    } else {
      // Show stream for non-sandbox mode
      setShowStream(true);
    }
  };
  
  const saveProject = async (generationData: any) => {
    try {
      // Auto-generate project name from prompt if not set
      const autoProjectName = projectName || prompt.split(' ').slice(0, 3).join(' ') || `គម្រោង ${new Date().toLocaleDateString('km-KH')}`;
      const autoDescription = projectDescription || prompt.substring(0, 100) + '...';
      
      const response = await api.post('/projects', {
        name: autoProjectName,
        description: autoDescription,
        prompt,
        sandboxId: generationData.workspaceId,
        previewUrl: generationData.previewUrl,
        generatedFiles: generationData.generatedFiles || [],
      });
      
      const { project } = response.data;
      setCurrentProjectId(project.id);
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };
  
  const loadProject = (project: any) => {
    // Clear any existing generation state
    setIsGenerating(false);
    setError("");
    setGenerationMessages([]);
    setResult(null);
    
    // Load the project data
    setPrompt(project.prompt);
    setProjectName(project.name);
    setProjectDescription(project.description);
    setCurrentProjectId(project.id);
    
    // Store project data in localStorage for preview page
    if (project.generatedFiles && project.generatedFiles.length > 0) {
      const projectData = {
        projectId: project.id,
        generatedFiles: project.generatedFiles,
        createdAt: project.createdAt,
        method: 'loaded'
      };
      localStorage.setItem(`project_${project.id}`, JSON.stringify(projectData));
    }
    
    // Load the preview if available
    if (project.previewUrl || project.id) {
      setSandboxResult({
        success: true,
        workspaceId: project.sandboxId || project.id,
        previewUrl: project.previewUrl || `/preview/${project.id}`,
        embedUrl: project.previewUrl ? `${project.previewUrl}?embed=true` : `/preview/${project.id}?embed=true`,
        isGenerating: false
      });
    } else {
      // Clear sandbox if no preview
      setSandboxResult(null);
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
      {/* Background Image - No Filter */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(/u7965223339_Clean_hero_background_design_stylized_waves_patte_9e1b5d70-2118-403c-a69f-20717c2d39f5_1.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
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
        onNewChat={() => {
          // Clear all state for new chat
          setPrompt("");
          setProjectName("");
          setProjectDescription("");
          setCurrentProjectId(undefined);
          setSandboxResult(null);
          setResult(null);
          setError("");
          setShowStream(false);
        }}
      />
      
      {/* Main Content - Adjusted for Sidebar */}
      <main className={`relative z-20 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-80'} min-h-screen flex flex-col`}>
        {/* Sandbox Preview - Centered */}
        {sandboxResult && (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="w-full max-w-5xl">
              <SandboxPreview
              workspaceId={sandboxResult.workspaceId}
              previewUrl={sandboxResult.previewUrl}
              embedUrl={sandboxResult.embedUrl}
              onClose={() => {
                setSandboxResult(null);
                setGenerationMessages([]);
              }}
              generationMessages={generationMessages}
              isGenerating={sandboxResult.isGenerating || isGenerating}
              />
            </div>
          </div>
        )}
        
        {/* Main content area */}
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32 w-full">
          {/* Results Section */}
          {result && (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 mb-8">
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
        
        {/* Fixed bottom input bar */}
        <div className="fixed bottom-0 left-0 right-0 z-30" style={{ paddingLeft: sidebarCollapsed ? '64px' : '320px' }}>
          <div className="bg-gradient-to-t from-gray-900 via-gray-900/95 to-transparent pt-4 pb-4 px-4">
            {/* Compact Test Cases */}
            <div className="max-w-4xl mx-auto mb-3">
              <div className="flex gap-2 flex-wrap justify-center">
                <button
                  onClick={() => {
                    setPrompt(`បង្កើតគេហទំព័រភោជនីយដ្ឋានម្ហូបខ្មែរទំនើបដោយប្រើ React.js, Tailwind CSS និង Next.js ជាមួយមុខងារដូចខាងក្រោម:
- Hero section ស្អាតជាមួយ animated background និងរូបភាពភោជនីយដ្ឋាន
- ប្រព័ន្ធ menu អន្តរកម្មជាមួយប្រភេទ (មុខម្ហូប, បាយឆា, បង្អែម, ភេសជ្ជៈ) ជាភាសាខ្មែរ និងអង់គ្លេស
- Gallery រូបភាពម្ហូបជាមួយ grid layout និង lightbox effect
- Form កក់តុអនឡាញជាមួយ date/time picker និងចំនួនភ្ញៀវ
- ផ្នែក testimonials អតិថិជនជាមួយផ្កាយវាយតម្លៃ
- ផែនទីទីតាំងជាមួយ Google Maps API integration
- ព័ត៌មានទំនាក់ទំនង និងម៉ោងបើក
- Responsive design សម្រាប់ទូរស័ព្ទជាមួយ smooth animations
- ប្រើពណ៌ក្តៅ (ទឹកក្រូច, ក្រហម, មាស) ដែលបំផុសគំនិតដោយវប្បធម៌ខ្មែរ
- Hover effects និង micro-interactions
- ផ្នែក "Chef's Special" បង្ហាញម្ហូបពិសេស
- SEO optimized ជាមួយ meta tags ត្រឹមត្រូវ
- ប្រើ Framer Motion សម្រាប់ animations
- State management ជាមួយ React Context API`);
                    setProjectName("ភោជនីយដ្ឋានខ្មែរ");
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-black/20 hover:bg-black/30 border border-white/10 hover:border-white/20 rounded-lg transition-all text-xs"
                >
                  <span>🍜</span>
                  <span className="text-white/70 font-khmer">ភោជនីយដ្ឋាន</span>
                </button>
                <button
                  onClick={() => {
                    setPrompt(`បង្កើតគេហទំព័រ e-commerce សម្រាប់លក់សម្លៀកបំពាក់ប្រពៃណីខ្មែរដោយប្រើ React.js, Node.js/Express, MongoDB និង Stripe API ជាមួយមុខងារ:
- កាតាឡុកផលិតផលទំនើបជាមួយ filter តាមប្រភេទ (បុរស, ស្ត្រី, កុមារ), ទំហំ, ពណ៌ និងតម្លៃ
- ទំព័រ detail ផលិតផលជាមួយ image zoom, size guide និងព័ត៌មានសម្ភារៈ
- Shopping cart ជាមួយ quantity updates និងការគណនាតម្លៃ
- ដំណើរការ checkout សុវត្ថិភាពជាមួយ form validation
- Payment integration mockup (Visa, Mastercard, ABA Pay, Wing)
- ប្រព័ន្ធ user account ជាមួយប្រវត្តិបញ្ជាទិញ
- Product search ជាមួយ autocomplete ដោយប្រើ Elasticsearch
- Wishlist/favorites feature ជាមួយ localStorage
- Customer reviews និង ratings system
- Promotional banner សម្រាប់ការបញ្ចុះតម្លៃ
- Newsletter subscription ជាមួយ email service
- Mobile-first responsive design ដោយប្រើ CSS Grid និង Flexbox
- Typography ប្រណិត និងលំនាំប្រពៃណីខ្មែរជា design accents
- ផ្នែក "ទំនិញថ្មី" និង "លក់ដាច់បំផុត"
- Size chart modal និងការណែនាំថែទាំ
- Redux Toolkit សម្រាប់ state management
- JWT authentication សម្រាប់សុវត្ថិភាព`);
                    setProjectName("ហាងសម្លៀកបំពាក់");
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-black/20 hover:bg-black/30 border border-white/10 hover:border-white/20 rounded-lg transition-all text-xs"
                >
                  <span>👗</span>
                  <span className="text-white/70 font-khmer">ហាងអនឡាញ</span>
                </button>
                <button
                  onClick={() => {
                    setPrompt(`បង្កើត portfolio website សម្រាប់ developer ដោយប្រើ Next.js 14, TypeScript, Tailwind CSS និង Framer Motion ជាមួយមុខងារ:
- Hero section ជាមួយ typing effect បង្ហាញ "Full Stack Developer"
- About section ជាមួយ skills progress bars (HTML, CSS, JavaScript, React, Node.js, Python, etc.)
- Project showcase អន្តរកម្មជាមួយ filter តាម technology
- Project cards ជាមួយ live demo និង GitHub links
- Smooth scroll navigation ជាមួយ active section highlighting
- Dark/light theme toggle ជាមួយ system preference detection
- Contact form ជាមួយ email validation ដោយប្រើ Formik និង Yup
- Social media links (GitHub, LinkedIn, Twitter) ជាមួយ hover effects
- Resume/CV download button ជាមួយ PDF.js
- Blog section សម្រាប់អត្ថបទបច្ចេកទេសជាមួយ MDX
- Testimonials slider ពីអតិថិជនដោយប្រើ Swiper.js
- Tech stack section ជាមួយ animated icons
- Terminal-style UI elements សម្រាប់ភាពពិតប្រាកដ
- Responsive design ជាមួយ mobile menu
- Loading animations និង page transitions
- SEO optimized ជាមួយ Open Graph tags និង sitemap
- Three.js សម្រាប់ 3D graphics effects
- EmailJS សម្រាប់ contact form functionality`);
                    setProjectName("Portfolio Developer");
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-black/20 hover:bg-black/30 border border-white/10 hover:border-white/20 rounded-lg transition-all text-xs"
                >
                  <span>💼</span>
                  <span className="text-white/70 font-khmer">ផលប័ត្រ</span>
                </button>
                <button
                  onClick={() => {
                    setPrompt(`បង្កើត startup landing page ទំនើបដោយប្រើ Vue.js 3, Nuxt 3, Tailwind CSS និង GSAP ជាមួយមុខងារ:
- Hero section គួរឱ្យចាប់អារម្មណ៍ជាមួយ gradient background និង floating elements animation
- Value proposition headline ច្បាស់លាស់ជាមួយ supporting subtext
- CTA buttons ជាមួយ hover animations ("ចាប់ផ្តើមឥតគិតថ្លៃ", "មើល Demo")
- Feature showcase ជាមួយ icons, titles និង descriptions ក្នុង grid layout
- Benefits section ជាមួយ alternating image/text layout
- Animated statistics section (អ្នកប្រើ, downloads, satisfaction rate) ដោយប្រើ CountUp.js
- Customer testimonials carousel ជាមួយរូបថត និង company logos
- Pricing plans table ជាមួយ recommended plan highlight
- FAQ accordion ជាមួយ smooth expand/collapse animations
- Newsletter signup ជាមួយ Mailchimp integration
- Footer ជាមួយព័ត៌មានក្រុមហ៊ុន, quick links និង social media
- Sticky navigation bar ជាមួយ smooth scroll behavior
- Mobile-optimized ជាមួយ hamburger menu
- Loading animations និង scroll-triggered animations ដោយប្រើ AOS
- Color scheme ទំនើបជាមួយ gradient accents
- Trust badges និង security icons
- Headless CMS integration (Strapi/Contentful)
- Analytics tracking ជាមួយ Google Analytics 4`);
                    setProjectName("Startup Landing");
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-black/20 hover:bg-black/30 border border-white/10 hover:border-white/20 rounded-lg transition-all text-xs"
                >
                  <span>🚀</span>
                  <span className="text-white/70 font-khmer">ក្រុមហ៊ុន</span>
                </button>
                <button
                  onClick={() => {
                    setPrompt(`បង្កើត blog platform ពេញលេញដោយប្រើ Gatsby.js, GraphQL, Markdown និង Netlify CMS ជាមួយមុខងារ:
- Blog homepage ស្អាតជាមួយ featured posts hero section
- Post cards ជាមួយ thumbnail, title, excerpt, author, date និង read time
- Category filter buttons និង tag system ដោយប្រើ GraphQL queries
- Blog post page ជាមួយ typography ស្អាតដោយប្រើ Typography.js
- Markdown editor ជាមួយ live preview (split screen) ដោយប្រើ React-MD-Editor
- Toolbar ជាមួយ formatting buttons (bold, italic, headers, lists, code, links)
- Image upload ជាមួយ drag-and-drop ដោយប្រើ React-Dropzone
- Comment system ជាមួយ nested replies ដោយប្រើ Disqus API
- Author bio section ជាមួយ avatar និង social links
- Related posts section ដោយប្រើ GraphQL relationships
- Search functionality ជាមួយ instant results ដោយប្រើ Algolia
- Archive page រៀបចំតាមខែ/ឆ្នាំ
- Popular posts sidebar widget
- Newsletter subscription ជាមួយ ConvertKit integration
- Social share buttons (Facebook, Twitter, LinkedIn)
- Reading progress bar ដោយប្រើ React Hooks
- Dark mode toggle ជាមួយ Theme UI
- Responsive design ជាមួយ CSS-in-JS (Emotion)
- Code syntax highlighting ដោយប្រើ Prism.js
- SEO optimization ជាមួយ React Helmet និង sitemap
- PWA support សម្រាប់ offline reading`);
                    setProjectName("ប្លុកខ្មែរ");
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-black/20 hover:bg-black/30 border border-white/10 hover:border-white/20 rounded-lg transition-all text-xs"
                >
                  <span>📝</span>
                  <span className="text-white/70 font-khmer">ប្លុក</span>
                </button>
                <button
                  onClick={() => {
                    setPrompt(`បង្កើត analytics dashboard ពេញលេញដោយប្រើ React.js, Chart.js, D3.js និង Material-UI ជាមួយមុខងារ:
- Sidebar navigation ទំនើបជាមួយ icons និង active state indicators
- Overview cards បង្ហាញ KPIs (ប្រាក់ចំណូល, អ្នកប្រើប្រាស់, អត្រាបំលែង, កំណើន) ជាមួយ animated counters
- Interactive line chart សម្រាប់ទិន្នន័យប្រាក់ចំណូលតាមពេលវេលាដោយប្រើ Chart.js
- Bar chart សម្រាប់ការលក់តាមប្រភេទផលិតផលជាមួយ hover tooltips
- Pie/donut chart សម្រាប់ប្រភពចរាចរណ៍ជាមួយ interactive legends
- Real-time data updates ជាមួយ WebSocket integration និង animated transitions
- Date range picker ជាមួយ preset options (7 days, 30 days, YTD) ដោយប្រើ React DatePicker
- Data table ជាមួយ sorting, pagination, search និង export ដោយប្រើ MUI DataGrid
- Export functionality (CSV, PDF, Excel) ដោយប្រើ jsPDF និង SheetJS
- User activity heatmap calendar ដោយប្រើ D3.js
- Geographic map បង្ហាញការលក់តាមតំបន់ដោយប្រើ Leaflet
- Performance metrics ជាមួយ circular progress indicators
- Notification center សម្រាប់ alerts និង updates ជាមួយ badge counts
- Dark/light theme toggle ជាមួយ smooth transitions
- Responsive grid layout ដោយប្រើ CSS Grid និង container queries
- Loading skeletons និង shimmer effects
- Tooltips លម្អិតជាមួយ Popper.js
- Refresh button ជាមួយ loading spinner និង last updated timestamp
- Mobile-responsive ជាមួយ bottom navigation bar
- Redux Toolkit សម្រាប់ state management
- TypeScript សម្រាប់ type safety`);
                    setProjectName("ផ្ទាំងវិភាគទិន្នន័យ");
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-black/20 hover:bg-black/30 border border-white/10 hover:border-white/20 rounded-lg transition-all text-xs"
                >
                  <span>📊</span>
                  <span className="text-white/70 font-khmer">វិភាគទិន្នន័យ</span>
                </button>
              </div>
            </div>
            
            <div className="max-w-4xl mx-auto">
              {/* Compact Input Bar */}
              <div className="bg-gray-800/90 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-2xl p-3">
                <div className="flex items-center gap-3">
                  <textarea
                    value={prompt}
                    onChange={(e) => {
                      setPrompt(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && !isGenerating && prompt.trim()) {
                        e.preventDefault();
                        handleGenerate();
                      }
                    }}
                    rows={1}
                    className="flex-1 px-4 py-3 bg-transparent text-white placeholder:text-gray-400 resize-none focus:outline-none font-khmer overflow-hidden"
                    placeholder="ពិពណ៌នាអំពីកម្មវិធីដែលអ្នកចង់បង្កើត..."
                    style={{ minHeight: '48px' }}
                  />
                  
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg font-khmer flex items-center gap-2 whitespace-nowrap"
                  >
                    {isGenerating ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>កំពុងបង្កើត</span>
                      </>
                    ) : (
                      <span>បង្កើត</span>
                    )}
                  </button>
                </div>
                
                {error && (
                  <div className="mt-3 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                    <p className="text-red-300 text-sm font-khmer">{error}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditorContent />
    </Suspense>
  );
}