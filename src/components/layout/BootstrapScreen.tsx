import React from 'react';
import { FolderPlus, Terminal, Code2, Coffee, Clock, Trash2, ExternalLink } from 'lucide-react';
import type { TEMPLATES } from '@/lib/templates';
import type { ProjectMeta } from '@/hooks/use-workspace';

interface BootstrapScreenProps {
  projects?: ProjectMeta[];
  onOpenProject?: (id: string) => void;
  onDeleteProject?: (id: string) => void;
  onLoadTemplate: (type: keyof typeof TEMPLATES | 'empty') => void;
  onImportFolder: () => void;
}

export const BootstrapScreen = ({ projects = [], onOpenProject, onDeleteProject, onLoadTemplate, onImportFolder }: BootstrapScreenProps) => {
  const sortedProjects = [...projects].sort((a, b) => b.lastOpened - a.lastOpened);

  return (
    <div className="flex flex-col items-center justify-start w-full h-full bg-editor-bg text-editor-text font-sans p-6 overflow-y-auto">
      <div className="max-w-4xl w-full space-y-10 mt-10">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Welcome to HRDK Pen</h1>
          <p className="text-editor-text-muted text-lg max-w-lg mx-auto">
            A persistent, professional coding environment right in your browser. Choose a template or open a recent project.
          </p>
        </div>

        {sortedProjects.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" /> Recent Projects
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedProjects.map(proj => (
                <div key={proj.id} className="flex flex-col p-4 bg-editor-sidebar border border-editor-border rounded-xl hover:border-blue-500 hover:bg-editor-active-tab transition-all group relative">
                  <h3 className="font-semibold text-white mb-1 truncate pr-8">{proj.name}</h3>
                  <p className="text-xs text-editor-text-muted mb-4">
                    Opened {new Date(proj.lastOpened).toLocaleString()}
                  </p>
                  <div className="flex gap-2 mt-auto">
                    <button
                      onClick={() => onOpenProject?.(proj.id)}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs py-1.5 rounded transition-colors"
                    >
                      Open Project
                    </button>
                    <button
                      onClick={() => {
                        window.open(window.location.href, '_blank');
                        onOpenProject?.(proj.id);
                      }}
                      className="px-2 bg-editor-bg border border-editor-border hover:bg-surface0 text-editor-text-muted hover:text-white rounded transition-colors"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {onDeleteProject && (
                    <button 
                      onClick={() => onDeleteProject(proj.id)}
                      className="absolute top-4 right-4 p-1.5 text-editor-text-muted opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all rounded hover:bg-red-500/10"
                      title="Delete project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Start New</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            {/* Templates */}
            <button 
              onClick={() => onLoadTemplate('react')}
              className="flex flex-col p-5 bg-editor-sidebar border border-editor-border rounded-xl hover:border-blue-500 hover:bg-editor-active-tab transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Code2 className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white mb-1">React + Vite</h3>
              <p className="text-xs text-editor-text-muted">Modern frontend web development.</p>
            </button>

            <button 
              onClick={() => onLoadTemplate('node')}
              className="flex flex-col p-5 bg-editor-sidebar border border-editor-border rounded-xl hover:border-green-500 hover:bg-editor-active-tab transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-green-500/10 text-green-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Terminal className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white mb-1">Node.js</h3>
              <p className="text-xs text-editor-text-muted">Backend JavaScript environment.</p>
            </button>

            <button 
              onClick={() => onLoadTemplate('html')}
              className="flex flex-col p-5 bg-editor-sidebar border border-editor-border rounded-xl hover:border-orange-500 hover:bg-editor-active-tab transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Code2 className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white mb-1">HTML / CSS / JS</h3>
              <p className="text-xs text-editor-text-muted">Standard static web project.</p>
            </button>

            <button 
              onClick={() => onLoadTemplate('c')}
              className="flex flex-col p-5 bg-editor-sidebar border border-editor-border rounded-xl hover:border-purple-500 hover:bg-editor-active-tab transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Coffee className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white mb-1">C / C++</h3>
              <p className="text-xs text-editor-text-muted">Compile and run native C/C++ code.</p>
            </button>
            
            {/* Import */}
            <button 
              onClick={onImportFolder}
              className="flex flex-col p-5 bg-editor-sidebar border border-editor-border border-dashed rounded-xl hover:border-editor-text hover:bg-editor-active-tab transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-white/5 text-editor-text-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FolderPlus className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white mb-1">Import Folder</h3>
              <p className="text-xs text-editor-text-muted">Load an existing project from your PC.</p>
            </button>

            {/* Empty */}
            <button 
              onClick={() => onLoadTemplate('empty')}
              className="flex flex-col p-5 bg-editor-sidebar border border-editor-border border-dashed rounded-xl hover:border-editor-text hover:bg-editor-active-tab transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-white/5 text-editor-text-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FolderPlus className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white mb-1">Empty Project</h3>
              <p className="text-xs text-editor-text-muted">Start fresh with no files.</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
