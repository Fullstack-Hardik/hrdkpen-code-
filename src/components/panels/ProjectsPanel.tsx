import React, { useState } from 'react';
import { FolderTree, Trash2, Clock, Plus } from 'lucide-react';
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
  
  const sorted = [...projects]
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.lastOpened - a.lastOpened);

  return (
    <div className="flex flex-col h-full bg-editor-sidebar">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
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

      <div className="px-3 py-2 border-b border-editor-border flex-shrink-0 flex flex-col gap-2">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search projects..."
          className="w-full h-7 px-2 text-xs bg-editor-bg border border-editor-border rounded text-editor-text outline-none focus:border-editor-accent"
        />
        <button
          onClick={onCreateNew}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New Project
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sorted.length === 0 ? (
          <p className="text-xs text-editor-text-dim text-center py-4">No projects found.</p>
        ) : (
          sorted.map(proj => (
            <div
              key={proj.id}
              className={`group flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                activeProjectId === proj.id 
                  ? 'bg-blue-500/10 border border-blue-500/30 text-blue-400' 
                  : 'hover:bg-editor-active-tab border border-transparent text-editor-text'
              }`}
              onClick={() => onOpenProject(proj.id)}
            >
              {renamingId === proj.id ? (
                <div className="flex flex-col min-w-0 flex-1">
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
                    className="text-sm font-medium bg-editor-bg border border-editor-accent outline-none px-1 rounded text-editor-text"
                    onClick={e => e.stopPropagation()}
                  />
                </div>
              ) : (
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-medium truncate">{proj.name}</span>
                  <span className="text-[10px] text-editor-text-dim flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> {new Date(proj.lastOpened).toLocaleDateString()}
                  </span>
                </div>
              )}
              
              {!renamingId && (
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenameValue(proj.name);
                      setRenamingId(proj.id);
                    }}
                    className="p-1.5 text-editor-text-muted hover:text-blue-400 hover:bg-blue-500/10 rounded transition-all"
                    title="Rename Project"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCopyProject(proj.id);
                    }}
                    className="p-1.5 text-editor-text-muted hover:text-green-400 hover:bg-green-500/10 rounded transition-all"
                    title="Duplicate Project"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteProject(proj.id);
                    }}
                    className="p-1.5 text-editor-text-muted hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
                    title="Delete Project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
