"use client";

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { km } from 'date-fns/locale';

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

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (project: Project) => void;
  currentProjectId?: string;
}

export function ProjectSidebar({ isOpen, onClose, onSelectProject, currentProjectId }: ProjectSidebarProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
    }
  }, [isOpen]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data = await response.json();
      setProjects(data.projects || []);
    } catch (err) {
      setError('មិនអាចទាញយកគម្រោងបានទេ');
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!confirm('តើអ្នកពិតជាចង់លុបគម្រោងនេះមែនទេ?')) return;

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      // Refresh projects list
      await fetchProjects();
    } catch (err) {
      console.error('Error deleting project:', err);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-80 bg-black/90 backdrop-blur-xl border-r border-white/10 
        transform transition-transform duration-300 ease-in-out z-50
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white font-khmer">គម្រោងរបស់ខ្ញុំ</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Projects List */}
        <div className="h-[calc(100%-88px)] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-red-400 font-khmer">{error}</p>
              <button
                onClick={fetchProjects}
                className="mt-4 text-orange-400 hover:text-orange-300 text-sm font-medium"
              >
                ព្យាយាមម្តងទៀត
              </button>
            </div>
          ) : projects.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-white/40 font-khmer mb-2">មិនមានគម្រោងទេ</p>
              <p className="text-white/30 text-sm font-khmer">ចាប់ផ្តើមបង្កើតគម្រោងថ្មី</p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={`
                    group relative p-4 rounded-xl cursor-pointer transition-all duration-200
                    ${currentProjectId === project.id 
                      ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30' 
                      : 'hover:bg-white/5 border border-transparent hover:border-white/10'
                    }
                  `}
                  onClick={() => onSelectProject(project)}
                >
                  {/* Project Info */}
                  <div className="pr-8">
                    <h3 className="font-medium text-white mb-1 line-clamp-1">
                      {project.name}
                    </h3>
                    <p className="text-white/50 text-sm line-clamp-2 mb-2">
                      {project.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-white/30">
                      <span>
                        {formatDistanceToNow(new Date(project.lastAccessedAt), { 
                          addSuffix: true,
                          locale: km 
                        })}
                      </span>
                      {project.generatedFiles.length > 0 && (
                        <span>{project.generatedFiles.length} ឯកសារ</span>
                      )}
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteProject(project.id);
                    }}
                    className="absolute top-4 right-4 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded-lg transition-all"
                  >
                    <svg className="w-4 h-4 text-white/40 hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-black/50 backdrop-blur-sm">
          <button
            onClick={() => {
              onClose();
              window.location.href = '/editor';
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500/20 to-red-500/20 hover:from-orange-500/30 hover:to-red-500/30 border border-orange-500/30 text-white rounded-xl transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-khmer">គម្រោងថ្មី</span>
          </button>
        </div>
      </div>
    </>
  );
}