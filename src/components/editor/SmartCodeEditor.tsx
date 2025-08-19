import { useState, useEffect, useRef } from 'react';
import { SystemHeader } from './SystemHeader';
import { FileExplorer, FileNode } from './FileExplorer';
import { CodeEditor } from './CodeEditor';
import { LivePreview } from './LivePreview';
import { Terminal } from './Terminal';
import { MultiTerminal, MultiTerminalHandle } from './MultiTerminal';
import { YouTubePlayer } from './YouTubePlayer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  PanelBottomOpen, 
  PanelBottomClose, 
  SidebarOpen, 
  SidebarClose,
  FileText,
  X,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Play,
  Upload,
  Download,
  Globe,
  Youtube
} from 'lucide-react';
import { ChatPanel } from './ChatPanel';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

// Default file structure
const defaultFiles: FileNode[] = [
  {
    id: 'root',
    name: 'my-project',
    type: 'folder',
    isOpen: true,
    children: [
      {
        id: 'index-html',
        name: 'index.html',
        type: 'file',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Smart Code Editor Project</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>Welcome to Smart Code Editor!</h1>
            <p>Start building amazing web applications</p>
        </header>
        
        <main>
            <div class="feature-grid">
                <div class="feature-card">
                    <h3>🚀 Fast Development</h3>
                    <p>Write code with intelligent suggestions and auto-completion</p>
                </div>
                
                <div class="feature-card">
                    <h3>📱 Live Preview</h3>
                    <p>See your changes instantly across different device sizes</p>
                </div>
                
                <div class="feature-card">
                    <h3>🤖 AI Assistant</h3>
                    <p>Get smart code suggestions and error explanations</p>
                </div>
            </div>
            
            <button onclick="showMessage()" class="cta-button">
                Click me to test JavaScript!
            </button>
        </main>
    </div>
    
    <script src="script.js"></script>
</body>
</html>`
      },
      {
        id: 'styles-css',
        name: 'styles.css',
        type: 'file',
        language: 'css',
        content: `/* Smart Code Editor Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    color: #333;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
}

header {
    text-align: center;
    color: white;
    margin-bottom: 3rem;
}

header h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

header p {
    font-size: 1.2rem;
    opacity: 0.9;
}

.feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-bottom: 3rem;
}

.feature-card {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 40px rgba(0,0,0,0.15);
}

.feature-card h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: #4a5568;
}

.feature-card p {
    color: #718096;
    line-height: 1.6;
}

.cta-button {
    display: block;
    margin: 0 auto;
    padding: 1rem 2rem;
    background: linear-gradient(45deg, #ff6b6b, #ee5a52);
    color: white;
    border: none;
    border-radius: 50px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(238, 90, 82, 0.4);
}

.cta-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(238, 90, 82, 0.6);
}

.cta-button:active {
    transform: translateY(0);
}

/* Responsive Design */
@media (max-width: 768px) {
    .container {
        padding: 1rem;
    }
    
    header h1 {
        font-size: 2rem;
    }
    
    .feature-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
    }
    
    .feature-card {
        padding: 1.5rem;
    }
}`
      },
      {
        id: 'script-js',
        name: 'script.js',
        type: 'file',
        language: 'javascript',
        content: `// Smart Code Editor JavaScript
console.log('🚀 Smart Code Editor is ready!');

// Function to show a message
function showMessage() {
    const messages = [
        '🎉 Great! JavaScript is working perfectly!',
        '✨ Smart Code Editor rocks!',
        '🚀 Ready to build amazing things?',
        '💡 Try editing this code and see live changes!',
        '🌟 Welcome to the future of coding!'
    ];
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    alert(randomMessage);
    
    // Add some console output
    console.log('Button clicked at:', new Date().toLocaleTimeString());
    console.log('Random number generated:', Math.random());
}

// Add some interactive features
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Document loaded successfully');
    
    // Add smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    // Add keyboard shortcuts info
    console.log('💡 Keyboard shortcuts:');
    console.log('  Ctrl/Cmd + S: Save file');
    console.log('  Ctrl/Cmd + Enter: Run code');
    console.log('  F5: Refresh preview');
});

// Example of modern JavaScript features
const codeEditorFeatures = {
    syntaxHighlighting: true,
    autoComplete: true,
    livePreview: true,
    aiAssistant: true,
    multiLanguage: ['HTML', 'CSS', 'JavaScript', 'TypeScript']
};

// Demonstrate async/await
async function fetchData() {
    try {
        console.log('🔄 Fetching data...');
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('✅ Data fetched successfully!');
        return { status: 'success', data: 'Smart Code Editor Data' };
    } catch (error) {
        console.error('❌ Error fetching data:', error);
    }
}

// Export for module systems (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { showMessage, fetchData, codeEditorFeatures };
}`
      },
      {
        id: 'readme-md',
        name: 'README.md',
        type: 'file',
        language: 'markdown',
        content: `# Smart Code Editor Project

Welcome to your Smart Code Editor project! This is a sample project to demonstrate the powerful features of our web-based IDE.

## Features

- 🚀 **Fast Development** - Intelligent code completion and suggestions
- 📱 **Live Preview** - See changes instantly across different devices
- 🤖 **AI Assistant** - Smart code analysis and error explanations
- 🎨 **Syntax Highlighting** - Beautiful code coloring for multiple languages
- 📁 **File Management** - Organize your project with folders and files
- 🔧 **Built-in Terminal** - Execute JavaScript and TypeScript directly
- 🎯 **Smart Features** - Auto-save, formatting, and much more

## Getting Started

1. Edit the files in the file explorer
2. See live changes in the preview panel
3. Use the terminal to test JavaScript code
4. Try the AI assistant for code help

## Keyboard Shortcuts

- Ctrl/Cmd + S - Save current file
- Ctrl/Cmd + Enter - Run JavaScript/TypeScript
- F5 - Refresh live preview
- Ctrl/Cmd + / - Toggle comments

## Supported Languages

- HTML
- CSS
- JavaScript
- TypeScript
- Markdown
- JSON

Happy coding! 🎉`
      }
    ]
  }
];

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
  const multiTerminalRef = useRef<MultiTerminalHandle>(null);

  // Auto-save functionality
  useEffect(() => {
    const saveInterval = setInterval(() => {
      // Save files to localStorage
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
        setFiles(JSON.parse(savedFiles));
      } catch (e) {
        console.warn('Failed to load saved files');
      }
    }

    if (savedTabs) {
      try {
        const tabs = JSON.parse(savedTabs);
        setOpenTabs(tabs);
        if (tabs.length > 0 && savedActiveTab) {
          setActiveTab(savedActiveTab);
        }
      } catch (e) {
        console.warn('Failed to load saved tabs');
      }
    }

    // Open default file if no tabs are saved
    if (!savedTabs || JSON.parse(savedTabs).length === 0) {
      const defaultFile = findFileById(defaultFiles, 'index-html');
      if (defaultFile) {
        handleFileSelect(defaultFile);
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
    
    // Update open tabs
    setOpenTabs(tabs => 
      tabs.map(tab => 
        tab.id === fileId ? { ...tab, content } : tab
      )
    );
  };

  const handleFileSelect = (file: FileNode) => {
    if (file.type === 'file') {
      // Add to open tabs if not already open
      if (!openTabs.find(tab => tab.id === file.id)) {
        setOpenTabs(prev => [...prev, file]);
      }
      setActiveTab(file.id);
    }
  };

  const handleTabClose = (fileId: string) => {
    const newTabs = openTabs.filter(tab => tab.id !== fileId);
    setOpenTabs(newTabs);
    
    if (activeTab === fileId) {
      setActiveTab(newTabs.length > 0 ? newTabs[newTabs.length - 1].id : '');
    }
  };

  const handleFileCreate = (name: string, type: 'file' | 'folder', parentId?: string) => {
    const newNode: FileNode = {
      id: `${type}-${Date.now()}`,
      name,
      type,
      content: type === 'file' ? '' : undefined,
      language: type === 'file' ? getLanguageFromExtension(name) : undefined,
      children: type === 'folder' ? [] : undefined
    };

    // Insert into root (basic). Could be extended to use parentId.
    setFiles(prev => [...prev, newNode]);
  };

  const handleFileDelete = (fileId: string) => {
    // Remove from files and tabs
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

  const getLanguageFromExtension = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'html': return 'html';
      case 'css': return 'css';
      case 'js': return 'javascript';
      case 'ts': return 'typescript';
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
        // Navigate to target folder
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
    window.open('https://netlify.com', '_blank');
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-editor-bg">
      {/* Header */}
      <SystemHeader />
      
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
                      <FileText className="w-3 h-3 flex-shrink-0" />
                      <span className="text-xs truncate">{tab.name}</span>
                      {(tab.language === 'javascript' || tab.language === 'typescript') && (
                        <Button
                          variant="ghost"
                          size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!terminalVisible) setTerminalVisible(true);
                          setTimeout(() => {
                            multiTerminalRef.current?.runCode(tab.language, tab.content || '');
                          }, 100);
                        }}
                          className="h-4 w-4 p-0 opacity-0 group-hover:opacity-60 hover:opacity-100 text-editor-success"
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
              <div className="flex-1">
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
          
          {/* Right Panel - Preview or AI */}
          {rightPanelVisible && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
                <Tabs 
                  value={activeRightTab} 
                  onValueChange={setActiveRightTab} 
                  className="h-full flex flex-col"
                >
                  <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-editor-sidebar">
                    <TabsList className="bg-editor-panel h-8">
                      <TabsTrigger value="preview" className="text-xs h-6 px-3">
                        <Monitor className="w-3 h-3 mr-1" />
                        Preview
                      </TabsTrigger>
                      <TabsTrigger value="ai" className="text-xs h-6 px-3">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI Assistant
                      </TabsTrigger>
                    </TabsList>
                    
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

                  <TabsContent value="preview" className="flex-1 m-0">
                    <LivePreview 
                      htmlContent={previewContent.html} 
                      cssContent={previewContent.css} 
                      jsContent={previewContent.js}
                    />
                  </TabsContent>
                  
                  <TabsContent value="ai" className="flex-1 m-0">
                    <ChatPanel 
                      getActiveContext={() => {
                        const activeFile = openTabs.find(tab => tab.id === activeTab);
                        return {
                          fileName: activeFile?.name,
                          code: activeFile?.content
                        };
                      }}
                      onYouTubePlay={(url) => {
                        setYoutubeUrl(url);
                        setShowYouTube(true);
                        setRightPanelVisible(false);
                        setSidebarVisible(false);
                      }}
                    />
                  </TabsContent>
                </Tabs>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
        
        {/* Bottom Terminal */}
        {terminalVisible && (
          <div className="h-[300px] border-t border-border bg-editor-bg flex flex-col">
            <div className="flex items-center justify-between bg-editor-sidebar border-b border-border px-3 py-2 h-10">
              <div className="text-sm font-medium text-editor-text">Terminal</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTerminalVisible(false)}
                className="h-6 w-6 p-0"
                title="Close terminal"
              >
                <ChevronDown className="w-3 h-3" />
              </Button>
            </div>
            <div className="flex-1">
              <MultiTerminal ref={multiTerminalRef} getFileSystem={() => files} />
            </div>
          </div>
        )}
      </div>
      
      {/* Toggle Buttons */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        {!rightPanelVisible && (
          <Button
            onClick={() => setRightPanelVisible(true)}
            className="rounded-full h-9 w-9 p-0 glow-accent"
            title="Show preview/AI panel"
          >
            <Monitor className="w-4 h-4" />
          </Button>
        )}
        {!terminalVisible && (
          <Button
            onClick={() => setTerminalVisible(true)}
            className="rounded-full h-9 w-9 p-0 glow-accent"
            title="Show terminal"
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};