"use client";

import { useState, useEffect, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
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

export function EditorSidebar({ 
  onSelectProject, 
  currentProjectId, 
  isCollapsed,
  onToggleCollapse 
}: EditorSidebarProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProjects();
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


    // Sort by last accessed
    return filtered.sort((a, b) => 
      new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime()
    );
  }, [projects, searchQuery]);

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


  return (
    <aside className={`
      fixed left-0 top-0 h-full bg-gray-50 border-r border-gray-200
      transition-all duration-200 z-40
      ${isCollapsed ? 'w-16' : 'w-80'}
    `}>
      {/* Header with Logo */}
      <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4 bg-white">
        <a href="/" className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2'}`}>
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-sm">P</span>
          </div>
          {!isCollapsed && (
            <span className="text-gray-900 font-medium text-lg">prahok</span>
          )}
        </a>
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors ml-auto"
          title={isCollapsed ? "ពង្រីក" : "បង្រួម"}
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="p-4 bg-white">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ស្វែងរកគម្រោង..."
                className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
              />
              <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>


          {/* Projects List */}
          <div className="flex-1 overflow-y-auto bg-white">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-black"></div>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-400 text-sm mb-2">មិនមានគម្រោងទេ</p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-gray-600 hover:text-gray-900 text-xs"
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
                      group relative cursor-pointer transition-all duration-200
                      ${currentProjectId === project.id 
                        ? 'bg-gray-100 border-l-2 border-black' 
                        : 'hover:bg-gray-50 border-l-2 border-transparent'
                      }
                    `}
                    onClick={() => onSelectProject(project)}
                  >
                    <div className="flex items-start gap-3 px-4 py-3">

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm text-gray-900 mb-0.5 truncate">
                          {project.name}
                        </h3>
                        <p className="text-xs text-gray-500 line-clamp-1">
                          {project.description}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(project.lastAccessedAt), { 
                              addSuffix: true
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Actions - Always visible */}
                      <button
                        onClick={(e) => deleteProject(project.id, e)}
                        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                        title="លុប"
                      >
                        <svg className="w-4 h-4 text-gray-400 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

          {/* New Project Button */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <button
              onClick={() => window.location.href = '/editor'}
              className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors text-center"
            >
              + គម្រោងថ្មី
            </button>
          </div>
        </>
      )}

      {/* Collapsed State */}
      {isCollapsed && (
        <div className="flex flex-col h-[calc(100%-64px)] bg-white">
          {/* Quick Actions */}
          <div className="p-2 space-y-2">
            <button
              onClick={() => window.location.href = '/editor'}
              className="w-full p-2.5 hover:bg-gray-100 rounded-lg transition-colors flex justify-center"
              title="គម្រោងថ្មី"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}