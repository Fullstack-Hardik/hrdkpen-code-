import { useState, useRef, useCallback, useEffect } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import { X, Monitor, Bot, Search, Minus, Square, BookOpen, Plus, Image as ImageIcon, PenTool, FolderTree, GraduationCap, Copy, Check, Brain, Loader2, Trash2, HelpCircle, Play, Activity } from 'lucide-react';

import { SystemHeader } from './SystemHeader';
import { FileExplorer } from './FileExplorer';
import { CodeEditor, type EditorAPI } from './CodeEditor';
import { LivePreview } from './LivePreview';
import { Terminal, type TerminalHandle } from './Terminal';
import { PublishModal } from '@/components/publish/PublishModal';
import { StatusBar } from './StatusBar';
import { ActivityBar, type ActivityBarView } from '@/components/layout/ActivityBar';
import { SmartPopup } from '@/components/ai/SmartPopup';
import { AIAssistant, AIAssistantRef } from '@/components/ai/AIAssistant';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { ProblemsPanel, type Problem } from '@/components/panels/ProblemsPanel';
import { OutputPanel, type OutputLine, makeOutputLine } from '@/components/panels/OutputPanel';
import { ProjectsPanel } from '@/components/panels/ProjectsPanel';
import { IframePanel } from '@/components/panels/IframePanel';
import { AssetLibrary } from '@/components/assets/AssetLibrary';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { BootstrapScreen } from '@/components/layout/BootstrapScreen';
import { DoctorKitBadge } from '@/components/layout/DoctorKitBadge';
import { useWorkspace } from '@/hooks/use-workspace';
import { useSettings } from '@/hooks/use-settings';
import { useDoctorKit } from '@/hooks/useDoctorKit';
import { getLanguageFromFilename, PREVIEW_LANGUAGES, LANGUAGE_TEMPLATES } from '@/lib/languages';
import { getFileLanguageIcon } from '@/utils/languageIcons';
import { executeJavaScript, executePython, executeCompiled } from '@/lib/execution';
import { getWebContainer, clearWebContainerFS } from '@/lib/webcontainer';
import { downloadProject, publishProject } from '@/lib/publish';
import { useToast } from '@/hooks/use-toast';
import type { FileSystemTree } from '@webcontainer/api';
import { processManager } from '@/lib/processManager';
import { fsSyncService } from '@/lib/fsSync';

import type { FileNode } from '@/types';

// ─────────────────── Types ───────────────────
import { DocsViewer } from '@/components/docs/DocsViewer';
import { HelpCenter } from '@/components/docs/HelpCenter';

export type BottomPanel = 'terminal' | 'output' | 'problems' | 'inspect' | 'help';
type RightPanel  = 'preview' | 'ai' | 'docs' | 'assets' | null;

// ─────────────────── Starter workspace ───────────────────
const STARTER_FILES: { name: string; content: string }[] = [
  { name: 'index.html',
    content: LANGUAGE_TEMPLATES.html },
  { name: 'style.css',
    content: LANGUAGE_TEMPLATES.css },
  { name: 'script.js',
    content: `// JavaScript\nconsole.log('Hello from HRDK Pen!');\n\ndocument.querySelector('h1').style.color = '#89b4fa';\n` },
];

// ─────────────────── Component ───────────────────
export const SmartCodeEditor = () => {
  const workspace = useWorkspace();
  const { settings, update: updateSetting, reset: resetSettings } = useSettings();
  const { toast } = useToast();

  // Active view states
  const [activityView, setActivityView]   = useState<ActivityBarView>('explorer');
  const [openTabs, setOpenTabs]           = useState<FileNode[]>([]);
  const [activeTabId, setActiveTabId]     = useState<string>('');
  const [rightPanel, setRightPanel] = useState<RightPanel>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showBootstrap, setShowBootstrap] = useState(false);
  const [settingsCategory, setSettingsCategory] = useState<'appearance' | 'editor' | 'terminal' | 'preview' | 'extensions' | 'diagnostics'>('appearance');
  const [bottomPanelOpen, setBottomPanelOpen] = useState(false);
  const [bottomTab, setBottomTab]         = useState<BottomPanel>('terminal');
  const [searchQuery, setSearchQuery]     = useState('');
  const [isScaffolding, setIsScaffolding] = useState(false);
  const [isFullscreen, setIsFullscreen]   = useState(false);
  const [isZenMode, setIsZenMode]         = useState(false);

  const doctorKit = useDoctorKit();

  // Editor diagnostics
  const [problems, setProblems]   = useState<Problem[]>([]);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  // Output panel
  const [outputLines, setOutputLines] = useState<OutputLine[]>([]);

  // Selection
  const [selection, setSelection] = useState<{ text: string; pos: { top: number; left: number; height: number } | null }>({ text: '', pos: null });

  // Command Palette
  const [paletteOpen, setPaletteOpen] = useState(false);

  // ─── Terminal Pages State ───
  const [terminals, setTerminals] = useState<{ id: string; name: string; isManaged?: boolean }[]>([{ id: 'term-1', name: 'bash' }]);
  const [activeTerminalId, setActiveTerminalId] = useState('term-1');
  const terminalRefs = useRef<Record<string, TerminalHandle | null>>({});

  useEffect(() => {
    if (!workspace.activeProjectId) return;
    const unsubscribe = processManager.subscribe((processes) => {
       const projectProcs = processes.filter(p => p.projectId === workspace.activeProjectId);
       setTerminals(prev => {
          const next = [...prev];
          let changed = false;
          for (const p of projectProcs) {
             if (!next.find(t => t.id === p.id)) {
                next.push({ id: p.id, name: p.command, isManaged: true });
                changed = true;
             }
          }
          return changed ? next : prev;
       });
    });
    return () => unsubscribe();
  }, [workspace.activeProjectId]);

  const handleAddTerminal = () => {
    const id = `term-${Date.now()}`;
    setTerminals(prev => [...prev, { id, name: 'bash' }]);
    setActiveTerminalId(id);
    setBottomPanelOpen(true);
    setBottomTab('terminal');
  };

  const handleRemoveTerminal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTerminals(prev => {
      const updated = prev.filter(t => t.id !== id);
      if (activeTerminalId === id && updated.length > 0) {
        setActiveTerminalId(updated[updated.length - 1].id);
      }
      return updated;
    });
  };

  const terminalRef = {
    current: {
      runCode: (lang: string, code: string) => {
        terminalRefs.current[activeTerminalId]?.runCode(lang, code);
      },
      execute: (cmd: string) => {
        terminalRefs.current[activeTerminalId]?.execute(cmd);
      }
    }
  };
  const editorRef   = useRef<EditorAPI | null>(null);

  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [serverReadyCount, setServerReadyCount] = useState(0);
  const [inspectEnabled, setInspectEnabled] = useState(false);
  const aiAssistantRef = useRef<AIAssistantRef>(null);
  const staticServerRunning = useRef<string | null>(null);

  // Auto-complete state
  const [brainWidget, setBrainWidget] = useState<{ visible: boolean; top: number; left: number; loading: boolean }>({ visible: false, top: 0, left: 0, loading: false });
  const cursorPixelRef = useRef({ top: 0, left: 0 });
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ─── Listen to WebContainer server ready ───
  useEffect(() => {
    let cleanup = false;
    getWebContainer().then(wc => {
      if (cleanup) return;
      wc.on('server-ready', (port, url) => {
        console.log(`Server ready on port ${port} at ${url}`);
        setServerUrl(url);
        setServerReadyCount(c => c + 1);
      });
    }).catch(err => console.error(err));
    return () => { cleanup = true; };
  }, []);

  // ─── Sync Workspace to WebContainer ───
  const lastMountedProjectRef = useRef<string | null>(null);
  
  useEffect(() => {
    const syncToWC = async () => {
      if (!workspace.isReady || !workspace.activeProjectId) return;
      
      try {
        const wc = await getWebContainer();
        
        // If it's a new project, mount the entire tree
        if (lastMountedProjectRef.current !== workspace.activeProjectId) {
          const buildTree = (nodes: FileNode[]): FileSystemTree => {
            const tree: FileSystemTree = {};
            for (const n of nodes) {
              if (n.type === 'file') {
                let contents = n.content ?? '';
                if (inspectEnabled && (n.name === 'index.html' || n.name.endsWith('.html'))) {
                  contents = contents.replace(/<head([^>]*)>/i, `<head$1><script src="https://cdn.jsdelivr.net/npm/eruda"></script><script>eruda.init({defaults:{displaySize:100,transparency:1,theme:'Dark'}}); eruda.show(); eruda._entryBtn.hide();</script>`);
                }
                tree[n.name] = { file: { contents } };
              } else if (n.type === 'folder') {
                tree[n.name] = { directory: buildTree(n.children ?? []) };
              }
            }
            return tree;
          };
          await clearWebContainerFS();
          await wc.mount(buildTree(workspace.files));
          lastMountedProjectRef.current = workspace.activeProjectId;

          // Restored project boot logic
          const pkgFile = workspace.files.find(f => f.name === 'package.json');
          if (pkgFile && pkgFile.content) {
            try {
              const pkg = JSON.parse(pkgFile.content);
              // ✅ FIX: Check if node_modules already exists before running npm install
              // This avoids unnecessary reinstall within the same session
              let hasNodeModules = false;
              try {
                await wc.fs.readdir('/node_modules');
                hasNodeModules = true;
              } catch { /* node_modules doesn't exist */ }

              if (!hasNodeModules) {
                const p = await processManager.spawn(workspace.activeProjectId, 'npm', ['install', '--no-audit', '--no-fund', '--legacy-peer-deps']);
                p.exit.then(() => {
                  if (pkg.scripts && pkg.scripts.dev) {
                    processManager.spawn(workspace.activeProjectId, 'npm', ['run', 'dev']).catch(console.error);
                  } else if (pkg.scripts && pkg.scripts.start) {
                    processManager.spawn(workspace.activeProjectId, 'npm', ['start']).catch(console.error);
                  }
                });
              } else {
                // node_modules exists: just run dev server
                if (pkg.scripts && pkg.scripts.dev) {
                  processManager.spawn(workspace.activeProjectId, 'npm', ['run', 'dev']).catch(console.error);
                } else if (pkg.scripts && pkg.scripts.start) {
                  processManager.spawn(workspace.activeProjectId, 'npm', ['start']).catch(console.error);
                }
              }
            } catch (e) {
              console.error('Failed to parse package.json on boot', e);
            }
          }

          // Start a lightweight static server if this is a static project (no package.json)
          const hasPackageJson = !!pkgFile;
          if (!hasPackageJson && staticServerRunning.current !== workspace.activeProjectId) {
            staticServerRunning.current = workspace.activeProjectId;
            
            const serverScript = `
const http = require('http');
const fs = require('fs');
const path = require('path');
http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  let p = path.join(__dirname, urlPath === '/' ? 'index.html' : urlPath);
  if (!fs.existsSync(p)) { 
    res.statusCode = 404; 
    return res.end('404 Not Found'); 
  }
  const ext = path.extname(p);
  const mime = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.svg': 'image/svg+xml'
  }[ext] || 'text/plain';
  res.setHeader('Content-Type', mime);
  res.end(fs.readFileSync(p));
}).listen(3000, () => console.log('Static server started'));
`;
            await wc.fs.writeFile('/.static-server.js', serverScript);
            // We use the raw WebContainer spawn here so it runs silently in the background
            // without cluttering the Terminal UI, but still triggers 'server-ready'
            wc.spawn('node', ['/.static-server.js']).catch(console.error);
          }
        } else {
          // If just toggling inspect, only rewrite HTML files
          const updateHtmlFiles = async (nodes: FileNode[], path = '') => {
            for (const n of nodes) {
              const fullPath = path ? `${path}/${n.name}` : `/${n.name}`;
              if (n.type === 'file' && (n.name === 'index.html' || n.name.endsWith('.html'))) {
                let contents = n.content ?? '';
                if (inspectEnabled) {
                  contents = contents.replace(/<head([^>]*)>/i, `<head$1><script src="https://cdn.jsdelivr.net/npm/eruda"></script><script>eruda.init({defaults:{displaySize:100,transparency:1,theme:'Dark'}}); eruda.show(); eruda._entryBtn.hide();</script>`);
                }
                await wc.fs.writeFile(fullPath, contents).catch(() => {});
              } else if (n.type === 'folder') {
                await updateHtmlFiles(n.children ?? [], fullPath);
              }
            }
          };
          await updateHtmlFiles(workspace.files);
        }
      } catch (e) {
        console.error('Failed to sync to WebContainer:', e);
      }
    };
    syncToWC();
  }, [workspace.activeProjectId, workspace.isReady, inspectEnabled]); // Intentionally omitting workspace.files to avoid remount loop

  // Use a ref to hold latest workspace files for the sync service to preserve UUIDs
  const workspaceFilesRef = useRef(workspace.files);
  useEffect(() => {
    workspaceFilesRef.current = workspace.files;
  }, [workspace.files]);

  // Listen to FS changes from WebContainer and update React state
  useEffect(() => {
    if (!workspace.isReady || !workspace.activeProjectId) return;
    const unsubscribe = fsSyncService.subscribe(
      (newFiles) => {
        // Merge content to prevent overwriting active editor state if possible, or just accept true FS state
        workspace.setWorkspaceFiles(newFiles);
      },
      () => workspaceFilesRef.current
    );
    return () => unsubscribe();
  }, [workspace.isReady, workspace.activeProjectId, workspace.setWorkspaceFiles]);

  // Removed STARTER_FILES since we use BootstrapScreen now.


  // ─── Tab management ───
  const openTab = useCallback((file: FileNode) => {
    if (file.type !== 'file') return;
    const fresh = workspace.findFile(file.id) ?? file;
    setOpenTabs(prev => prev.find(t => t.id === fresh.id) ? prev : [...prev, fresh]);
    setActiveTabId(fresh.id);
  }, [workspace]);

  // Keep open tabs in sync with workspace.files for external changes (like npm install)
  useEffect(() => {
    setOpenTabs(prev => {
      let changed = false;
      const next = prev.map(tab => {
        const wFile = workspace.findFile(tab.id);
        if (wFile && wFile.content !== tab.content) {
          changed = true;
          return { ...tab, content: wFile.content };
        }
        return tab;
      });
      return changed ? next : prev;
    });
  }, [workspace.files, workspace.findFile]);

  const closeTab = useCallback((id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setOpenTabs(prev => {
      const next = prev.filter(t => t.id !== id);
      if (activeTabId === id) setActiveTabId(next.length ? next[next.length - 1].id : '');
      return next;
    });
  }, [activeTabId]);

  const handleContentChange = useCallback((content: string) => {
    if (!activeTabId) return;
    
    // Immediately update UI state
    workspace.updateFileContent(activeTabId, content);
    
    // Immediately write to WebContainer to prevent polling race conditions
    const filePath = workspace.findFilePath(activeTabId);
    if (filePath) {
      getWebContainer().then(wc => {
        let finalContent = content;
        if (inspectEnabled && (filePath === 'index.html' || filePath.endsWith('.html'))) {
          finalContent = content.replace(/<head([^>]*)>/i, `<head$1><script src="https://cdn.jsdelivr.net/npm/eruda"></script><script>eruda.init({defaults:{displaySize:100,transparency:1,theme:'Dark'}}); eruda.show(); eruda._entryBtn.hide();</script>`);
        }
        wc.fs.writeFile(`/${filePath}`, finalContent).catch(err => {
          console.error('Failed to write file to WebContainer:', err);
        });
      });
    }
  }, [activeTabId, workspace, inspectEnabled]);

  const handleFileCreate = useCallback((name: string, type: 'file' | 'folder', parentId?: string) => {
    let parentPath = '';
    if (parentId) {
      parentPath = workspace.findFilePath(parentId) || '';
    }
    const path = parentPath ? `${parentPath}/${name}` : name;

    workspace.createFile(name, type, parentId);
    
    fsSyncService.unmarkDeleted(path);
    getWebContainer().then(wc => {
      if (type === 'file') wc.fs.writeFile(`/${path}`, '').catch(console.error);
      else wc.fs.mkdir(`/${path}`).catch(console.error);
    });
  }, [workspace]);

  const handleFileRename = useCallback((id: string, name: string) => {
    const oldPath = workspace.findFilePath(id);
    workspace.renameFile(id, name);
    setTimeout(() => {
      const newPath = workspace.findFilePath(id);
      if (oldPath && newPath && oldPath !== newPath) {
        fsSyncService.unmarkDeleted(newPath);
        getWebContainer().then(async wc => {
           try {
             // Basic rename by reading old and writing new, then deleting old
             const content = await wc.fs.readFile(`/${oldPath}`, 'utf8').catch(() => '');
             await wc.fs.writeFile(`/${newPath}`, content);
             await wc.fs.rm(`/${oldPath}`, { recursive: true });
           } catch (e) {
             console.error('Failed to rename in WebContainer:', e);
           }
        });
      }
    }, 100);
    setOpenTabs(prev => prev.map(t =>
      t.id === id ? { ...t, name, language: getLanguageFromFilename(name) } : t
    ));
  }, [workspace]);

  const handleFileDelete = useCallback((id: string) => {
    const path = workspace.findFilePath(id);
    workspace.deleteFile(id);
    if (path) {
      getWebContainer().then(wc => {
        wc.fs.rm(`/${path}`, { recursive: true }).catch(console.error);
      });
    }
    closeTab(id);
  }, [workspace, closeTab]);

  const handleFileMove = useCallback((dragId: string, targetFolderId: string | null) => {
    const oldPath = workspace.findFilePath(dragId);
    workspace.moveNode(dragId, targetFolderId);
    setTimeout(() => {
      const newPath = workspace.findFilePath(dragId);
      if (oldPath && newPath && oldPath !== newPath) {
        fsSyncService.unmarkDeleted(newPath);
        getWebContainer().then(async wc => {
           try {
             const content = await wc.fs.readFile(`/${oldPath}`, 'utf8').catch(() => '');
             await wc.fs.writeFile(`/${newPath}`, content);
             await wc.fs.rm(`/${oldPath}`, { recursive: true });
           } catch (e) {
             console.error('Failed to move in WebContainer:', e);
           }
        });
      }
    }, 100);
  }, [workspace]);

  const handleImportFolder = useCallback(async (files: { path: string; content: string }[]) => {
    await workspace.importFolder(files);
    const wc = await getWebContainer();
    for (const f of files) {
       const parts = f.path.split('/');
       parts.pop(); // remove filename
       let current = '';
       for (const p of parts) {
         current += `/${p}`;
         await wc.fs.mkdir(current).catch(() => {}); // ignore already exists
       }
       await wc.fs.writeFile(`/${f.path}`, f.content).catch(() => {});
    }
  }, [workspace]);

  // ─── Active file ───
  const activeFile = openTabs.find(t => t.id === activeTabId) ?? null;

  // Keep open tab content in sync with workspace and auto-close deleted files
  useEffect(() => {
    setOpenTabs(prev => prev.map(t => {
      if (t.id.startsWith('tool:')) return t;
      const fresh = workspace.findFile(t.id);
      return fresh ? { ...t, content: fresh.content } : null;
    }).filter(Boolean) as FileNode[]);
  }, [workspace.files]);  



  // ─── Live preview content ───
  const getHtmlContent = () => {
    if (activeFile?.language === 'html') return activeFile.content;
    return openTabs.find(t => t.language === 'html')?.content ?? '';
  };

  const previewContent = {
    html: getHtmlContent(),
    css:  openTabs.find(t => t.language === 'css')?.content ?? '',
    js:   openTabs.find(t => t.language === 'javascript' || t.language === 'typescript')?.content ?? '',
  };

  // ─── Code execution ───
  const addOutput = useCallback((type: OutputLine['type'], text: string) => {
    setOutputLines(prev => [...prev, makeOutputLine(type, text)]);
  }, []);

  const runActiveFile = useCallback(async () => {
    if (!activeFile?.content) return;
    const lang = activeFile.language ?? '';

    // Switch to output panel
    setBottomPanelOpen(true);
    setBottomTab('output');

    addOutput('system', `▶ Running ${activeFile.name}...`);

    try {
      if (lang === 'javascript' || lang === 'typescript') {
        const r = await executeJavaScript(activeFile.content);
        r.sandboxResult.logs.forEach(l => addOutput(l.type as OutputLine['type'], l.args.join(' ')));
        r.sandboxResult.alerts.forEach(a => addOutput('alert', `[${a.kind}] ${a.message}`));
        r.sandboxResult.errors.forEach(e => addOutput('error', e));
        if (!r.sandboxResult.logs.length && !r.sandboxResult.errors.length) {
          addOutput('system', '(no output)');
        }
      } else if (lang === 'python') {
        addOutput('system', 'Loading Python environment...');
        const r = await executePython(activeFile.content);
        if (r.stdout) addOutput('log', r.stdout);
        if (r.stderr) addOutput('error', r.stderr);
        if (!r.stdout && !r.stderr) addOutput('system', '(no output)');
      } else if (lang === 'c' || lang === 'cpp') {
        addOutput('system', 'Compiling with GCC via Piston API...');
        try {
          const r = await executeCompiled(lang as 'c' | 'cpp', activeFile.content);
          if (r.stdout) addOutput('log', r.stdout);
          if (r.stderr) addOutput('error', r.stderr);
          if (r.exitCode !== 0) addOutput('error', `Exit code: ${r.exitCode}`);
          else if (!r.stdout && !r.stderr) addOutput('system', '(no output)');
        } catch {
          addOutput('error', 'Server unavailable. Start Express server: cd server && node index.js');
        }
      }
    } catch (e: unknown) {
      addOutput('error', String(e));
    }
  }, [activeFile, addOutput]);

  const handleBrainClick = async () => {
    if (!activeFile?.content || !aiAssistantRef.current || !editorRef.current) return;
    
    setBrainWidget(prev => ({ ...prev, loading: true }));
    const generatedCode = await aiAssistantRef.current.autoComplete(
      activeFile.content,
      cursorPos.line,
      cursorPos.col
    );
    
    if (generatedCode && editorRef.current) {
      editorRef.current.insertTextAtCursor(generatedCode);
    }
    setBrainWidget(prev => ({ ...prev, visible: false, loading: false }));
  };

  const handleSmartAction = (action: 'explain' | 'fix' | 'optimize') => {
      const message = `Please ${action} this code:\n\`\`\`\n${selection.text}\n\`\`\``;
      window.open(`https://chatgpt.com/?q=${encodeURIComponent(message)}`, '_blank');
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        runActiveFile();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        setBottomPanelOpen(v => !v);
      }
      if (e.key === 'F11') {
        e.preventDefault();
        handleToggleFullscreen();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        const zHandler = (ze: KeyboardEvent) => {
          if (ze.key.toLowerCase() === 'z') {
            ze.preventDefault();
            setIsZenMode(prev => !prev);
          }
          window.removeEventListener('keydown', zHandler);
        };
        window.addEventListener('keydown', zHandler, { once: true });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [runActiveFile]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleToggleZenMode = () => {
    setIsZenMode(v => !v);
  };

  // Command Palette Actions
  const handlePaletteAction = useCallback((action: string, payload?: any) => {
    if (action === 'openFile') {
      openTab(payload);
    } else if (action === 'run') {
      runActiveFile();
    } else if (action === 'view') {
      if (payload === 'settings') {
        setActivityView('settings');
      } else {
        setRightPanel(payload);
      }
    }
  }, [openTab, runActiveFile]);

  // ─── Problems ───
  const handleEditorErrors = useCallback((errs: { line: number; message: string }[]) => {
    if (!activeFile) return;
    setProblems(prev => {
      const other = prev.filter(p => p.fileId !== activeFile.id);
      const newProbs: Problem[] = errs.map(e => ({
        fileId: activeFile.id,
        fileName: activeFile.name,
        line: e.line,
        column: 1,
        severity: 'error' as const,
        message: e.message,
      }));
      return [...other, ...newProbs];
    });
  }, [activeFile]);

  const jumpToLine = useCallback((fileId: string, line: number, col: number) => {
    const tab = openTabs.find(t => t.id === fileId);
    if (tab) {
      setActiveTabId(fileId);
      setTimeout(() => editorRef.current?.goToLine(line, col), 100);
    }
  }, [openTabs]);

  // ─── Format ───
  const handleFormat = () => editorRef.current?.format();

  // ─── Export ZIP ───
  const exportProject = async () => {
    try {
      await downloadProject(workspace.files, 'hrdk-pen-project');
      toast({ title: 'Export complete!' });
    } catch (e: any) {
      toast({ title: 'Export failed', description: e.message, variant: 'destructive' });
    }
  };

  // ─── Publish ───
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  const handlePublishClick = () => {
    setIsPublishModalOpen(true);
  };

  const handlePublishSubmit = async (details: { name: string; description: string; category: string }) => {
    try {
      const url = await publishProject(workspace.files, details);
      toast({ 
        title: 'Project Published 🎉', 
        description: `Live URL: ${url}`,
      });
      addOutput('info', `Project "${details.name}" published successfully to: ${url}`);
    } catch (e: any) {
      toast({ title: 'Publish failed', description: e.message, variant: 'destructive' });
    }
  };

  // ─── Download current file ───
  const downloadCurrent = () => {
    if (!activeFile?.content) return;
    const blob = new Blob([activeFile.content], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = activeFile.name;
    a.click();
  };

  // ─── Sidebar content ───
  const renderSidebarContent = () => {
    if (activityView === 'settings') {
      return (
        <SettingsPanel
          settings={settings}
          onUpdate={updateSetting}
          onReset={resetSettings}
          onClose={() => setShowSettings(false)}
          initialCategory={settingsCategory}
        />
      );
    }
    if (activityView === 'projects') {
      return (
        <ProjectsPanel
          projects={workspace.projects}
          activeProjectId={workspace.activeProjectId}
          onOpenProject={async (id) => {
            await workspace.switchProject(id);
            setActivityView('explorer');
          }}
          onDeleteProject={workspace.deleteProject}
          onRenameProject={workspace.renameProject}
          onCopyProject={workspace.copyProject}
          onCreateNew={() => setShowBootstrap(true)}
        />
      );
    }
    if (activityView === 'search') {
      return (
        <div className="flex flex-col h-full">
          <div className="px-3 py-2 border-b border-editor-border">
            <p className="text-xs font-semibold text-editor-text-muted uppercase tracking-wider mb-2">Search</p>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search in files..."
              className="w-full h-7 px-2 text-xs bg-editor-bg border border-editor-border rounded text-editor-text outline-none focus:border-editor-accent"
            />
          </div>
          {searchQuery && (
            <div className="flex-1 overflow-y-auto p-2 space-y-1 font-code text-xs">
              {(() => {
                const results: { file: FileNode; lines: { n: number; text: string }[] }[] = [];
                const search = (nodes: FileNode[]) => {
                  for (const n of nodes) {
                    if (n.type === 'file' && n.content) {
                      const matches = n.content.split('\n')
                        .map((text, i) => ({ n: i + 1, text }))
                        .filter(l => l.text.toLowerCase().includes(searchQuery.toLowerCase()));
                      if (matches.length) results.push({ file: n, lines: matches });
                    }
                    if (n.children) search(n.children);
                  }
                };
                search(workspace.files);
                if (!results.length) return <p className="text-editor-text-dim p-2">No results</p>;
                return results.map(r => (
                  <div key={r.file.id}>
                    <div
                      className="flex items-center gap-1.5 px-1 py-0.5 cursor-pointer hover:bg-editor-active-tab rounded text-editor-text font-medium"
                      onClick={() => openTab(r.file)}
                    >
                      {getFileLanguageIcon(r.file.name, 'w-3 h-3')}
                      <span>{r.file.name}</span>
                      <span className="text-editor-text-dim ml-auto">{r.lines.length}</span>
                    </div>
                    {r.lines.slice(0, 5).map(l => (
                      <div
                        key={l.n}
                        onClick={() => { openTab(r.file); jumpToLine(r.file.id, l.n, 1); }}
                        className="pl-5 py-0.5 text-editor-text-muted hover:text-editor-text cursor-pointer hover:bg-editor-active-tab rounded truncate"
                        title={l.text}
                      >
                        <span className="text-editor-text-dim mr-1.5">{l.n}</span>
                        {l.text.trim()}
                      </div>
                    ))}
                  </div>
                ));
              })()}
            </div>
          )}
        </div>
      );
    }
    if (activityView === 'docs') {
      return <DocsViewer />;
    }
    if (activityView === 'help') {
      return <HelpCenter />;
    }
    if (activityView === 'assets') {
      return <AssetLibrary />;
    }
    // Default: explorer
    const activeProject = workspace.projects.find(p => p.id === workspace.activeProjectId);
    return (
      <FileExplorer
        files={workspace.files}
        selectedFileId={activeTabId}
        onFileSelect={openTab}
        onFileCreate={handleFileCreate}
        onFileDelete={handleFileDelete}
        onFileRename={handleFileRename}
        onMove={handleFileMove}
        onImportFolder={handleImportFolder}
        projectName={activeProject?.name}
        onSync={() => {
          fsSyncService.forceSync();
        }}
        onLoadTemplate={async (type) => {
          const result = await workspace.loadTemplate(type);
          
          if (result.needsInstall) {
            setIsScaffolding(true);
            setTimeout(async () => {
              setBottomPanelOpen(true);
              setBottomTab('terminal');
              
              if (result.type === 'react') {
                 const p1 = await processManager.spawn(result.id, 'npx', ['-y', 'create-vite@latest', '.', '--template', 'react-ts']);
                 await p1.exit;
                 const p2 = await processManager.spawn(result.id, 'npm', ['install', '--no-audit', '--no-fund', '--legacy-peer-deps']);
                 await p2.exit;
                 await processManager.spawn(result.id, 'npm', ['run', 'dev']);
              } else if (result.type === 'express' || result.type === 'node') {
                 const p1 = await processManager.spawn(result.id, 'npm', ['init', '-y']);
                 await p1.exit;
                 if (result.type === 'express') {
                    const p2 = await processManager.spawn(result.id, 'npm', ['install', 'express', '--no-audit', '--no-fund']);
                    await p2.exit;
                 }
              }
              setIsScaffolding(false);
            }, 1000);
          }
        }}
      />
    );
  };

  const errorCount = problems.filter(p => p.severity === 'error').length;
  const warningCount = problems.filter(p => p.severity === 'warning').length;

  if (!workspace.isReady) {
    return (
      <div className="flex flex-col items-center justify-center w-screen h-screen bg-[#1e1e2e] text-[#cdd6f4]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
        <p>Loading Workspace...</p>
      </div>
    );
  }
  const needsBootstrap = workspace.isReady && !workspace.activeProjectId;
  if (needsBootstrap || showBootstrap) {
    return (
      <BootstrapScreen
        projects={workspace.projects}
        onOpenProject={async (id) => {
          setShowBootstrap(false);
          await workspace.switchProject(id);
        }}
        onDeleteProject={workspace.deleteProject}
        onLoadTemplate={async (type) => {
          setShowBootstrap(false);
          const result = await workspace.loadTemplate(type as any);
          
          if (result.needsInstall) {
            setIsScaffolding(true);
            setTimeout(async () => {
              setBottomPanelOpen(true);
              setBottomTab('terminal');
              
              if (result.type === 'react') {
                 const p1 = await processManager.spawn(result.id, 'npx', ['-y', 'create-vite@latest', '.', '--template', 'react-ts']);
                 await p1.exit;
                 const p2 = await processManager.spawn(result.id, 'npm', ['install', '--no-audit', '--no-fund', '--legacy-peer-deps']);
                 await p2.exit;
                 await processManager.spawn(result.id, 'npm', ['run', 'dev']);
              } else if (result.type === 'express' || result.type === 'node') {
                 const p1 = await processManager.spawn(result.id, 'npm', ['init', '-y']);
                 await p1.exit;
                 if (result.type === 'express') {
                    const p2 = await processManager.spawn(result.id, 'npm', ['install', 'express', '--no-audit', '--no-fund']);
                    await p2.exit;
                 }
              }
              setIsScaffolding(false);
            }, 1000);
          }
        }} 
        onImportFolder={() => {
          setShowBootstrap(false);
          // Trigger the standard import flow
          const input = document.createElement('input');
          input.type = 'file';
          input.webkitdirectory = true;
          input.onchange = async (e) => {
            const files = Array.from((e.target as HTMLInputElement).files || []);
            if (!files.length) return;
            const items = await Promise.all(
              files.map(async f => ({ path: f.webkitRelativePath, content: await f.text() }))
            );
            workspace.importFolder(items);
          };
          input.click();
        }}
      />
    );
  }

  return (
    <div className="ide-root no-select">
      {isScaffolding && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#1e1e2e]/80 backdrop-blur-sm">
          <div className="flex flex-col items-center bg-[#181825] p-6 rounded-lg border border-[#313244] shadow-2xl">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <h3 className="text-[#cdd6f4] font-medium text-lg">Setting up project...</h3>
            <p className="text-[#a6adc8] text-sm mt-2">Running npm installation. See terminal for details.</p>
          </div>
        </div>
      )}
      {/* Header */}
      {!isZenMode && (
        <SystemHeader
          activeFile={activeFile}
          projectName={workspace.projects.find(p => p.id === workspace.activeProjectId)?.name}
          projectLanguage={workspace.projects.find(p => p.id === workspace.activeProjectId)?.language}
          onRun={runActiveFile}
          onFormat={handleFormat}
          onExport={exportProject}
          onPublish={handlePublishClick}
          onDownloadCurrent={downloadCurrent}
          terminalOpen={bottomPanelOpen}
          onToggleTerminal={() => setBottomPanelOpen(v => !v)}
          rightPanelOpen={rightPanel !== null}
          onToggleRightPanel={() => setRightPanel(prev => prev ? null : 'preview')}
          onNewProject={() => setShowBootstrap(true)}
          onOpenProjects={() => setActivityView('projects')}
          onTogglePreview={() => setRightPanel(prev => prev === 'preview' ? null : 'preview')}
          serverUrl={serverUrl}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          isZenMode={isZenMode}
          onToggleZenMode={handleToggleZenMode}
        />
      )}

      <PublishModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onPublish={handlePublishSubmit}
      />

      <CommandPalette 
        open={paletteOpen} 
        setOpen={setPaletteOpen} 
        onAction={handlePaletteAction} 
        files={workspace.files}
      />

      {/* Body */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Activity bar */}
        {!isZenMode && (
          <ActivityBar
            active={activityView}
            onChange={(view) => {
              if (['excalidraw', 'mdn', 'learn'].includes(view)) {
                const toolId = `tool:${view}`;
                const existing = openTabs.find(t => t.id === toolId);
                if (!existing) {
                  const name = view === 'excalidraw' ? 'Whiteboard' : view === 'mdn' ? 'DevDocs' : 'Learn Web Dev';
                  setOpenTabs(prev => [...prev, {
                    id: toolId,
                    name,
                    type: 'file',
                    language: 'tool',
                  } as any]);
                }
                setActiveTabId(toolId);
              } else {
                setActivityView(view);
              }
            }}
            terminalOpen={bottomPanelOpen}
            onToggleTerminal={() => setBottomPanelOpen(v => !v)}
            errorCount={errorCount}
          />
        )}

        {/* Main layout */}
        <div className="flex flex-col flex-1 overflow-hidden min-h-0 relative">
          
          <div className="absolute right-4 bottom-4 z-50 pointer-events-auto">
             <DoctorKitBadge 
               status={doctorKit.status} 
               logs={doctorKit.logs} 
               lastScan={doctorKit.lastScan} 
               onScan={doctorKit.scan} 
             />
          </div>
          
          {isZenMode && (
            <button 
              onClick={handleToggleZenMode}
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-editor-panel border border-editor-border shadow-lg text-editor-text-muted hover:text-editor-text transition-colors"
              title="Exit Zen Mode (Ctrl+K Z)"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <ResizablePanelGroup direction="vertical" className="flex-1 min-h-0">
            <ResizablePanel defaultSize={75} minSize={30} className="flex-1 min-h-0">
              <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Sidebar */}
            {!['excalidraw', 'mdn', 'learn'].includes(activityView) && !isZenMode && (
              <>
                <ResizablePanel defaultSize={20} minSize={14} maxSize={40}>
                  <div className="flex flex-col h-full border-r border-editor-border bg-editor-sidebar">
                    {/* Sidebar title — only show for non-explorer views that need it */}
                    {activityView !== 'explorer' && (
                      <div
                        className="px-4 py-2 flex-shrink-0 border-b border-editor-border"
                        style={{ height: 36 }}
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-editor-text-muted">
                          {activityView === 'search'   ? 'Search'
                          : activityView === 'projects' ? 'Projects'
                          : activityView === 'docs'     ? 'Documentation'
                          : activityView === 'assets'   ? 'Assets'
                          : activityView === 'help'     ? 'Help Center'
                          : 'Settings'}
                        </p>
                      </div>
                    )}
                    <div className="flex-1 overflow-hidden">
                      {renderSidebarContent()}
                    </div>
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
              </>
            )}

            {/* Editor + Right panel */}
            <ResizablePanel defaultSize={rightPanel ? 55 : 80}>
              <div className="flex flex-col h-full overflow-hidden">
                  <>
                {/* Tab bar */}
                <div
                  className="flex items-center overflow-x-auto flex-shrink-0 no-select"
                  style={{
                    height: 36,
                    background: 'hsl(var(--mantle))',
                    borderBottom: '1px solid hsl(var(--surface1))',
                  }}
                >
                  {openTabs.map(tab => (
                    <ContextMenu key={tab.id}>
                      <ContextMenuTrigger>
                        <div
                          className={`editor-tab ${activeTabId === tab.id ? 'active' : ''}`}
                          onClick={() => setActiveTabId(tab.id)}
                          title={tab.name}
                        >
                          {getFileLanguageIcon(tab.name, 'w-3 h-3 flex-shrink-0')}
                          <span className="truncate text-xs">{tab.name}</span>
                          <button
                            className="tab-close"
                            onClick={e => closeTab(tab.id, e)}
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </ContextMenuTrigger>
                      <ContextMenuContent className="w-40 bg-editor-panel border-editor-border text-editor-text">
                        <ContextMenuItem onClick={() => closeTab(tab.id)}>
                          Close
                        </ContextMenuItem>
                        <ContextMenuItem 
                          onClick={() => {
                            setOpenTabs([tab]);
                            setActiveTabId(tab.id);
                          }}
                          disabled={openTabs.length <= 1}
                        >
                          Close Others
                        </ContextMenuItem>
                        <ContextMenuSeparator className="bg-editor-border" />
                        <ContextMenuItem 
                          onClick={() => {
                            setOpenTabs([]);
                            setActiveTabId('');
                          }}
                        >
                          Close All
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  ))}
                </div>

                {/* Editor */}
                <div className="flex-1 min-h-0 relative">
                  {activeFile ? (
                    <>
                      {activeFile.language === 'tool' ? (
                        activeFile.id === 'tool:excalidraw' ? (
                          <IframePanel title="Excalidraw" url="https://excalidraw.com/" icon={<PenTool className="w-5 h-5" />} />
                        ) : activeFile.id === 'tool:mdn' ? (
                          <IframePanel title="DevDocs" url="https://devdocs.io/" icon={<BookOpen className="w-5 h-5" />} />
                        ) : (
                          <IframePanel title="Learn Web Dev" url="https://corsproxy.io/?url=https%3A%2F%2Fweb.dev%2Flearn" icon={<GraduationCap className="w-5 h-5" />} />
                        )
                      ) : (
                        <CodeEditor
                          fileId={activeFile.id}
                          value={activeFile.content ?? ''}
                          onChange={handleContentChange}
                          language={activeFile.language || getLanguageFromFilename(activeFile.name)}
                          fileName={activeFile.name}
                          settings={settings}
                          onRun={runActiveFile}
                          onCursorChange={(line, col, pos) => {
                            setCursorPos({ line, col });
                            if (pos) {
                              cursorPixelRef.current = pos;
                              setBrainWidget(prev => ({ ...prev, visible: false }));
                              if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
                              idleTimerRef.current = setTimeout(() => {
                                setBrainWidget({ visible: true, top: pos.top, left: pos.left, loading: false });
                              }, 5000);
                            }
                          }}
                          onSelectionChange={(text, pos) => setSelection({ text, pos })}
                          onErrors={handleEditorErrors}
                          onEditorReady={api => { editorRef.current = api; }}
                          onAIAction={(action, code) => {
                            setRightPanel('ai');
                            setTimeout(() => {
                              let prompt = '';
                              if (action === 'explain') prompt = `Please explain the following code:\n\n\`\`\`\n${code}\n\`\`\``;
                              else if (action === 'fix') prompt = `Please find and fix any bugs in this code:\n\n\`\`\`\n${code}\n\`\`\``;
                              else if (action === 'optimize') prompt = `Please optimize the following code for performance and readability:\n\n\`\`\`\n${code}\n\`\`\``;
                              aiAssistantRef.current?.submitPrompt(prompt);
                            }, 100);
                          }}
                        />
                      )}
                      <SmartPopup 
                        position={selection.pos}
                        text={selection.text}
                        onAction={handleSmartAction}
                      />
                      {brainWidget.visible && (
                        <div 
                          className="absolute z-50 flex items-center justify-center p-1.5 rounded shadow-lg bg-[hsl(var(--yellow)/0.2)] border border-[hsl(var(--yellow)/0.5)] cursor-pointer hover:bg-[hsl(var(--yellow)/0.4)] transition-all animate-fade-in"
                          style={{ top: brainWidget.top - 28, left: brainWidget.left + 12 }}
                          onClick={handleBrainClick}
                          title="Auto-complete code"
                        >
                          {brainWidget.loading ? (
                            <Loader2 className="w-4 h-4 text-[hsl(var(--yellow))] animate-spin" />
                          ) : (
                            <Brain className="w-4 h-4 text-[hsl(var(--yellow))] animate-pulse" />
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-4 text-center select-none">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center"
                        style={{ background: 'hsl(var(--surface0))' }}
                      >
                        <span className="text-4xl">🖋️</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-editor-text mb-1">No file open</p>
                        <p className="text-xs text-editor-text-muted">
                          Select a file from the Explorer or create a new one
                        </p>
                      </div>
                    </div>
                  )}
                  </div>
                </>
              </div>
            </ResizablePanel>

            {/* Right panel */}
            {rightPanel && (
              <>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={25} minSize={20} maxSize={50}>
                  <div className="flex flex-col h-full border-l border-editor-border">
                    {/* Right panel tabs (macOS Segmented Control Style) */}
                    <div
                      className="flex items-center justify-between flex-shrink-0 px-3"
                      style={{
                        height: 48,
                        background: 'hsl(var(--crust))',
                        borderBottom: '1px solid hsl(var(--surface1))',
                      }}
                    >
                      <div className="flex items-center p-1 rounded-lg bg-editor-bg border border-editor-border/50 shadow-inner">
                        <button
                          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-[11px] font-semibold tracking-wide transition-all duration-200 ${rightPanel === 'preview' ? 'bg-editor-panel text-editor-text shadow-[0_1px_3px_rgba(0,0,0,0.3)] ring-1 ring-white/5' : 'text-editor-text-muted hover:text-editor-text'}`}
                          onClick={() => setRightPanel('preview')}
                        >
                          <Monitor className={`w-3.5 h-3.5 ${rightPanel === 'preview' ? 'text-blue-400' : ''}`} />
                          Preview
                        </button>
                        <button
                          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-[11px] font-semibold tracking-wide transition-all duration-200 ${rightPanel === 'ai' ? 'bg-editor-panel text-editor-text shadow-[0_1px_3px_rgba(0,0,0,0.3)] ring-1 ring-white/5' : 'text-editor-text-muted hover:text-editor-text'}`}
                          onClick={() => setRightPanel('ai')}
                        >
                          <Bot className={`w-3.5 h-3.5 ${rightPanel === 'ai' ? 'text-purple-400' : ''}`} />
                          AI
                        </button>
                        <button
                          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-[11px] font-semibold tracking-wide transition-all duration-200 ${rightPanel === 'docs' ? 'bg-editor-panel text-editor-text shadow-[0_1px_3px_rgba(0,0,0,0.3)] ring-1 ring-white/5' : 'text-editor-text-muted hover:text-editor-text'}`}
                          onClick={() => setRightPanel('docs')}
                        >
                          <BookOpen className={`w-3.5 h-3.5 ${rightPanel === 'docs' ? 'text-green-400' : ''}`} />
                          Docs
                        </button>
                        <button
                          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-[11px] font-semibold tracking-wide transition-all duration-200 ${rightPanel === 'assets' ? 'bg-editor-panel text-editor-text shadow-[0_1px_3px_rgba(0,0,0,0.3)] ring-1 ring-white/5' : 'text-editor-text-muted hover:text-editor-text'}`}
                          onClick={() => setRightPanel('assets')}
                        >
                          <ImageIcon className={`w-3.5 h-3.5 ${rightPanel === 'assets' ? 'text-orange-400' : ''}`} />
                          Assets
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSettingsCategory('diagnostics');
                            setShowSettings(true);
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold tracking-wide transition-all duration-200 border border-editor-border/50 bg-editor-bg/50 hover:bg-editor-panel hover:text-editor-text ${doctorKit.status !== 'healthy' ? 'text-blue-400 border-blue-500/30 bg-blue-500/10' : 'text-editor-text-muted'}`}
                          title="System Diagnostics"
                        >
                          <Activity className={`w-3.5 h-3.5 ${doctorKit.status === 'scanning' ? 'animate-pulse text-blue-400' : doctorKit.status === 'error' ? 'text-red-400' : 'text-green-400'}`} />
                          Doctor Kit
                        </button>
                        <div className="w-[1px] h-4 bg-editor-border mx-1"></div>
                        <button
                          onClick={() => setRightPanel(null)}
                          className="w-7 h-7 flex items-center justify-center rounded-md text-editor-text-dim hover:text-editor-text hover:bg-editor-panel transition-all"
                          title="Close panel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 min-h-0">
                      {rightPanel === 'preview' ? (
                        <LivePreview
                          htmlContent={previewContent.html}
                          cssContent={previewContent.css}
                          jsContent={previewContent.js}
                          activeFileName={activeFile?.name}
                          serverUrl={serverUrl}
                          serverReadyCount={serverReadyCount}
                          inspectEnabled={inspectEnabled}
                          onInspectChange={setInspectEnabled}
                          onNavigate={(url) => {
                            // Find the file by name (simple path matching)
                            const targetName = url.split('/').pop() || url;
                            let targetNode: FileNode | undefined;
                            
                            const searchNode = (nodes: FileNode[]) => {
                              for (const n of nodes) {
                                if (n.name === targetName && n.type === 'file') {
                                  targetNode = n;
                                  return;
                                }
                                if (n.children) searchNode(n.children);
                              }
                            };
                            searchNode(workspace.files);
                            
                            if (targetNode) {
                              openTab(targetNode);
                            } else {
                              addOutput('error', `Navigation failed: ${url} not found in workspace`);
                            }
                          }}
                          onConsoleMessage={(type, args) => {
                            addOutput(type as OutputLine['type'], args.join(' '));
                          }}
                        />
                      ) : rightPanel === 'ai' ? (
                        <AIAssistant ref={aiAssistantRef} />
                      ) : rightPanel === 'assets' ? (
                        <AssetLibrary />
                      ) : rightPanel === 'docs' ? (
                        <DocsViewer />
                      ) : null}
                    </div>
                  </div>
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </ResizablePanel>

        {bottomPanelOpen && !isZenMode && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={25} minSize={10} className="flex flex-col bg-editor-bg z-10">
              <div className="flex-1 flex flex-col h-full border-t border-editor-border">
            {/* Bottom panel tabs */}
            <div
              className="flex items-center justify-between flex-shrink-0"
              style={{
                height: 32,
                background: 'hsl(var(--mantle))',
                borderBottom: '1px solid hsl(var(--surface1))',
              }}
            >
              <div className="flex items-center">
                {(['terminal', 'output', 'problems', 'inspect', 'help'] as BottomPanel[]).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setBottomTab(tab)}
                    className={`panel-tab ${bottomTab === tab ? 'active' : ''}`}
                  >
                    {tab === 'problems' && errorCount > 0 && (
                      <span
                        className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold mr-1"
                        style={{ background: 'hsl(var(--red))', color: 'white' }}
                      >
                        {errorCount > 9 ? '9+' : errorCount}
                      </span>
                    )}
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5 mr-2">
                {bottomTab === 'terminal' && (
                  <>
                    <button
                      onClick={() => terminalRefs.current[activeTerminalId]?.clear()}
                      className="px-2 py-0.5 text-[10px] font-medium rounded text-editor-text-muted hover:text-editor-text hover:bg-editor-active-tab transition-colors border border-transparent hover:border-editor-border"
                      title="Clear Terminal"
                    >
                      <Trash2 className="w-3 h-3 inline mr-1" />
                      Clear
                    </button>
                    <button
                      onClick={() => terminalRefs.current[activeTerminalId]?.execute('help')}
                      className="px-2 py-0.5 text-[10px] font-medium rounded text-editor-text-muted hover:text-editor-text hover:bg-editor-active-tab transition-colors border border-transparent hover:border-editor-border"
                      title="Help Menu"
                    >
                      <HelpCircle className="w-3 h-3 inline mr-1" />
                      Help
                    </button>
                    <button
                      onClick={() => terminalRefs.current[activeTerminalId]?.execute('npm run dev')}
                      className="px-2 py-0.5 text-[10px] font-medium rounded text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors border border-transparent hover:border-emerald-500/20"
                      title="Start Dev Server"
                    >
                      <Play className="w-3 h-3 inline mr-1" />
                      Run Dev
                    </button>
                  </>
                )}
                <button
                  onClick={() => setBottomPanelOpen(false)}
                  className="px-2 text-editor-text-dim hover:text-editor-text transition-fast ml-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Panel content */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <div style={{ display: bottomTab === 'terminal' ? 'flex' : 'none' }} className="flex-col w-full h-full">
                  <div className="flex items-center gap-1 bg-editor-panel border-b border-editor-border px-2 pt-1 overflow-x-auto min-h-[28px]">
                    {terminals.map(term => (
                      <div
                        key={term.id}
                        onClick={() => setActiveTerminalId(term.id)}
                        className={`flex items-center gap-2 px-3 py-1 text-xs cursor-pointer rounded-t-md transition-colors ${
                          activeTerminalId === term.id
                            ? 'bg-[#1e1e2e] text-editor-text border border-editor-border border-b-0'
                            : 'text-editor-text-muted hover:bg-editor-active-tab'
                        }`}
                      >
                        <span>{term.name}</span>
                        {terminals.length > 1 && (
                          <button
                            onClick={(e) => handleRemoveTerminal(term.id, e)}
                            className="p-0.5 hover:bg-editor-border rounded text-editor-text-muted hover:text-editor-error"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={handleAddTerminal}
                      className="p-1 text-editor-text-muted hover:text-editor-text ml-1"
                      title="New Terminal"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 relative bg-[#1e1e2e]">
                    {terminals.map(term => (
                      <div
                        key={term.id}
                        className="absolute inset-0"
                        style={{ display: activeTerminalId === term.id ? 'block' : 'none' }}
                      >
                        <Terminal
                          ref={el => { terminalRefs.current[term.id] = el; }}
                        />
                      </div>
                    ))}
                  </div>
              </div>
              {bottomTab === 'output' && (
                <OutputPanel
                  lines={outputLines}
                  onClear={() => setOutputLines([])}
                />
              )}
              {bottomTab === 'problems' && (
                <ProblemsPanel
                  problems={problems}
                  onJumpTo={(fileId, line, col) => {
                    jumpToLine(fileId, line, col);
                    setBottomPanelOpen(false);
                  }}
                />
              )}
              {bottomTab === 'inspect' && (
                <div className="flex-1 w-full h-full relative">
                  <LivePreview
                    htmlContent={activeFile?.name.endsWith('.html') ? activeFile.content : getHtmlContent()}
                    cssContent={previewContent.css}
                    jsContent={previewContent.js}
                    activeFileName={activeFile?.name}
                    onNavigate={(url) => {
                      const targetName = url.split('/').pop() || url;
                      let targetNode: FileNode | undefined;
                      const searchNode = (nodes: FileNode[]) => {
                        for (const n of nodes) {
                          if (n.name === targetName && n.type === 'file') {
                            targetNode = n; return;
                          }
                          if (n.children) searchNode(n.children);
                        }
                      };
                      searchNode(workspace.files);
                      if (targetNode) {
                        openTab(targetNode);
                      } else {
                        addOutput('error', `Navigation failed: ${url} not found`);
                      }
                    }}
                    onConsoleMessage={(type, args) => {
                      addOutput(type as OutputLine['type'], args.join(' '));
                    }}
                    serverUrl={null} // Important: Do not pass serverUrl here to prevent multiple HMR clients crashing Vite
                    inspectEnabled={true}
                    onInspectChange={setInspectEnabled}
                  />
                </div>
              )}
              {bottomTab === 'help' && (
                <div className="flex-1 overflow-y-auto p-4 bg-editor-bg text-editor-text custom-scrollbar">
                  <div className="max-w-3xl mx-auto space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-emerald-400 mb-2 border-b border-editor-border pb-2">Terminal Commands</h3>
                      <p className="text-sm text-editor-text-muted mb-4">Click to copy a command to use in the terminal.</p>
                      
                      <div className="flex flex-col space-y-2">
                        {[
                          { cmd: 'npm run dev', desc: 'Starts the Vite dev server with Hot Module Replacement (HMR)' },
                          { cmd: 'npm run build', desc: 'Creates an optimized production build in the dist folder' },
                          { cmd: 'npm install', desc: 'Installs all dependencies listed in your package.json' },
                          { cmd: 'help', desc: 'Displays this help documentation' },
                        ].map(item => (
                          <div key={item.cmd} className="flex items-center justify-between p-2 hover:bg-editor-panel/50 rounded group transition-colors">
                            <div className="flex items-center gap-3">
                              <code className="text-blue-400 font-mono text-sm bg-blue-500/10 px-2 py-1 rounded min-w-[120px] text-center">{item.cmd}</code>
                              <span className="text-sm text-editor-text-muted">{item.desc}</span>
                            </div>
                            <button
                              onClick={(e) => {
                                navigator.clipboard.writeText(item.cmd);
                                const btn = e.currentTarget;
                                const original = btn.innerHTML;
                                btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-400"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                                setTimeout(() => btn.innerHTML = original, 2000);
                              }}
                              className="p-1.5 text-editor-text-dim opacity-0 group-hover:opacity-100 hover:text-editor-text hover:bg-editor-panel rounded transition-all"
                              title="Copy command"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ResizablePanel>
      </>
    )}
  </ResizablePanelGroup>
</div>
</div>
      {/* Status bar */}
      {!isZenMode && (
        <StatusBar
          activeFile={activeFile}
          cursorPosition={cursorPos}
          totalLines={activeFile?.content?.split('\n').length ?? 0}
          errors={errorCount}
          warnings={warningCount}
          onShowProblems={() => { setBottomPanelOpen(true); setBottomTab('problems'); }}
        />
      )}
    </div>
  );
};
