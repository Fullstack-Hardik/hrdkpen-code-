import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Folder,
  FolderOpen,
  Plus,
  FolderPlus,
  MoreHorizontal,
  Trash2,
  Edit3,
  Upload,
  Play,
  Copy,
  RefreshCw,
} from 'lucide-react';
import { getFileLanguageIcon } from '@/utils/languageIcons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import type { FileNode } from '@/types';

// Re-export for components that still import from here
export type { FileNode };

interface _Unused {
  _unused?: never;
}

interface FileExplorerProps {
  files: FileNode[];
  onFileSelect: (file: FileNode) => void;
  onFileCreate: (name: string, type: 'file' | 'folder', parentId?: string) => void;
  onFileDelete: (id: string) => void;
  onFileRename: (id: string, newName: string) => void;
  selectedFileId?: string;
  onImportFolder?: (files: { path: string; content: string }[]) => void;
  onMove?: (dragId: string, targetFolderId: string | null) => void;
  onLoadTemplate?: (type: 'html' | 'node' | 'express' | 'react' | 'python' | 'c' | 'cpp') => void;
  onSync?: () => void;
}

export const FileExplorer = ({
  files,
  onFileSelect,
  onFileCreate,
  onFileDelete,
  onFileRename,
  selectedFileId,
  onImportFolder,
  onMove,
  onLoadTemplate,
  onSync,
}: FileExplorerProps) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [creatingFile, setCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const folderInputRef = useRef<HTMLInputElement>(null);

  const toggleFolder = (id: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedFolders(newExpanded);
  };

  const getFileIcon = (file: FileNode) => {
    if (file.type === 'folder') {
      return expandedFolders.has(file.id) ? 
        <FolderOpen className="w-4 h-4 text-editor-accent" /> : 
        <Folder className="w-4 h-4 text-editor-accent" />;
    }
    return getFileLanguageIcon(file.name);
  };

  const canRunFile = (_file: FileNode): boolean => false; // Run handled in editor toolbar

  const startEdit = (file: FileNode) => {
    setEditingId(file.id);
    setEditingName(file.name);
  };

  const finishEdit = () => {
    if (editingId && editingName.trim()) {
      onFileRename(editingId, editingName.trim());
    }
    setEditingId(null);
    setEditingName('');
  };

  const renderFileNode = (file: FileNode, depth = 0) => {
    const isSelected = selectedFileId === file.id;
    const isExpanded = expandedFolders.has(file.id);
    
    return (
      <div key={file.id}>
        <ContextMenu>
          <ContextMenuTrigger>
            <div 
              className={`
                flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-editor group
                hover:bg-editor-active-tab
                ${isSelected ? 'bg-editor-active-tab text-editor-text' : 'text-editor-text-muted'}
              `}
              /* Removed manual paddingLeft because we now use nested div margins */
              onClick={() => {
                if (file.type === 'folder') {
                  toggleFolder(file.id);
                } else {
                  onFileSelect(file);
                }
              }}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/file-id', file.id);
              }}
              onDragOver={(e) => {
                if (file.type === 'folder') {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const dragId = e.dataTransfer.getData('text/file-id');
                if (!dragId) return;
                if (file.type === 'folder') onMove?.(dragId, file.id);
              }}
            >
              {getFileIcon(file)}
              
              {editingId === file.id ? (
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={finishEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') finishEdit();
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  className="h-6 text-xs bg-editor-panel border-editor-border focus:border-editor-accent"
                  autoFocus
                />
              ) : (
                <span className="flex-1 text-sm">{file.name}</span>
              )}
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0"
                    >
                      <MoreHorizontal className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-40">
                    <DropdownMenuItem onClick={() => startEdit(file)}>
                      <Edit3 className="w-3 h-3 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      const baseName = file.name.includes('.') ? file.name.substring(0, file.name.lastIndexOf('.')) : file.name;
                      const ext = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')) : '';
                      onFileCreate(`${baseName}_copy${ext}`, file.type, undefined);
                    }}>
                      <Copy className="w-3 h-3 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onFileDelete(file.id)}
                      className="text-editor-error"
                    >
                      <Trash2 className="w-3 h-3 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </ContextMenuTrigger>

          <ContextMenuContent className="w-40 bg-editor-panel border-editor-border text-editor-text">
            {file.type === 'folder' && (
              <>
                <ContextMenuItem onClick={() => {
                  setCreatingFile(true);
                  setNewFileName('New File');
                  // TODO: pass folder context if needed, currently onFileCreate needs modifying or we handle globally
                  // The existing implementation for global 'new file' works, but we can pass `file.id` as parentId
                  onFileCreate('new_file', 'file', file.id);
                }}>
                  <Plus className="w-3 h-3 mr-2" />
                  New File
                </ContextMenuItem>
                <ContextMenuItem onClick={() => {
                  onFileCreate('new_folder', 'folder', file.id);
                }}>
                  <FolderPlus className="w-3 h-3 mr-2" />
                  New Folder
                </ContextMenuItem>
                <ContextMenuSeparator className="bg-editor-border" />
              </>
            )}
            <ContextMenuItem onClick={() => startEdit(file)}>
              <Edit3 className="w-3 h-3 mr-2" />
              Rename
            </ContextMenuItem>
            <ContextMenuItem onClick={() => {
              const baseName = file.name.includes('.') ? file.name.substring(0, file.name.lastIndexOf('.')) : file.name;
              const ext = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')) : '';
              onFileCreate(`${baseName}_copy${ext}`, file.type, undefined);
            }}>
              <Copy className="w-3 h-3 mr-2" />
              Duplicate
            </ContextMenuItem>
            <ContextMenuSeparator className="bg-editor-border" />
            <ContextMenuItem 
              onClick={() => onFileDelete(file.id)}
              className="text-editor-error focus:text-editor-error focus:bg-editor-error/10"
            >
              <Trash2 className="w-3 h-3 mr-2" />
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
        
        {file.type === 'folder' && isExpanded && file.children && (
          <div className="ml-3 pl-1 border-l border-editor-border/30">
            {file.children.map(child => renderFileNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="editor-sidebar h-full border-r border-border flex flex-col">
          {/* File Explorer Header */}
          <div className="flex items-center justify-between p-3 border-b border-border flex-shrink-0">
            <h3 className="text-sm font-semibold text-editor-text">Explorer</h3>
            <div className="flex gap-1">
              {onImportFolder && (
                <input
                  ref={folderInputRef}
                  type="file"
                  {...({ webkitdirectory: "true" } as any)}
                  multiple
                  className="hidden"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    const reads = await Promise.all(
                      files.map((f: any) =>
                        new Promise<{ path: string; content: string }>((resolve) => {
                          const reader = new FileReader();
                          reader.onload = () => resolve({ path: (f as any).webkitRelativePath || f.name, content: String(reader.result || '') });
                          reader.readAsText(f);
                        })
                      )
                    );
                    onImportFolder(reads);
                    e.currentTarget.value = '';
                  }}
                />
              )}
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6 hover:bg-editor-active-tab text-editor-text-muted hover:text-white"
                onClick={() => setCreatingFile(true)}
                title="New File"
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
              {onSync && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6 hover:bg-editor-active-tab text-editor-text-muted hover:text-white"
                  onClick={onSync}
                  title="Sync from WebContainer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-6 h-6 hover:bg-editor-active-tab text-editor-text-muted hover:text-white"
                    title="More Options"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-editor-panel border-editor-border text-editor-text">
                  <DropdownMenuItem onClick={() => setCreatingFile(true)} className="hover:bg-editor-active-tab cursor-pointer text-xs focus:bg-editor-active-tab focus:text-white">
                    <Plus className="w-3.5 h-3.5 mr-2" />
                    New File
                  </DropdownMenuItem>
                  {onLoadTemplate && (
                    <DropdownMenuItem onClick={() => onLoadTemplate('html')} className="hover:bg-editor-active-tab cursor-pointer text-xs focus:bg-editor-active-tab focus:text-white">
                      <FolderPlus className="w-3.5 h-3.5 mr-2 text-orange-400" />
                      HTML Template
                    </DropdownMenuItem>
                  )}
                  {onLoadTemplate && (
                    <DropdownMenuItem onClick={() => onLoadTemplate('react')} className="hover:bg-editor-active-tab cursor-pointer text-xs focus:bg-editor-active-tab focus:text-white">
                      <FolderPlus className="w-3.5 h-3.5 mr-2 text-cyan-400" />
                      React + Vite Project
                    </DropdownMenuItem>
                  )}
                  {onLoadTemplate && (
                    <DropdownMenuItem onClick={() => onLoadTemplate('express')} className="hover:bg-editor-active-tab cursor-pointer text-xs focus:bg-editor-active-tab focus:text-white">
                      <FolderPlus className="w-3.5 h-3.5 mr-2 text-green-400" />
                      Express API Server
                    </DropdownMenuItem>
                  )}
                  {onLoadTemplate && (
                    <DropdownMenuItem onClick={() => onLoadTemplate('node')} className="hover:bg-editor-active-tab cursor-pointer text-xs focus:bg-editor-active-tab focus:text-white">
                      <FolderPlus className="w-3.5 h-3.5 mr-2 text-green-500" />
                      Node.js Script
                    </DropdownMenuItem>
                  )}
                  {onImportFolder && (
                    <>
                      <DropdownMenuItem onClick={() => onLoadTemplate('node')}>Node.js</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onLoadTemplate('express')}>Express</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onLoadTemplate('react')}>React (Vite)</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onLoadTemplate('python')}>Python</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onLoadTemplate('c')}>C</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onLoadTemplate('cpp')}>C++</DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5 pb-20">
            {files.map(file => renderFileNode(file))}
            
            {creatingFile && (
              <div className="flex items-center gap-2 px-2 py-1 ml-4 mt-1">
                <FileIcon />
                <Input
                  value={newFileName}
                  onChange={e => setNewFileName(e.target.value)}
                  onBlur={() => {
                    if (newFileName.trim()) {
                      onFileCreate(newFileName.trim(), 'file');
                    }
                    setCreatingFile(false);
                    setNewFileName('');
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      if (newFileName.trim()) {
                        onFileCreate(newFileName.trim(), 'file');
                      }
                      setCreatingFile(false);
                      setNewFileName('');
                    }
                    if (e.key === 'Escape') {
                      setCreatingFile(false);
                      setNewFileName('');
                    }
                  }}
                  className="h-6 text-xs bg-editor-panel border-editor-border focus:border-editor-accent"
                  autoFocus
                />
              </div>
            )}
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48 bg-editor-panel border-editor-border text-editor-text">
        <ContextMenuItem onClick={() => setCreatingFile(true)}>
          <Plus className="w-3.5 h-3.5 mr-2" /> New File
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onFileCreate('new-folder', 'folder')}>
          <FolderPlus className="w-3.5 h-3.5 mr-2" /> New Folder
        </ContextMenuItem>
        {onImportFolder && (
          <ContextMenuItem onClick={() => folderInputRef.current?.click()}>
            <Upload className="w-3.5 h-3.5 mr-2" /> Import Folder
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};

const FileIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-editor-text-muted">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);