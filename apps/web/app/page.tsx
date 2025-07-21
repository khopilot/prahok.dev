"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      if (user) {
        // User is authenticated - go directly to editor/dashboard
        router.push(`/editor?prompt=${encodeURIComponent(prompt)}`);
      } else {
        // User is not authenticated - store prompt and redirect to login
        sessionStorage.setItem("initialPrompt", prompt);
        router.push("/login");
      }
    }
  };

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
      
      {/* Navigation Bar */}
      <nav className="relative z-50 flex items-center justify-between p-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="text-white font-bold text-xl">prahok</span>
        </div>
        
        <div className="flex items-center gap-6">
          {user ? (
            <>
              <span className="text-white/70 text-sm">{user.email}</span>
              <Link
                href="/editor"
                className="text-white/80 hover:text-white transition-colors text-sm font-medium"
              >
                Editor
              </Link>
              <button
                onClick={async () => {
                  try {
                    if (process.env.NODE_ENV === 'development') {
                      console.log('🚪 Logout button clicked');
                    }
                    await logout();
                  } catch (error) {
                    if (process.env.NODE_ENV === 'development') {
                      console.error('❌ Logout error:', error);
                    }
                    window.location.href = "/";
                  }
                }}
                className="text-white/80 hover:text-white transition-colors text-sm font-medium"
              >
                ចាកចេញ
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-white/80 hover:text-white transition-colors text-sm font-medium"
                suppressHydrationWarning
              >
                ចូលប្រើ
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-all text-sm font-medium backdrop-blur-sm"
                suppressHydrationWarning
              >
                ចុះឈ្មោះ
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-20 flex flex-col items-center justify-center min-h-[80vh] px-6">
        {/* Main Heading */}
        <div className="text-center mb-16 max-w-4xl">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/80 mb-6 leading-tight">
            បង្កើតកម្មវិធី
          </h1>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400 mb-8 leading-tight">
            ជាមួយ AI ជាភាសាខ្មែរ
          </h2>
          <p className="text-xl md:text-2xl text-white/70 font-khmer leading-relaxed max-w-3xl mx-auto">
            ពិពណ៌នាគម្រោងរបស់អ្នកជាភាសាខ្មែរ ហើយ AI នឹងបង្កើតកូដពេញលេញសម្រាប់អ្នក
          </p>
        </div>

        {/* Main Input Form - Lovable Style */}
        <div className="w-full max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            {/* Multi-line Text Area - 3 lines like Lovable */}
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="ឧទាហរណ៍: បង្កើត website សម្រាប់ restaurant ដែលមានមុខងារកម្មង់អាហារ, ទំព័រមុខស្អាត, និងភាពងាយស្រួលក្នុងការប្រើប្រាស់..."
                className="w-full h-32 px-6 py-4 pr-16 text-lg bg-black/80 backdrop-blur-sm border border-white/10 rounded-2xl focus:border-orange-400/50 focus:ring-2 focus:ring-orange-400/20 focus:outline-none transition-all font-khmer placeholder:text-white/40 text-white resize-none shadow-2xl"
                rows={3}
                autoFocus
              />
              
              {/* Submit Button - Arrow Style like Lovable */}
              <button
                type="submit"
                disabled={!prompt.trim()}
                className="absolute bottom-4 right-4 w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center group"
              >
                <svg 
                  className="w-6 h-6 transform group-hover:scale-110 transition-transform" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>

          {/* Hints and Status */}
          <div className="text-center mt-8">
            <p className="text-white/50 text-sm font-khmer">
              {user 
                ? "ចាប់ផ្តើមបង្កើតកម្មវិធីរបស់អ្នកឥឡូវនេះ" 
                : "ចូលប្រើដើម្បីចាប់ផ្តើមបង្កើតកម្មវិធី"
              }
            </p>
            
            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <span className="px-4 py-2 bg-white/10 text-white/70 rounded-full text-sm backdrop-blur-sm border border-white/10">
                🚀 រហ័សលឿន
              </span>
              <span className="px-4 py-2 bg-white/10 text-white/70 rounded-full text-sm backdrop-blur-sm border border-white/10">
                🎨 រចនាស្អាត
              </span>
              <span className="px-4 py-2 bg-white/10 text-white/70 rounded-full text-sm backdrop-blur-sm border border-white/10">
                🤖 AI ទំនើប
              </span>
              <span className="px-4 py-2 bg-white/10 text-white/70 rounded-full text-sm backdrop-blur-sm border border-white/10">
                🇰🇭 ភាសាខ្មែរ
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}