import { useState, useEffect, useRef } from 'react';
import { SystemHeader } from './SystemHeader';
import { FileExplorer, FileNode } from './FileExplorer';
import { CodeEditor } from './CodeEditor';
import { LivePreview } from './LivePreview';
import { MultiTerminal, MultiTerminalHandle } from './MultiTerminal';
import { YouTubePlayer } from './YouTubePlayer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ModernAIAssistant } from './ModernAIAssistant';
import { FindInFiles } from './FindInFiles';
import { StatusBar } from './StatusBar';
import { TeamChatPanel } from './TeamChatPanel';
import { 
  SidebarOpen, 
  SidebarClose,
  FileText,
  X,
  Monitor,
  ChevronUp,
  Sparkles,
  Youtube
} from 'lucide-react';
import { YouTubeSection } from './YouTubeSection';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { getFileLanguageIcon } from '@/utils/languageIcons';


// Default empty file structure
const defaultFiles: FileNode[] = [];

export const SmartCodeEditor = () => {
  const [files, setFiles] = useState<FileNode[]>(defaultFiles);
  const [openTabs, setOpenTabs] = useState<FileNode[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [bottomPanelVisible, setBottomPanelVisible] = useState(true);
  const [rightPanelVisible, setRightPanelVisible] = useState(true);
  const [terminalVisible, setTerminalVisible] = useState(false);
  const [activeRightTab, setActiveRightTab] = useState('preview');
  const [showYouTube, setShowYouTube] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [showFind, setShowFind] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [errorCount, setErrorCount] = useState(0);
  const [errorLines, setErrorLines] = useState<number[]>([]);
  const multiTerminalRef = useRef<MultiTerminalHandle>(null);

  // Auto-save functionality
  useEffect(() => {
    const saveInterval = setInterval(() => {
      localStorage.setItem('smart-editor-files', JSON.stringify(files));
      localStorage.setItem('smart-editor-tabs', JSON.stringify(openTabs));
      localStorage.setItem('smart-editor-active-tab', activeTab);
    }, 2000);

    return () => clearInterval(saveInterval);
  }, [files, openTabs, activeTab]);

  // Load saved files on mount
  useEffect(() => {
    const savedFiles = localStorage.getItem('smart-editor-files');
    const savedTabs = localStorage.getItem('smart-editor-tabs');
    const savedActiveTab = localStorage.getItem('smart-editor-active-tab');

    if (savedFiles) {
      try {
        const parsed = JSON.parse(savedFiles);
        if (parsed && parsed.length > 0) {
          setFiles(parsed);
        }
      } catch (e) {
        console.warn('Failed to load saved files');
      }
    }

    if (savedTabs) {
      try {
        const tabs = JSON.parse(savedTabs);
        if (tabs && tabs.length > 0) {
          setOpenTabs(tabs);
          if (savedActiveTab) {
            setActiveTab(savedActiveTab);
          }
        }
      } catch (e) {
        console.warn('Failed to load saved tabs');
      }
    }
  }, []);

  const findFileById = (fileList: FileNode[], id: string): FileNode | null => {
    for (const file of fileList) {
      if (file.id === id) return file;
      if (file.children) {
        const found = findFileById(file.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const updateFileContent = (fileId: string, content: string) => {
    const updateFileInTree = (fileList: FileNode[]): FileNode[] => {
      return fileList.map(file => {
        if (file.id === fileId) {
          return { ...file, content };
        }
        if (file.children) {
          return { ...file, children: updateFileInTree(file.children) };
        }
        return file;
      });
    };

    setFiles(updateFileInTree(files));
    
    setOpenTabs(tabs => 
      tabs.map(tab => 
        tab.id === fileId ? { ...tab, content } : tab
      )
    );
  };

  const handleFileSelect = (file: FileNode) => {
    if (file.type === 'file') {
      if (!openTabs.find(tab => tab.id === file.id)) {
        setOpenTabs(prev => [...prev, file]);
      }
      setActiveTab(file.id);

      if (file.language === 'html') {
        const css = files.flatMap(f => f.type === 'folder' ? (f.children || []) : [f]).find(f => f.name === 'styles.css');
        const js = files.flatMap(f => f.type === 'folder' ? (f.children || []) : [f]).find(f => f.name === 'script.js');
        if (css && !openTabs.find(t => t.id === css.id)) setOpenTabs(prev => [...prev, css]);
        if (js && !openTabs.find(t => t.id === js.id)) setOpenTabs(prev => [...prev, js]);
      }
    }
  };

  const handleTabClose = (fileId: string) => {
    const newTabs = openTabs.filter(tab => tab.id !== fileId);
    setOpenTabs(newTabs);
    
    if (activeTab === fileId) {
      setActiveTab(newTabs.length > 0 ? newTabs[newTabs.length - 1].id : '');
    }
  };

  // Check for duplicate names in the same level
  const isDuplicateName = (name: string, parentId?: string): boolean => {
    const siblings = parentId 
      ? (findFileById(files, parentId)?.children || [])
      : files;
    return siblings.some(f => f.name.toLowerCase() === name.toLowerCase());
  };

  const handleFileCreate = (name: string, type: 'file' | 'folder', parentId?: string) => {
    // Prevent duplicate names
    if (isDuplicateName(name, parentId)) {
      const ext = name.includes('.') ? '.' + name.split('.').pop() : '';
      const baseName = name.replace(ext, '');
      name = `${baseName}_1${ext}`;
    }

    const newNode: FileNode = {
      id: `${type}-${Date.now()}`,
      name,
      type,
      content: type === 'file' ? '' : undefined,
      language: type === 'file' ? getLanguageFromExtension(name) : undefined,
      children: type === 'folder' ? [] : undefined
    };

    setFiles(prev => [...prev, newNode]);
  };

  const handleFileDelete = (fileId: string) => {
    const filterFiles = (fileList: FileNode[]): FileNode[] => {
      return fileList.filter(file => {
        if (file.id === fileId) return false;
        if (file.children) {
          file.children = filterFiles(file.children);
        }
        return true;
      });
    };

    setFiles(filterFiles(files));
    setOpenTabs(tabs => tabs.filter(tab => tab.id !== fileId));
    
    if (activeTab === fileId) {
      const remainingTabs = openTabs.filter(tab => tab.id !== fileId);
      setActiveTab(remainingTabs.length > 0 ? remainingTabs[0].id : '');
    }
  };

  const handleFileRename = (fileId: string, newName: string) => {
    const updateFileName = (fileList: FileNode[]): FileNode[] => {
      return fileList.map(file => {
        if (file.id === fileId) {
          return { 
            ...file, 
            name: newName,
            language: file.type === 'file' ? getLanguageFromExtension(newName) : undefined
          };
        }
        if (file.children) {
          return { ...file, children: updateFileName(file.children) };
        }
        return file;
      });
    };

    setFiles(updateFileName(files));
    setOpenTabs(tabs => 
      tabs.map(tab => 
        tab.id === fileId ? { ...tab, name: newName } : tab
      )
    );
  };

  const handleMoveNode = (dragId: string, targetFolderId: string | null) => {
    const moveNodeInTree = (fileList: FileNode[], dragId: string, targetFolderId: string | null): FileNode[] => {
      let draggedNode: FileNode | null = null;
      
      const removeNode = (files: FileNode[]): FileNode[] => {
        return files.filter(file => {
          if (file.id === dragId) {
            draggedNode = file;
            return false;
          }
          if (file.children) {
            file.children = removeNode(file.children);
          }
          return true;
        });
      };
      
      const updatedFiles = removeNode([...fileList]);
      
      if (!draggedNode) return fileList;
      
      if (targetFolderId === null) {
        return [...updatedFiles, draggedNode];
      }
      
      const addToFolder = (files: FileNode[]): FileNode[] => {
        return files.map(file => {
          if (file.id === targetFolderId && file.type === 'folder') {
            return {
              ...file,
              children: [...(file.children || []), draggedNode!]
            };
          }
          if (file.children) {
            return {
              ...file,
              children: addToFolder(file.children)
            };
          }
          return file;
        });
      };
      
      return addToFolder(updatedFiles);
    };
    
    setFiles(prev => moveNodeInTree(prev, dragId, targetFolderId));
  };

  const getLanguageFromExtension = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'html': return 'html';
      case 'css': return 'css';
      case 'js': return 'javascript';
      case 'ts': return 'typescript';
      case 'tsx': return 'typescript';
      case 'jsx': return 'javascript';
      case 'py': return 'python';
      case 'java': return 'java';
      case 'c': return 'c';
      case 'cpp': return 'cpp';
      case 'h': return 'c';
      case 'hpp': return 'cpp';
      case 'json': return 'json';
      case 'md': return 'markdown';
      case 'txt': return 'plaintext';
      default: return 'plaintext';
    }
  };

  const getPreviewContent = () => {
    const htmlFile = openTabs.find(tab => tab.language === 'html') || 
                    findFileById(files, 'index-html');
    const cssFile = openTabs.find(tab => tab.language === 'css') || 
                   findFileById(files, 'styles-css');
    const jsFile = openTabs.find(tab => tab.language === 'javascript') || 
                  findFileById(files, 'script-js');

    return {
      html: htmlFile?.content || '',
      css: cssFile?.content || '',
      js: jsFile?.content || ''
    };
  };

  const activeFile = openTabs.find(tab => tab.id === activeTab);
  const previewContent = getPreviewContent();

  // Import folder handler
  const handleImportFolder = (items: { path: string; content: string }[]) => {
    setFiles((prev) => {
      const root = [...prev];
      const ensureFolder = (segments: string[], nodes: FileNode[]): FileNode[] => {
        if (segments.length === 0) return nodes;
        const [head, ...tail] = segments;
        let folder = nodes.find((n) => n.type === 'folder' && n.name === head);
        if (!folder) {
          folder = { id: `folder-${Date.now()}-${head}`, name: head, type: 'folder', children: [], isOpen: true };
          nodes.push(folder);
        }
        folder.children = ensureFolder(tail, folder.children || []);
        return nodes;
      };
      const addFile = (path: string, content: string) => {
        const parts = path.split('/').filter(Boolean);
        const fileName = parts.pop() as string;
        const folders = parts;
        ensureFolder(folders, root);
        let nodes: FileNode[] = root;
        for (const f of folders) {
          const next = nodes.find((n) => n.type === 'folder' && n.name === f) as FileNode;
          nodes = next.children || (next.children = []);
        }
        nodes.push({
          id: `file-${Date.now()}-${fileName}`,
          name: fileName,
          type: 'file',
          content,
          language: getLanguageFromExtension(fileName),
        });
      };
      items.forEach((it) => addFile(it.path, it.content));
      return root;
    });
  };

  const createFileAtPath = (fullPath: string) => {
    const parts = fullPath.split('/').filter(Boolean);
    const fileName = parts.pop() || 'untitled.txt';
    setFiles((prev) => {
      const root = [...prev];
      let nodes: FileNode[] = root;
      for (const segment of parts) {
        let folder = nodes.find((n) => n.type === 'folder' && n.name === segment);
        if (!folder) {
          folder = { id: `folder-${Date.now()}-${segment}`, name: segment, type: 'folder', children: [], isOpen: true } as FileNode;
          nodes.push(folder);
        }
        nodes = folder.children || (folder.children = []);
      }
      nodes.push({
        id: `file-${Date.now()}-${fileName}`,
        name: fileName,
        type: 'file',
        content: '',
        language: getLanguageFromExtension(fileName),
      });
      return root;
    });
  };

  const exportProject = async () => {
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      const addFilesToZip = (fileList: FileNode[], path = '') => {
        fileList.forEach(file => {
          const fullPath = path ? `${path}/${file.name}` : file.name;
          if (file.type === 'file') {
            zip.file(fullPath, file.content || '');
          } else if (file.type === 'folder' && file.children) {
            addFilesToZip(file.children, fullPath);
          }
        });
      };
      
      addFilesToZip(files);
      
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'hrdkpen-project.zip';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const publishProject = () => {
    window.open('https://getlivenow.lovable.app', '_blank');
  };

  const handleFindResultClick = (fileId: string, line: number) => {
    const file = findFileById(files, fileId);
    if (file) {
      handleFileSelect(file);
      setCursorPosition({ line, column: 1 });
      setShowFind(false);
    }
  };

  const handleDownloadCurrent = () => {
    const file = openTabs.find(tab => tab.id === activeTab);
    if (!file) return;
    const type = file.language === 'html' ? 'text/html' : file.language === 'css' ? 'text/css' : 'text/plain';
    const blob = new Blob([file.content || ''], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle errors from code editor
  const handleEditorErrors = (errors: { line: number; message: string }[]) => {
    setErrorCount(errors.length);
    setErrorLines(errors.map(e => e.line));
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-editor-bg">
      {/* Header */}
      <SystemHeader 
        onExport={exportProject} 
        onPublish={publishProject} 
        onToggleTerminal={() => setTerminalVisible(v => !v)} 
        onDownloadCurrent={handleDownloadCurrent}
      />
      
      {/* Main Editor Layout */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Sidebar */}
          {sidebarVisible && (
            <>
              <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
                <div className="h-full border-r border-border">
                  <FileExplorer
                    files={files}
                    onFileSelect={handleFileSelect}
                    onFileCreate={handleFileCreate}
                    onFileDelete={handleFileDelete}
                    onFileRename={handleFileRename}
                    selectedFileId={activeTab}
                    onImportFolder={handleImportFolder}
                    onMove={(dragId, targetFolderId) => handleMoveNode(dragId, targetFolderId)}
                  />
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}
          
          {/* Main Content Area */}
          <ResizablePanel defaultSize={sidebarVisible ? 50 : 70}>
            <div className="flex flex-col h-full">
              {/* File Tabs */}
              <div className="flex items-center bg-editor-sidebar border-b border-border px-2 py-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarVisible(!sidebarVisible)}
                  className="mr-2 h-7 w-7 p-0"
                >
                  {sidebarVisible ? <SidebarClose className="w-3 h-3" /> : <SidebarOpen className="w-3 h-3" />}
                </Button>
                
                <div className="flex flex-1 overflow-x-auto">
                  {openTabs.map(tab => (
                    <div
                      key={tab.id}
                      className={`
                        flex items-center gap-2 px-3 py-1.5 border-r border-border cursor-pointer
                        transition-editor min-w-0 max-w-48 group
                        ${activeTab === tab.id ? 'bg-editor-active-tab text-editor-text' : 'text-editor-text-muted hover:text-editor-text hover:bg-editor-border'}
                      `}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      {getFileLanguageIcon(tab.name, 'w-3.5 h-3.5 flex-shrink-0')}
                      <span className="text-xs truncate">{tab.name}</span>
                      {['javascript', 'typescript', 'python', 'java', 'c', 'cpp'].includes(tab.language || '') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!terminalVisible) setTerminalVisible(true);
                            setTimeout(() => {
                              multiTerminalRef.current?.runCode(tab.language || '', tab.content || '');
                            }, 100);
                          }}
                          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 bg-green-500/20 hover:bg-green-500/40 text-green-400 rounded-sm"
                          title="Run code"
                        >
                          ▶
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTabClose(tab.id);
                        }}
                        className="h-4 w-4 p-0 opacity-60 hover:opacity-100"
                      >
                        <X className="w-2 h-2" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Code Editor */}
              <div className="flex-1 overflow-hidden">
                {activeFile ? (
                  <CodeEditor
                    value={activeFile.content || ''}
                    onChange={(content) => updateFileContent(activeFile.id, content)}
                    language={activeFile.language || 'plaintext'}
                    fileName={activeFile.name}
                    onRun={(code, lang) => {
                      if (!terminalVisible) setTerminalVisible(true);
                      setTimeout(() => {
                        multiTerminalRef.current?.runCode(lang, code);
                      }, 100);
                    }}
                    onErrors={handleEditorErrors}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-editor-text-muted">
                    <div className="text-center">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Select a file to start editing</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ResizablePanel>
          
          {/* Right Panel - Preview / AI / YouTube — each tab fills the panel exclusively */}
          {rightPanelVisible && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
                <div className="h-full flex flex-col overflow-hidden">
                  {/* Tab bar */}
                  <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-editor-sidebar flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setActiveRightTab('preview')}
                        className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-md transition-all ${
                          activeRightTab === 'preview' 
                            ? 'bg-editor-accent/20 text-editor-accent font-medium' 
                            : 'text-editor-text-muted hover:text-editor-text hover:bg-editor-active-tab'
                        }`}
                      >
                        <Monitor className="w-3 h-3" />
                        Preview
                      </button>
                      <button
                        onClick={() => setActiveRightTab('ai')}
                        className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-md transition-all ${
                          activeRightTab === 'ai' 
                            ? 'bg-purple-500/20 text-purple-400 font-medium' 
                            : 'text-editor-text-muted hover:text-editor-text hover:bg-editor-active-tab'
                        }`}
                      >
                        <Sparkles className="w-3 h-3" />
                        AI
                      </button>
                      <button
                        onClick={() => setActiveRightTab('youtube')}
                        className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-md transition-all ${
                          activeRightTab === 'youtube' 
                            ? 'bg-red-500/20 text-red-400 font-medium' 
                            : 'text-editor-text-muted hover:text-editor-text hover:bg-editor-active-tab'
                        }`}
                      >
                        <Youtube className="w-3 h-3" />
                        YouTube
                      </button>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRightPanelVisible(false)}
                      className="h-6 px-2"
                      title="Close Panel"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>

                  {/* Tab content — only ONE visible at a time, takes full remaining height */}
                  <div className="flex-1 overflow-hidden relative">
                    <div className={`absolute inset-0 ${activeRightTab === 'preview' ? 'block' : 'hidden'}`}>
                      <LivePreview
                        htmlContent={previewContent.html} 
                        cssContent={previewContent.css} 
                        jsContent={previewContent.js}
                        activeFileName={openTabs.find(tab => tab.id === activeTab)?.name}
                      />
                    </div>
                    <div className={`absolute inset-0 ${activeRightTab === 'ai' ? 'flex flex-col' : 'hidden'}`}>
                      <ModernAIAssistant
                        onCodeInsert={(code) => {
                          if (activeTab && openTabs.find(tab => tab.id === activeTab)) {
                            const file = openTabs.find(tab => tab.id === activeTab);
                            if (file) {
                              updateFileContent(file.id, code);
                            }
                          }
                        }}
                        attachedFile={activeFile ? { name: activeFile.name, content: activeFile.content || '' } : null}
                      />
                    </div>
                    <div className={`absolute inset-0 ${activeRightTab === 'youtube' ? 'block' : 'hidden'}`}>
                      <YouTubeSection 
                        onPlayVideo={(url) => {
                          setYoutubeUrl(url);
                          setShowYouTube(true);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
        
        {/* YouTube Player Overlay */}
        {showYouTube && (
          <YouTubePlayer url={youtubeUrl} onClose={() => setShowYouTube(false)} />
        )}
        
        {/* Bottom Terminal */}
        <div className="border-t border-border bg-editor-bg flex flex-col transition-all duration-200" style={{ height: terminalVisible ? '300px' : '0px', overflow: 'hidden' }}>
          <div className="flex-1 min-h-0">
            <MultiTerminal 
              ref={multiTerminalRef} 
              getFileSystem={() => files} 
              onCreateFile={(fullPath) => createFileAtPath(fullPath)}
              onClose={() => setTerminalVisible(false)}
            />
          </div>
        </div>
        
        {/* Status Bar */}
        <StatusBar
          activeFile={activeFile}
          cursorPosition={cursorPosition}
          totalLines={activeFile?.content?.split('\n').length || 0}
          errors={errorCount}
          errorLines={errorLines}
          warnings={0}
          onHostClick={() => window.open('https://getlivenow.lovable.app', '_blank')}
        />
      </div>
      
      {/* Toggle Buttons */}
      {!rightPanelVisible && (
        <div className="fixed top-16 right-3 z-50">
          <Button
            onClick={() => setRightPanelVisible(true)}
            className="rounded-full h-9 w-9 p-0 glow-accent"
            title="Show preview/AI panel"
          >
            <Monitor className="w-4 h-4" />
          </Button>
        </div>
      )}
      {!terminalVisible && (
        <div className="fixed bottom-4 left-4 z-50">
          <Button
            onClick={() => setTerminalVisible(true)}
            className="group relative rounded-full h-12 w-12 p-0 bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 hover:from-purple-700 hover:via-blue-700 hover:to-teal-700 shadow-xl border-2 border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-105"
            title="Open Terminal"
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 opacity-0 group-hover:opacity-20 animate-pulse"></div>
            <ChevronUp className="w-6 h-6 text-white relative z-10" />
          </Button>
        </div>
      )}
    </div>
  );
};
