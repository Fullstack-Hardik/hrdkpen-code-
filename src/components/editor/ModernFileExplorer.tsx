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
    const iconSize = "w-4 h-4";
    
    switch (ext) {
      case 'html':
        return <Globe className={`${iconSize} text-orange-500`} />;
      case 'css':
        return <Palette className={`${iconSize} text-blue-500`} />;
      case 'js':
        return (
          <div className={iconSize} style={{ color: '#F7DF1E' }}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M0 0h24v24H0V0zm22.034 18.276c-.175-1.095-.888-2.015-3.003-2.873-.736-.345-1.554-.585-1.797-1.14-.091-.33-.105-.51-.046-.705.15-.646.915-.84 1.515-.66.39.12.75.42.976.9 1.034-.676 1.034-.676 1.755-1.125-.27-.42-.404-.601-.586-.78-.63-.705-1.469-1.065-2.834-1.034l-.705.089c-.676.165-1.32.525-1.71 1.005-1.14 1.291-.811 3.541.569 4.471 1.365 1.02 3.361 1.244 3.616 2.205.24 1.17-.87 1.545-1.966 1.41-.811-.18-1.26-.586-1.755-1.336l-1.83 1.051c.21.48.45.689.81 1.109 1.74 1.756 6.09 1.666 6.871-1.004.029-.09.24-.705.074-1.65l.046.067zm-8.983-7.245h-2.248c0 1.938-.009 3.864-.009 5.805 0 1.232.063 2.363-.138 2.711-.33.689-1.18.601-1.566.48-.396-.196-.597-.466-.83-.855-.063-.105-.11-.196-.127-.196l-1.825 1.125c.305.63.75 1.172 1.324 1.517.855.51 2.004.675 3.207.405.783-.226 1.458-.691 1.811-1.411.51-.93.402-2.07.397-3.346.012-2.054 0-4.109 0-6.179l.004-.056z"/>
            </svg>
          </div>
        );
      case 'ts':
        return (
          <div className={iconSize} style={{ color: '#3178C6' }}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 0 1 1.306.34v2.458a3.95 3.95 0 0 0-.643-.361 5.093 5.093 0 0 0-.717-.26 5.453 5.453 0 0 0-1.426-.2c-.3 0-.573.028-.819.086a2.1 2.1 0 0 0-.623.242c-.17.104-.3.229-.393.374a.888.888 0 0 0-.14.49c0 .196.053.373.156.529.104.156.252.304.443.444s.423.276.696.41c.273.135.582.274.926.416.47.197.892.407 1.266.628.374.222.695.473.963.753.268.279.472.598.614.957.142.359.214.776.214 1.253 0 .657-.125 1.21-.373 1.656a3.033 3.033 0 0 1-1.012 1.085 4.38 4.38 0 0 1-1.487.596c-.566.12-1.163.18-1.79.18a9.916 9.916 0 0 1-1.84-.164 5.544 5.544 0 0 1-1.512-.493v-2.63a5.033 5.033 0 0 0 3.237 1.2c.333 0 .624-.03.872-.09.249-.06.456-.144.623-.25.166-.108.29-.234.373-.38a1.023 1.023 0 0 0-.074-1.089 2.12 2.12 0 0 0-.537-.5 5.597 5.597 0 0 0-.807-.444 27.72 27.72 0 0 0-1.007-.436c-.918-.383-1.602-.852-2.053-1.405-.45-.553-.676-1.222-.676-2.005 0-.614.123-1.141.369-1.582.246-.441.58-.804 1.004-1.089a4.494 4.494 0 0 1 1.47-.629 7.536 7.536 0 0 1 1.77-.201zm-15.113.188h9.563v2.166H9.506v9.646H6.789v-9.646H3.375z"/>
            </svg>
          </div>
        );
      case 'tsx':
      case 'jsx':
        return (
          <div className={iconSize} style={{ color: '#61DAFB' }}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M14.23 12.004a2.236 2.236 0 0 1-2.235 2.236 2.236 2.236 0 0 1-2.236-2.236 2.236 2.236 0 0 1 2.235-2.236 2.236 2.236 0 0 1 2.236 2.236zm2.648-10.69c-1.346 0-3.107.96-4.888 2.622-1.78-1.653-3.542-2.602-4.887-2.602-.41 0-.783.093-1.106.278-1.375.793-1.683 3.264-.973 6.365C1.98 8.917 0 10.42 0 12.004c0 1.59 1.99 3.097 5.043 4.03-.704 3.113-.39 5.588.988 6.38.32.187.69.275 1.102.275 1.345 0 3.107-.96 4.888-2.624 1.78 1.654 3.542 2.603 4.887 2.603.41 0 .783-.09 1.106-.275 1.374-.792 1.683-3.263.973-6.365C22.02 15.096 24 13.59 24 12.004c0-1.59-1.99-3.097-5.043-4.032.704-3.11.39-5.587-.988-6.38-.318-.184-.688-.277-1.092-.278zm-.005 1.09v.006c.225 0 .406.044.558.127.666.382.955 1.835.73 3.704-.054.46-.142.945-.25 1.44-.96-.236-2.006-.417-3.107-.534-.66-.905-1.345-1.727-2.035-2.447 1.592-1.48 3.087-2.292 4.105-2.295zm-9.77.02c1.012 0 2.514.808 4.11 2.28-.686.72-1.37 1.537-2.02 2.442-1.107.117-2.154.298-3.113.538-.112-.49-.195-.964-.254-1.42-.23-1.868.054-3.32.714-3.707.19-.09.408-.127.645-.132zm4.916 3.978c.398.66.782 1.35 1.15 2.07-.397-.02-.79-.032-1.18-.032-.39 0-.78.01-1.18.03.37-.72.752-1.41 1.15-2.07h.06zm-4.735.39c.524.962 1.09 1.898 1.688 2.8-.598.9-1.164 1.84-1.688 2.8-.762-.14-1.48-.3-2.13-.49-1.24-.36-2.26-.79-2.96-1.24.7-.45 1.72-.88 2.96-1.24.65-.19 1.368-.35 2.13-.49zm9.47 0c.762.14 1.48.3 2.13.49 1.24.36 2.26.79 2.96 1.24-.7.45-1.72.88-2.96 1.24-.65.19-1.368.35-2.13.49-.524-.962-1.09-1.898-1.688-2.8.598-.9 1.164-1.84 1.688-2.8zm-4.735 2.6c.457 0 .91.01 1.36.03-.45.76-.91 1.48-1.37 2.15-.46-.67-.92-1.39-1.37-2.15.45-.02.9-.03 1.36-.03zm-6.417.93c.84 1.283 1.73 2.476 2.663 3.57-1.617-.14-3.106-.398-4.43-.75-.56-1.85-.82-3.57-.6-4.98.68.196 1.42.362 2.207.5.2.408.41.82.633 1.23zm12.835 0c.22-.41.43-.82.633-1.23.786-.14 1.527-.304 2.207-.5.218 1.41-.043 3.13-.603 4.98-1.324.35-2.813.61-4.43.75.93-1.094 1.823-2.287 2.663-3.57zm-9.555 5.36c.69.72 1.375 1.337 2.035 2.447 1.1-.117 2.147-.298 3.107-.534.11.495.197.98.25 1.44.225 1.87-.064 3.322-.73 3.704-.152.083-.333.127-.558.127-1.018-.003-2.513-.815-4.105-2.295zm7.075 0c-1.592 1.48-3.087 2.292-4.105 2.295-.225 0-.406-.044-.558-.127-.666-.382-.955-1.835-.73-3.704.054-.46.142-.945.25-1.44.96.236 2.006.417 3.107.534.66.905 1.345 1.727 2.035 2.447z"/>
            </svg>
          </div>
        );
      case 'json':
        return <FileJson className={`${iconSize} text-green-500`} />;
      case 'py':
        return (
          <div className={iconSize} style={{ color: '#3776AB' }}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09zm13.09 3.95l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.23-.41-.08-.41.08z"/>
            </svg>
          </div>
        );
      case 'java':
        return (
          <div className={iconSize} style={{ color: '#EA2D2E' }}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.851 18.56s-.917.534.653.714c1.902.218 2.874.187 4.969-.211 0 0 .552.346 1.321.646-4.699 2.013-10.633-.118-6.943-1.149M8.276 15.933s-1.028.761.542.924c2.032.209 3.636.227 6.413-.308 0 0 .384.389.987.602-5.679 1.661-12.007.13-7.942-1.218M13.116 11.475c1.158 1.333-.304 2.533-.304 2.533s2.939-1.518 1.589-3.418c-1.261-1.772-2.228-2.652 3.007-5.688 0-.001-8.216 2.051-4.292 6.573M19.33 20.504s.679.559-.747.991c-2.712.822-11.288 1.069-13.669.033-.856-.373.75-.89 1.254-.998.527-.114.828-.093.828-.093-.953-.671-6.156 1.317-2.643 1.887 9.58 1.553 17.462-.7 14.977-1.82M9.292 13.21s-4.362 1.036-1.544 1.412c1.189.159 3.561.123 5.77-.062 1.806-.152 3.618-.477 3.618-.477s-.637.272-1.098.587c-4.429 1.165-12.986.623-10.522-.568 2.082-1.006 3.776-.892 3.776-.892M17.116 17.584c4.503-2.34 2.421-4.589.968-4.285-.355.074-.515.138-.515.138s.132-.207.385-.297c2.875-1.011 5.086 2.981-.928 4.562 0-.001.07-.062.09-.118M14.401 0s2.494 2.494-2.365 6.33c-3.896 3.077-.888 4.832-.001 6.836-2.274-2.053-3.943-3.858-2.824-5.539 1.644-2.469 6.197-3.665 5.19-7.627M9.734 23.924c4.322.277 10.959-.153 11.116-2.198 0 0-.302.775-3.572 1.391-3.688.694-8.239.613-10.937.168 0-.001.553.457 3.393.639"/>
            </svg>
          </div>
        );
      case 'c':
      case 'cpp':
        return (
          <div className={iconSize} style={{ color: '#00599C' }}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.394 6c-.167-.29-.398-.543-.652-.69L12.926.22c-.509-.294-1.34-.294-1.848 0L2.26 5.31c-.508.293-.923 1.013-.923 1.6v10.18c0 .294.104.62.271.91.167.29.398.543.652.69l8.816 5.09c.508.293 1.34.293 1.848 0l8.816-5.09c.254-.147.485-.4.652-.69.167-.29.27-.616.27-.91V6.91c.003-.294-.1-.62-.268-.91zM12 19.11c-3.92 0-7.109-3.19-7.109-7.11 0-3.92 3.19-7.11 7.11-7.11a7.133 7.133 0 016.156 3.553l-3.076 1.78a3.567 3.567 0 00-3.08-1.78A3.56 3.56 0 008.444 12 3.56 3.56 0 0012 15.555a3.57 3.57 0 003.08-1.778l3.078 1.78A7.135 7.135 0 0112 19.11zm7.11-6.715h-.79v.79h-.79v-.79h-.79v-.79h.79v-.79h.79v.79h.79zm2.962 0h-.79v.79h-.79v-.79h-.79v-.79h.79v-.79h.79v.79h.79z"/>
            </svg>
          </div>
        );
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return <Image className={`${iconSize} text-purple-500`} />;
      default:
        return <FileText className={`${iconSize} text-gray-500`} />;
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