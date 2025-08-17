import { useState } from 'react';
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
  Edit3
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
}

interface FileExplorerProps {
  files: FileNode[];
  onFileSelect: (file: FileNode) => void;
  onFileCreate: (name: string, type: 'file' | 'folder', parentId?: string) => void;
  onFileDelete: (id: string) => void;
  onFileRename: (id: string, newName: string) => void;
  selectedFileId?: string;
}

export const FileExplorer = ({ 
  files, 
  onFileSelect, 
  onFileCreate, 
  onFileDelete, 
  onFileRename,
  selectedFileId 
}: FileExplorerProps) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

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
    
    // File type icons based on extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    const iconClass = "w-4 h-4";
    
    switch (ext) {
      case 'html':
        return <i className={`fab fa-html5 ${iconClass} text-orange-500`} />;
      case 'css':
        return <i className={`fab fa-css3-alt ${iconClass} text-blue-500`} />;
      case 'js':
        return <i className={`fab fa-js-square ${iconClass} text-yellow-500`} />;
      case 'ts':
        return <i className={`fas fa-code ${iconClass} text-blue-600`} />;
      case 'json':
        return <i className={`fas fa-brackets-curly ${iconClass} text-green-500`} />;
      default:
        return <FileText className={`${iconClass} text-editor-text-muted`} />;
    }
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

  const renderFileNode = (file: FileNode, depth = 0) => {
    const isSelected = selectedFileId === file.id;
    const isExpanded = expandedFolders.has(file.id);
    
    return (
      <div key={file.id}>
        <div 
          className={`
            flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-editor group
            hover:bg-editor-active-tab
            ${isSelected ? 'bg-editor-active-tab text-editor-text' : 'text-editor-text-muted'}
          `}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            if (file.type === 'folder') {
              toggleFolder(file.id);
            } else {
              onFileSelect(file);
            }
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
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
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
                className="text-editor-error"
              >
                <Trash2 className="w-3 h-3 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {file.type === 'folder' && isExpanded && file.children && (
          <div>
            {file.children.map(child => renderFileNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="editor-sidebar h-full border-r border-border">
      {/* File Explorer Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h3 className="text-sm font-semibold text-editor-text">Explorer</h3>
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onFileCreate('new-file.txt', 'file')}
            className="h-6 w-6 p-0"
          >
            <Plus className="w-3 h-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onFileCreate('new-folder', 'folder')}
            className="h-6 w-6 p-0"
          >
            <FolderPlus className="w-3 h-3" />
          </Button>
        </div>
      </div>
      
      {/* File Tree */}
      <div className="overflow-auto flex-1 p-2">
        {files.map(file => renderFileNode(file))}
      </div>
    </div>
  );
};