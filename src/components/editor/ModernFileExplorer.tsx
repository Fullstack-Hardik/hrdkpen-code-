import { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  Plus, 
  FolderPlus, 
  MoreHorizontal,
  Trash2,
  Edit3,
  Upload,
  Code,
  Globe,
  Palette,
  FileJson,
  Image,
  Play
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  language?: string;
  children?: FileNode[];
  isOpen?: boolean;
  parentId?: string;
}

interface ModernFileExplorerProps {
  files: FileNode[];
  onFileSelect: (file: FileNode) => void;
  onFileCreate: (name: string, type: 'file' | 'folder', parentId?: string) => void;
  onFileDelete: (id: string) => void;
  onFileRename: (id: string, newName: string) => void;
  onFileMove?: (dragId: string, targetFolderId: string | null) => void;
  selectedFileId?: string;
  onImportFolder?: (files: { path: string; content: string }[]) => void;
  onRunCode?: (file: FileNode) => void;
}

export const ModernFileExplorer = ({ 
  files, 
  onFileSelect, 
  onFileCreate, 
  onFileDelete, 
  onFileRename,
  onFileMove,
  selectedFileId, 
  onImportFolder,
  onRunCode,
}: ModernFileExplorerProps) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [creatingFile, setCreatingFile] = useState<{ parentId?: string; type: 'file' | 'folder' } | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const toggleFolder = useCallback((id: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const getFileIcon = (file: FileNode) => {
    if (file.type === 'folder') {
      const isExpanded = expandedFolders.has(file.id);
      return isExpanded ? 
        <FolderOpen className="w-4 h-4 text-blue-500" /> : 
        <Folder className="w-4 h-4 text-blue-500" />;
    }
    
    const ext = file.name.split('.').pop()?.toLowerCase();
    const iconClass = "w-4 h-4";
    
    switch (ext) {
      case 'html':
        return <Globe className={`${iconClass} text-orange-500`} />;
      case 'css':
        return <Palette className={`${iconClass} text-blue-500`} />;
      case 'js':
        return <Code className={`${iconClass} text-yellow-500`} />;
      case 'ts':
        return <Code className={`${iconClass} text-blue-600`} />;
      case 'tsx':
        return <Code className={`${iconClass} text-cyan-500`} />;
      case 'jsx':
        return <Code className={`${iconClass} text-cyan-400`} />;
      case 'json':
        return <FileJson className={`${iconClass} text-green-500`} />;
      case 'py':
        return <Code className={`${iconClass} text-green-600`} />;
      case 'java':
        return <Code className={`${iconClass} text-red-600`} />;
      case 'c':
      case 'cpp':
        return <Code className={`${iconClass} text-purple-600`} />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return <Image className={`${iconClass} text-purple-500`} />;
      default:
        return <FileText className={`${iconClass} text-gray-500`} />;
    }
  };

  const canRunFile = (file: FileNode) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    return ['py', 'js', 'ts', 'java', 'c', 'cpp'].includes(ext || '');
  };

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

  const startCreating = (parentId?: string, type: 'file' | 'folder' = 'file') => {
    setCreatingFile({ parentId, type });
    setNewFileName('');
  };

  const finishCreating = () => {
    if (newFileName.trim() && creatingFile) {
      // Check for duplicate names in the same folder
      const parentFiles = creatingFile.parentId 
        ? files.find(f => f.id === creatingFile.parentId)?.children || []
        : files;
      
      const isDuplicate = parentFiles.some(f => f.name === newFileName.trim());
      
      if (isDuplicate) {
        alert(`A ${creatingFile.type} with the name "${newFileName.trim()}" already exists in this location.`);
        return;
      }
      
      onFileCreate(newFileName.trim(), creatingFile.type, creatingFile.parentId);
    }
    setCreatingFile(null);
    setNewFileName('');
  };

  const handleDragStart = (e: React.DragEvent, fileId: string) => {
    setDraggedItem(fileId);
    e.dataTransfer.setData('text/plain', fileId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetFolderId?: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId && onFileMove && draggedId !== targetFolderId) {
      onFileMove(draggedId, targetFolderId || null);
    }
    setDraggedItem(null);
  };

  const renderFileNode = (file: FileNode, depth = 0, parentId?: string) => {
    const isSelected = selectedFileId === file.id;
    const isExpanded = expandedFolders.has(file.id);
    const isDragging = draggedItem === file.id;
    
    return (
      <div key={file.id}>
        {/* File/Folder Item */}
        <div 
          className={`
            flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-all duration-200 group relative
            hover:bg-gray-100 dark:hover:bg-gray-800
            ${isSelected ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100' : 'text-gray-700 dark:text-gray-300'}
            ${isDragging ? 'opacity-50' : ''}
          `}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            if (file.type === 'folder') {
              toggleFolder(file.id);
            } else {
              onFileSelect(file);
            }
          }}
          draggable
          onDragStart={(e) => handleDragStart(e, file.id)}
          onDragOver={file.type === 'folder' ? handleDragOver : undefined}
          onDrop={file.type === 'folder' ? (e) => handleDrop(e, file.id) : undefined}
        >
          {getFileIcon(file)}
          
          {editingId === file.id ? (
            <Input
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={finishEdit}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') finishEdit();
                if (e.key === 'Escape') setEditingId(null);
              }}
              className="h-6 text-xs bg-white dark:bg-gray-700 border-blue-300 dark:border-blue-600 focus:border-blue-500"
              autoFocus
            />
          ) : (
            <span className="flex-1 text-sm font-medium truncate">{file.name}</span>
          )}
          
          {/* Action Buttons */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {canRunFile(file) && onRunCode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onRunCode(file);
                }}
                className="h-6 w-6 p-0 rounded-md bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-sm hover:shadow-md transition-all"
                title={`Run ${file.name.split('.').pop()?.toUpperCase()} Code`}
              >
                <Play className="w-3.5 h-3.5 fill-white" />
              </Button>
            )}
            
            {file.type === 'folder' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    startCreating(file.id, 'file');
                  }}
                  className="h-6 w-6 p-0"
                  title="New File"
                >
                  <Plus className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    startCreating(file.id, 'folder');
                  }}
                  className="h-6 w-6 p-0"
                  title="New Folder"
                >
                  <FolderPlus className="w-3 h-3" />
                </Button>
              </>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-40">
                <DropdownMenuItem onClick={() => startEdit(file)}>
                  <Edit3 className="w-3 h-3 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onFileDelete(file.id)}
                  className="text-red-600 dark:text-red-400"
                >
                  <Trash2 className="w-3 h-3 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Creating New File/Folder */}
        {creatingFile?.parentId === file.id && (
          <div className="px-2 py-1" style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}>
            <div className="flex items-center gap-2">
              {creatingFile.type === 'folder' ? 
                <Folder className="w-4 h-4 text-blue-500" /> : 
                <FileText className="w-4 h-4 text-gray-500" />
              }
              <Input
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newFileName.trim()) {
                    finishCreating();
                  }
                  if (e.key === 'Escape') {
                    setCreatingFile(null);
                    setNewFileName('');
                  }
                }}
                placeholder={creatingFile.type === 'folder' ? 'Folder name' : 'File name (e.g. index.js)'}
                className="h-6 text-xs bg-white dark:bg-gray-700 border-blue-300 dark:border-blue-600 focus:border-blue-500"
                autoFocus
              />
            </div>
          </div>
        )}
        
        {/* Folder Children */}
        {file.type === 'folder' && isExpanded && file.children && (
          <div>
            {file.children.map(child => renderFileNode(child, depth + 1, file.id))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Explorer</h3>
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => startCreating(undefined, 'file')}
            className="h-7 w-7 p-0"
            title="New File"
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => startCreating(undefined, 'folder')}
            className="h-7 w-7 p-0"
            title="New Folder"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </Button>
          {onImportFolder && (
            <>
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
                        reader.onload = () => resolve({ 
                          path: (f as any).webkitRelativePath || f.name, 
                          content: String(reader.result || '') 
                        });
                        reader.readAsText(f);
                      })
                    )
                  );
                  onImportFolder(reads);
                  e.currentTarget.value = '';
                }}
              />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => folderInputRef.current?.click()}
                className="h-7 w-7 p-0"
                title="Import Folder"
              >
                <Upload className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>
      
      {/* Root Level New File Input */}
      {creatingFile && !creatingFile.parentId && (
        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            {creatingFile.type === 'folder' ? 
              <Folder className="w-4 h-4 text-blue-500" /> : 
              <FileText className="w-4 h-4 text-gray-500" />
            }
            <Input
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newFileName.trim()) {
                  finishCreating();
                }
                if (e.key === 'Escape') {
                  setCreatingFile(null);
                  setNewFileName('');
                }
              }}
              placeholder={creatingFile.type === 'folder' ? 'Folder name' : 'File name (e.g. index.js)'}
              className="h-7 text-xs bg-white dark:bg-gray-700 border-blue-300 dark:border-blue-600 focus:border-blue-500"
              autoFocus
            />
          </div>
        </div>
      )}
      
      {/* File Tree */}
      <div 
        className="overflow-auto flex-1 p-2" 
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e)}
      >
        {files.map(file => renderFileNode(file))}
      </div>
    </div>
  );
};