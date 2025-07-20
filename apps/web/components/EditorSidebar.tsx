"use client";

import { useState, useEffect, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { km } from 'date-fns/locale';
import api from '@/lib/api';

interface Project {
  id: string;
  name: string;
  description: string;
  prompt: string;
  previewUrl?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt: string;
  generatedFiles: any[];
}

interface EditorSidebarProps {
  onSelectProject: (project: Project) => void;
  currentProjectId?: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

type ViewMode = 'all' | 'recent' | 'archived';

export function EditorSidebar({ 
  onSelectProject, 
  currentProjectId, 
  isCollapsed,
  onToggleCollapse 
}: EditorSidebarProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
    // Refresh projects every 30 seconds
    const interval = setInterval(fetchProjects, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data.projects || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let filtered = projects;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.prompt.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by view mode
    if (viewMode === 'recent') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      filtered = filtered.filter(p => new Date(p.lastAccessedAt) > oneWeekAgo);
    } else if (viewMode === 'archived') {
      filtered = filtered.filter(p => p.status === 'ARCHIVED');
    }

    // Sort by last accessed
    return filtered.sort((a, b) => 
      new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime()
    );
  }, [projects, searchQuery, viewMode]);

  const deleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('តើអ្នកពិតជាចង់លុបគម្រោងនេះមែនទេ?')) return;

    try {
      await api.delete(`/projects/${projectId}`);
      await fetchProjects();
    } catch (err) {
      console.error('Error deleting project:', err);
    }
  };

  const archiveProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await api.patch(`/projects/${projectId}/archive`);
      await fetchProjects();
    } catch (err) {
      console.error('Error archiving project:', err);
    }
  };

  const getProjectIcon = (project: Project) => {
    const fileCount = project.generatedFiles.length;
    if (fileCount === 0) return '📄';
    if (fileCount < 5) return '📁';
    if (fileCount < 10) return '📂';
    return '🗂️';
  };

  return (
    <aside className={`
      fixed left-0 top-0 h-full bg-black/95 backdrop-blur-xl border-r border-white/10
      transition-all duration-300 ease-in-out z-40
      ${isCollapsed ? 'w-16' : 'w-80'}
    `}>
      {/* Header with Logo */}
      <div className="h-16 border-b border-white/10 flex items-center justify-between px-4">
        <a href="/" className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2'}`}>
          <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          {!isCollapsed && (
            <span className="text-white font-bold text-xl">prahok</span>
          )}
        </a>
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors ml-auto"
          title={isCollapsed ? "ពង្រីក" : "បង្រួម"}
        >
          <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isCollapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            )}
          </svg>
        </button>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <>
          {/* Search */}
          <div className="p-3 border-b border-white/10">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ស្វែងរកគម្រោង..."
                className="w-full pl-8 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all"
              />
              <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="flex items-center gap-1 p-3 border-b border-white/10">
            {(['all', 'recent', 'archived'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`
                  flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all
                  ${viewMode === mode 
                    ? 'bg-white/10 text-white' 
                    : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                  }
                `}
              >
                {mode === 'all' && 'ទាំងអស់'}
                {mode === 'recent' && 'ថ្មីៗ'}
                {mode === 'archived' && 'ទុកដាក់'}
              </button>
            ))}
          </div>

          {/* Projects List */}
          <div className="h-[calc(100%-224px)] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-white/40 text-sm mb-2">មិនមានគម្រោងទេ</p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-orange-400 hover:text-orange-300 text-xs"
                  >
                    សម្អាតការស្វែងរក
                  </button>
                )}
              </div>
            ) : (
              <div className="py-2">
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    className={`
                      group relative mx-2 mb-1 rounded-lg cursor-pointer transition-all duration-200
                      ${currentProjectId === project.id 
                        ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30' 
                        : 'hover:bg-white/5 border border-transparent'
                      }
                    `}
                    onClick={() => onSelectProject(project)}
                    onMouseEnter={() => setHoveredProject(project.id)}
                    onMouseLeave={() => setHoveredProject(null)}
                  >
                    <div className="flex items-start gap-3 p-3">
                      {/* Icon */}
                      <div className="text-2xl mt-0.5 opacity-80">
                        {getProjectIcon(project)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm text-white mb-0.5 truncate">
                          {project.name}
                        </h3>
                        <p className="text-xs text-white/50 line-clamp-1">
                          {project.description}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs text-white/30">
                            {formatDistanceToNow(new Date(project.lastAccessedAt), { 
                              addSuffix: true,
                              locale: km 
                            })}
                          </span>
                          {project.generatedFiles.length > 0 && (
                            <span className="text-xs text-white/30">
                              {project.generatedFiles.length} ឯកសារ
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className={`flex items-center gap-1 transition-opacity ${hoveredProject === project.id ? 'opacity-100' : 'opacity-0'}`}>
                        {project.status !== 'ARCHIVED' && (
                          <button
                            onClick={(e) => archiveProject(project.id, e)}
                            className="p-1.5 hover:bg-white/10 rounded transition-colors"
                            title="ទុកដាក់"
                          >
                            <svg className="w-3.5 h-3.5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={(e) => deleteProject(project.id, e)}
                          className="p-1.5 hover:bg-white/10 rounded transition-colors"
                          title="លុប"
                        >
                          <svg className="w-3.5 h-3.5 text-white/60 hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Status indicator */}
                    {project.status === 'ARCHIVED' && (
                      <div className="absolute top-2 right-2 w-2 h-2 bg-yellow-500/50 rounded-full"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Stats */}
          <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/10 bg-black/50 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs text-white/40">
              <span>{projects.length} គម្រោងសរុប</span>
              <button
                onClick={() => window.location.href = '/editor'}
                className="text-orange-400 hover:text-orange-300 transition-colors"
              >
                + គម្រោងថ្មី
              </button>
            </div>
          </div>
        </>
      )}

      {/* Collapsed State */}
      {isCollapsed && (
        <div className="flex flex-col h-[calc(100%-64px)]">
          {/* Quick Actions */}
          <div className="p-2 space-y-2 border-b border-white/10">
            <button
              onClick={() => window.location.href = '/editor'}
              className="w-full p-2.5 hover:bg-white/10 rounded-lg transition-colors flex justify-center"
              title="គម្រោងថ្មី"
            >
              <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          
          {/* Project Count */}
          <div className="mt-auto p-4 text-center">
            <div className="text-white/40 text-xs font-medium">{projects.length}</div>
            <div className="text-white/30 text-xs">គម្រោង</div>
          </div>
        </div>
      )}
    </aside>
  );
}