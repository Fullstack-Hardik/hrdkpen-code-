import React, { useState } from 'react';
import { FolderTree, Trash2, Clock, Plus, Download, Pin, FileCode2 } from 'lucide-react';
import type { ProjectMeta } from '@/hooks/use-workspace';

interface ProjectsPanelProps {
  projects: ProjectMeta[];
  activeProjectId: string | null;
  onOpenProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onRenameProject: (id: string, newName: string) => void;
  onCopyProject: (id: string) => void;
  onCreateNew: () => void;
}

export const ProjectsPanel = ({ projects, activeProjectId, onOpenProject, onDeleteProject, onRenameProject, onCopyProject, onCreateNew }: ProjectsPanelProps) => {
  const [search, setSearch] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [filterLang, setFilterLang] = useState<string | null>(null);
  
  const sorted = [...projects]
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    .filter(p => filterLang ? p.language === filterLang : true)
    .sort((a, b) => {
      // Pinned projects first
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      // Then by last opened
      return b.lastOpened - a.lastOpened;
    });

  const allLanguages = Array.from(new Set(projects.map(p => p.language).filter(Boolean)));

  const getLanguageColor = (lang?: string) => {
    switch (lang) {
      case 'react': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'html': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'node': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'python': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      default: return 'text-editor-text-muted bg-editor-active-tab border-editor-border';
    }
  };

  return (
    <div className="flex flex-col h-full bg-editor-bg">
      <div className="flex items-center justify-between px-4 py-3 border-b border-editor-border bg-editor-sidebar flex-shrink-0">
        <div className="flex items-center gap-2">
          <FolderTree className="w-4 h-4 text-editor-accent" />
          <span className="text-sm font-semibold text-editor-text">Projects</span>
        </div>
        <button
          onClick={onCreateNew}
          className="text-editor-text-muted hover:text-editor-text transition-colors"
          title="New Project"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="px-3 py-3 border-b border-editor-border flex-shrink-0 flex flex-col gap-2 bg-editor-sidebar">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search projects..."
          className="w-full h-8 px-2.5 text-xs bg-editor-bg border border-editor-border rounded text-editor-text outline-none focus:border-editor-accent transition-colors"
        />
        {allLanguages.length > 0 && (
          <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-1">
            <button
              onClick={() => setFilterLang(null)}
              className={`px-2 py-1 rounded text-[10px] font-medium whitespace-nowrap transition-colors ${!filterLang ? 'bg-editor-accent text-white' : 'bg-editor-active-tab text-editor-text-muted hover:text-editor-text'}`}
            >
              All
            </button>
            {allLanguages.map(lang => (
              <button
                key={lang}
                onClick={() => setFilterLang(lang as string)}
                className={`px-2 py-1 rounded text-[10px] font-medium whitespace-nowrap transition-colors ${filterLang === lang ? 'bg-editor-accent text-white' : 'bg-editor-active-tab text-editor-text-muted hover:text-editor-text'}`}
              >
                {lang}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="w-12 h-12 rounded-full bg-editor-active-tab flex items-center justify-center mb-3">
              <FolderTree className="w-6 h-6 text-editor-text-muted" />
            </div>
            <p className="text-sm font-medium text-editor-text mb-1">No projects found</p>
            <p className="text-xs text-editor-text-dim mb-4">Create a new project to get started.</p>
            <button
              onClick={onCreateNew}
              className="px-4 py-2 bg-editor-accent hover:opacity-90 text-white text-xs font-medium rounded transition-opacity"
            >
              Create New Project
            </button>
          </div>
        ) : (
          sorted.map(proj => (
            <div
              key={proj.id}
              className={`group relative flex flex-col p-3 rounded-lg cursor-pointer transition-all border ${
                activeProjectId === proj.id 
                  ? 'bg-blue-500/5 border-blue-500/50 shadow-md shadow-blue-500/10' 
                  : 'bg-editor-panel border-editor-border hover:border-editor-text-dim hover:shadow-md'
              }`}
              onClick={() => onOpenProject(proj.id)}
            >
              <div className="flex items-start justify-between mb-2">
                {renamingId === proj.id ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && renameValue.trim()) {
                        onRenameProject(proj.id, renameValue.trim());
                        setRenamingId(null);
                      } else if (e.key === 'Escape') {
                        setRenamingId(null);
                      }
                    }}
                    onBlur={() => {
                      if (renameValue.trim()) onRenameProject(proj.id, renameValue.trim());
                      setRenamingId(null);
                    }}
                    className="text-sm font-medium bg-editor-bg border border-editor-accent outline-none px-1 rounded text-editor-text w-full mr-2"
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <span className="text-sm font-semibold text-editor-text truncate pr-2">{proj.name}</span>
                )}
                
                {proj.isFavorite && (
                  <Pin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 fill-current" />
                )}
              </div>

              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2">
                  {proj.language && (
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${getLanguageColor(proj.language)}`}>
                      {proj.language}
                    </span>
                  )}
                  <span className="text-[10px] text-editor-text-dim flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {new Date(proj.lastOpened).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Hover Actions */}
              {!renamingId && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 transition-opacity bg-editor-panel/90 backdrop-blur-sm rounded p-0.5 shadow-sm border border-editor-border">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenameValue(proj.name);
                      setRenamingId(proj.id);
                    }}
                    className="p-1.5 text-editor-text-muted hover:text-blue-400 hover:bg-blue-500/10 rounded transition-all"
                    title="Rename Project"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCopyProject(proj.id);
                    }}
                    className="p-1.5 text-editor-text-muted hover:text-green-400 hover:bg-green-500/10 rounded transition-all"
                    title="Duplicate Project"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteProject(proj.id);
                    }}
                    className="p-1.5 text-editor-text-muted hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
                    title="Delete Project"
                  >
                    <Trash2 className="w-12 h-12" style={{width: '12px', height: '12px'}} />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
