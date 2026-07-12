import { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FilePlus,
  FolderPlus,
  MoreHorizontal,
  Trash2,
  Edit3,
  Upload,
  Copy,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Plus,
  Scissors,
  Download,
  Share2
} from 'lucide-react';
import { getFileLanguageIcon } from '@/utils/languageIcons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import type { FileNode } from '@/types';

export type { FileNode };

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
  projectName?: string;
}

interface CreatingState {
  parentId: string | null;
  type: 'file' | 'folder';
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
  projectName,
}: FileExplorerProps) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [creating, setCreating] = useState<CreatingState | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const newItemInputRef = useRef<HTMLInputElement>(null);

  const toggleFolder = useCallback((id: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const startEdit = useCallback((file: FileNode) => {
    setEditingId(file.id);
    setEditingName(file.name);
  }, []);

  const finishEdit = useCallback(() => {
    if (editingId && editingName.trim()) {
      onFileRename(editingId, editingName.trim());
    }
    setEditingId(null);
    setEditingName('');
  }, [editingId, editingName, onFileRename]);

  const startCreating = useCallback((type: 'file' | 'folder', parentId: string | null = null) => {
    if (parentId) {
      setExpandedFolders(prev => new Set([...prev, parentId]));
    }
    setCreating({ parentId, type });
    setNewItemName('');
    setTimeout(() => newItemInputRef.current?.focus(), 50);
  }, []);

  const finishCreating = useCallback(() => {
    if (creating && newItemName.trim()) {
      onFileCreate(newItemName.trim(), creating.type, creating.parentId ?? undefined);
    }
    setCreating(null);
    setNewItemName('');
  }, [creating, newItemName, onFileCreate]);

  const renderFileNode = (file: FileNode, depth = 0) => {
    const isSelected = selectedFileId === file.id;
    const isExpanded = expandedFolders.has(file.id);
    const isDragTarget = dragOverId === file.id;
    const isFolder = file.type === 'folder';

    return (
      <div key={file.id} className="select-none">
        <ContextMenu>
          <ContextMenuTrigger>
            <div
              className={`explorer-item group relative ${isSelected ? 'selected' : ''} ${isDragTarget ? 'ring-1 ring-inset ring-blue-500/50' : ''}`}
              style={{ paddingLeft: `${depth * 12 + 6}px` }}
              onClick={() => {
                if (isFolder) {
                  toggleFolder(file.id);
                } else {
                  onFileSelect(file);
                }
              }}
              draggable
              onDragStart={e => e.dataTransfer.setData('text/file-id', file.id)}
              onDragOver={e => {
                if (isFolder) { e.preventDefault(); e.stopPropagation(); setDragOverId(file.id); }
              }}
              onDragLeave={() => setDragOverId(null)}
              onDrop={e => {
                e.preventDefault(); e.stopPropagation();
                setDragOverId(null);
                const dragId = e.dataTransfer.getData('text/file-id');
                if (dragId && isFolder) onMove?.(dragId, file.id);
              }}
            >
              {/* Expand arrow for folders */}
              {isFolder && (
                <span className="w-3 h-3 flex-shrink-0 text-editor-text-dim mr-0.5">
                  {isExpanded
                    ? <ChevronDown className="w-3 h-3" />
                    : <ChevronRight className="w-3 h-3" />}
                </span>
              )}

              {/* Icon */}
              <span className="flex-shrink-0 w-4 h-4">
                {isFolder
                  ? getFileLanguageIcon(file.name, 'w-4 h-4', { isFolder: true, isOpen: isExpanded })
                  : getFileLanguageIcon(file.name, 'w-4 h-4')}
              </span>

              {/* Name / Edit input */}
              {editingId === file.id ? (
                <Input
                  value={editingName}
                  onChange={e => setEditingName(e.target.value)}
                  onBlur={finishEdit}
                  onKeyDown={e => {
                    if (e.key === 'Enter') finishEdit();
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  className="h-5 py-0 px-1 text-xs flex-1 min-w-0 bg-editor-active-tab border-editor-accent"
                  autoFocus
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <span className="flex-1 min-w-0 truncate">{file.name}</span>
              )}

              {/* Hover actions */}
              {editingId !== file.id && (
                <div className="flex items-center gap-0.5 ml-auto opacity-0 group-hover:opacity-100 transition-fast pl-1"
                     onClick={e => e.stopPropagation()}>
                  {isFolder && (
                    <button
                      className="w-5 h-5 flex items-center justify-center rounded hover:bg-editor-active-tab text-editor-text-dim hover:text-editor-text"
                      onClick={() => startCreating('file', file.id)}
                      title="New file in folder"
                    >
                      <FilePlus className="w-3 h-3" />
                    </button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="w-5 h-5 flex items-center justify-center rounded hover:bg-editor-active-tab text-editor-text-dim hover:text-editor-text">
                        <MoreHorizontal className="w-3 h-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-40 text-xs"
                      style={{ background: 'hsl(var(--crust))', border: '1px solid hsl(var(--surface1))' }}
                    >
                      <DropdownMenuItem onClick={() => startEdit(file)} className="gap-2 cursor-pointer text-xs">
                        <Edit3 className="w-3 h-3" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2 cursor-pointer text-xs"
                        onClick={() => {
                          const base = file.name.includes('.') ? file.name.substring(0, file.name.lastIndexOf('.')) : file.name;
                          const ext = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')) : '';
                          onFileCreate(`${base}_copy${ext}`, file.type, undefined);
                        }}
                      >
                        <Copy className="w-3 h-3" /> Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 cursor-pointer text-xs" onClick={() => {}}>
                        <Scissors className="w-3 h-3" /> Cut
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 cursor-pointer text-xs" onClick={() => {
                        if (file.content) {
                          const blob = new Blob([file.content], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = file.name;
                          a.click();
                          URL.revokeObjectURL(url);
                        }
                      }}>
                        <Download className="w-3 h-3" /> Download
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 cursor-pointer text-xs" onClick={() => {}}>
                        <Share2 className="w-3 h-3" /> Share
                      </DropdownMenuItem>
                      {isFolder && (
                        <>
                          <DropdownMenuSeparator className="bg-editor-border" />
                          <DropdownMenuItem className="gap-2 cursor-pointer text-xs" onClick={() => startCreating('file', file.id)}>
                            <FilePlus className="w-3 h-3" /> New File
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 cursor-pointer text-xs" onClick={() => startCreating('folder', file.id)}>
                            <FolderPlus className="w-3 h-3" /> New Folder
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator className="bg-editor-border" />
                      <DropdownMenuItem
                        onClick={() => onFileDelete(file.id)}
                        className="gap-2 cursor-pointer text-xs text-red-400 focus:text-red-400 focus:bg-red-500/10"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </ContextMenuTrigger>

          <ContextMenuContent
            className="w-44 text-xs animate-scale-in"
            style={{ background: 'hsl(var(--crust))', border: '1px solid hsl(var(--surface1))' }}
          >
            {isFolder && (
              <>
                <ContextMenuItem onClick={() => startCreating('file', file.id)} className="gap-2 text-xs cursor-pointer">
                  <FilePlus className="w-3 h-3" /> New File
                </ContextMenuItem>
                <ContextMenuItem onClick={() => startCreating('folder', file.id)} className="gap-2 text-xs cursor-pointer">
                  <FolderPlus className="w-3 h-3" /> New Folder
                </ContextMenuItem>
                <ContextMenuSeparator className="bg-editor-border" />
              </>
            )}
            <ContextMenuItem onClick={() => startEdit(file)} className="gap-2 text-xs cursor-pointer">
              <Edit3 className="w-3 h-3" /> Rename
            </ContextMenuItem>
            <ContextMenuItem
              className="gap-2 text-xs cursor-pointer"
              onClick={() => {
                const base = file.name.includes('.') ? file.name.substring(0, file.name.lastIndexOf('.')) : file.name;
                const ext = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')) : '';
                onFileCreate(`${base}_copy${ext}`, file.type, undefined);
              }}
            >
              <Copy className="w-3 h-3" /> Duplicate
            </ContextMenuItem>
            <ContextMenuSeparator className="bg-editor-border" />
            <ContextMenuItem
              onClick={() => onFileDelete(file.id)}
              className="gap-2 text-xs cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-500/10"
            >
              <Trash2 className="w-3 h-3" /> Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        {/* Children */}
        {isFolder && isExpanded && (
          <div>
            {file.children?.map(child => renderFileNode(child, depth + 1))}
            {/* Inline "new item" input inside this folder */}
            {creating?.parentId === file.id && (
              <div
                className="flex items-center gap-1.5 py-[3px] px-2"
                style={{ paddingLeft: `${(depth + 1) * 12 + 6}px` }}
              >
                <span className="w-4 h-4 flex-shrink-0">
                  {creating.type === 'folder'
                    ? getFileLanguageIcon('new-folder', 'w-4 h-4', { isFolder: true, isOpen: false })
                    : getFileLanguageIcon('new-file', 'w-4 h-4')}
                </span>
                <Input
                  ref={newItemInputRef}
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  onBlur={finishCreating}
                  onKeyDown={e => {
                    if (e.key === 'Enter') finishCreating();
                    if (e.key === 'Escape') setCreating(null);
                  }}
                  placeholder={creating.type === 'folder' ? 'folder-name' : 'filename.ext'}
                  className="h-5 py-0 px-1 text-xs flex-1 bg-editor-active-tab border-editor-accent"
                  autoFocus
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className="flex flex-col h-full"
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault();
            const dragId = e.dataTransfer.getData('text/file-id');
            if (dragId) onMove?.(dragId, null);
          }}
        >
          {/* Hidden folder import input */}
          {onImportFolder && (
            <input
              ref={folderInputRef}
              type="file"
              {...({ webkitdirectory: 'true' } as any)}
              multiple
              className="hidden"
              onChange={async e => {
                const fileList = Array.from(e.target.files || []);
                const reads = await Promise.all(
                  fileList.map(f =>
                    new Promise<{ path: string; content: string }>(resolve => {
                      const reader = new FileReader();
                      reader.onload = () =>
                        resolve({ path: (f as any).webkitRelativePath || f.name, content: String(reader.result || '') });
                      reader.readAsText(f);
                    })
                  )
                );
                onImportFolder(reads);
                e.currentTarget.value = '';
              }}
            />
          )}

          {/* Explorer Header */}
          <div
            className="flex items-center justify-between px-3 py-2 border-b border-editor-border flex-shrink-0"
            style={{ minHeight: 36 }}
          >
            <div className="flex items-center gap-2 min-w-0">
              {projectName && (
                <span
                  className="text-[11px] font-semibold uppercase tracking-widest truncate"
                  style={{ color: 'hsl(var(--overlay2))' }}
                  title={projectName}
                >
                  {projectName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <Button
                variant="ghost" size="icon"
                className="w-6 h-6 text-editor-text-muted hover:text-white hover:bg-editor-active-tab"
                onClick={() => startCreating('file', null)}
                title="New File"
              >
                <FilePlus className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost" size="icon"
                className="w-6 h-6 text-editor-text-muted hover:text-white hover:bg-editor-active-tab"
                onClick={() => startCreating('folder', null)}
                title="New Folder"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </Button>
              {onSync && (
                <Button
                  variant="ghost" size="icon"
                  className="w-6 h-6 text-editor-text-muted hover:text-white hover:bg-editor-active-tab"
                  onClick={onSync}
                  title="Sync from WebContainer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
              )}
              {/* Templates dropdown — single clean menu, no duplicates */}
              {onLoadTemplate && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost" size="icon"
                      className="w-6 h-6 text-yellow-500 hover:text-yellow-400 hover:bg-editor-active-tab"
                      title="New from Template"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48 text-xs animate-scale-in"
                    style={{ background: 'hsl(var(--crust))', border: '1px solid hsl(var(--surface1))' }}
                  >
                    <div className="px-2 py-1.5 text-[10px] uppercase tracking-widest text-editor-text-dim">Templates</div>
                    <DropdownMenuItem onClick={() => onLoadTemplate('html')} className="gap-2 text-xs cursor-pointer">
                      <span className="w-3.5 h-3.5 flex-shrink-0">{getFileLanguageIcon('index.html', 'w-3.5 h-3.5')}</span>
                      HTML / CSS / JS
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onLoadTemplate('react')} className="gap-2 text-xs cursor-pointer">
                      <span className="w-3.5 h-3.5 flex-shrink-0">{getFileLanguageIcon('App.jsx', 'w-3.5 h-3.5')}</span>
                      React + Vite
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onLoadTemplate('express')} className="gap-2 text-xs cursor-pointer">
                      <span className="w-3.5 h-3.5 flex-shrink-0">{getFileLanguageIcon('server.js', 'w-3.5 h-3.5')}</span>
                      Express API Server
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onLoadTemplate('node')} className="gap-2 text-xs cursor-pointer">
                      <span className="w-3.5 h-3.5 flex-shrink-0">{getFileLanguageIcon('index.js', 'w-3.5 h-3.5')}</span>
                      Node.js Script
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onLoadTemplate('python')} className="gap-2 text-xs cursor-pointer">
                      <span className="w-3.5 h-3.5 flex-shrink-0">{getFileLanguageIcon('main.py', 'w-3.5 h-3.5')}</span>
                      Python
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onLoadTemplate('c')} className="gap-2 text-xs cursor-pointer">
                      <span className="w-3.5 h-3.5 flex-shrink-0">{getFileLanguageIcon('main.c', 'w-3.5 h-3.5')}</span>
                      C
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onLoadTemplate('cpp')} className="gap-2 text-xs cursor-pointer">
                      <span className="w-3.5 h-3.5 flex-shrink-0">{getFileLanguageIcon('main.cpp', 'w-3.5 h-3.5')}</span>
                      C++
                    </DropdownMenuItem>
                    {onImportFolder && (
                      <>
                        <div className="px-2 py-1.5 text-[10px] uppercase tracking-widest text-editor-text-dim mt-1">Import</div>
                        <DropdownMenuItem onClick={() => folderInputRef.current?.click()} className="gap-2 text-xs cursor-pointer">
                          <Upload className="w-3.5 h-3.5" /> Import Folder
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* File tree */}
          <div className="flex-1 overflow-y-auto py-1 custom-scrollbar">
            <div className="px-1 space-y-0">
              {files.map(file => renderFileNode(file))}
            </div>

            {/* Root-level new item input */}
            {creating?.parentId === null && (
              <div className="flex items-center gap-1.5 py-[3px] px-2 mx-1 mt-0.5">
                <span className="w-4 h-4 flex-shrink-0">
                  {creating.type === 'folder'
                    ? getFileLanguageIcon('new-folder', 'w-4 h-4', { isFolder: true, isOpen: false })
                    : getFileLanguageIcon('new-file', 'w-4 h-4')}
                </span>
                <Input
                  ref={newItemInputRef}
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  onBlur={finishCreating}
                  onKeyDown={e => {
                    if (e.key === 'Enter') finishCreating();
                    if (e.key === 'Escape') setCreating(null);
                  }}
                  placeholder={creating.type === 'folder' ? 'folder-name' : 'filename.ext'}
                  className="h-5 py-0 px-1 text-xs flex-1 bg-editor-active-tab border-editor-accent"
                  autoFocus
                />
              </div>
            )}

            {files.length === 0 && !creating && (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: 'hsl(var(--surface0))' }}
                >
                  <FilePlus className="w-5 h-5 text-editor-text-dim" />
                </div>
                <p className="text-xs text-editor-text-dim">No files yet</p>
                <button
                  onClick={() => startCreating('file', null)}
                  className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-fast"
                >
                  Create a file
                </button>
              </div>
            )}
          </div>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent
        className="w-44 text-xs animate-scale-in"
        style={{ background: 'hsl(var(--crust))', border: '1px solid hsl(var(--surface1))' }}
      >
        <ContextMenuItem onClick={() => startCreating('file', null)} className="gap-2 text-xs cursor-pointer">
          <FilePlus className="w-3 h-3" /> New File
        </ContextMenuItem>
        <ContextMenuItem onClick={() => startCreating('folder', null)} className="gap-2 text-xs cursor-pointer">
          <FolderPlus className="w-3 h-3" /> New Folder
        </ContextMenuItem>
        {onImportFolder && (
          <ContextMenuItem onClick={() => folderInputRef.current?.click()} className="gap-2 text-xs cursor-pointer">
            <Upload className="w-3 h-3" /> Import Folder
          </ContextMenuItem>
        )}
        {onSync && (
          <ContextMenuItem onClick={onSync} className="gap-2 text-xs cursor-pointer">
            <RefreshCw className="w-3 h-3" /> Sync Files
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};