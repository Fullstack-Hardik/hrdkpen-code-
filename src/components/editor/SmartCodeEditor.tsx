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
import { X, Monitor, Bot, Search, Minus, Square, BookOpen, Plus, Image as ImageIcon, PenTool, FolderTree, GraduationCap } from 'lucide-react';

import { SystemHeader } from './SystemHeader';
import { FileExplorer } from './FileExplorer';
import { CodeEditor } from './CodeEditor';
import { LivePreview } from './LivePreview';
import { Terminal, type TerminalHandle } from './Terminal';
import { PublishModal } from '@/components/publish/PublishModal';
import { StatusBar } from './StatusBar';
import { ActivityBar, type ActivityBarView } from '@/components/layout/ActivityBar';
import { SmartPopup } from '@/components/ai/SmartPopup';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { ProblemsPanel, type Problem } from '@/components/panels/ProblemsPanel';
import { OutputPanel, type OutputLine, makeOutputLine } from '@/components/panels/OutputPanel';
import { ProjectsPanel } from '@/components/panels/ProjectsPanel';
import { IframePanel } from '@/components/panels/IframePanel';
import { AssetLibrary } from '@/components/assets/AssetLibrary';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { BootstrapScreen } from '@/components/layout/BootstrapScreen';
import { useWorkspace } from '@/hooks/use-workspace';
import { useSettings } from '@/hooks/use-settings';
import { getLanguageFromFilename, PREVIEW_LANGUAGES, LANGUAGE_TEMPLATES } from '@/lib/languages';
import { getFileLanguageIcon } from '@/utils/languageIcons';
import { executeJavaScript, executePython, executeCompiled } from '@/lib/execution';
import { getWebContainer } from '@/lib/webcontainer';
import { downloadProject, publishProject } from '@/lib/publish';
import { useToast } from '@/hooks/use-toast';
import type { FileSystemTree } from '@webcontainer/api';

import type { FileNode } from '@/types';

// ─────────────────── Types ───────────────────
import { DocsViewer } from '@/components/docs/DocsViewer';

export type BottomPanel = 'terminal' | 'output' | 'problems' | 'inspect';
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
  const [showBootstrap, setShowBootstrap] = useState(false);
  const [bottomPanelOpen, setBottomPanelOpen] = useState(false);
  const [bottomTab, setBottomTab]         = useState<BottomPanel>('terminal');
  const [searchQuery, setSearchQuery]     = useState('');

  // Editor diagnostics
  const [problems, setProblems]   = useState<Problem[]>([]);
  const [cursorPos, setCursorPos] = useState({ line: 1, column: 1 });

  // Output panel
  const [outputLines, setOutputLines] = useState<OutputLine[]>([]);

  // Selection
  const [selection, setSelection] = useState<{ text: string; pos: { top: number; left: number; height: number } | null }>({ text: '', pos: null });

  // Command Palette
  const [paletteOpen, setPaletteOpen] = useState(false);

  // ─── Terminal Pages State ───
  const [terminals, setTerminals] = useState<{ id: string; name: string }[]>([{ id: 'term-1', name: 'bash' }]);
  const [activeTerminalId, setActiveTerminalId] = useState('term-1');
  const terminalRefs = useRef<Record<string, TerminalHandle | null>>({});

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
  const editorRef   = useRef<{ format: () => void; goToLine: (line: number, col: number) => void } | null>(null);

  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [inspectEnabled, setInspectEnabled] = useState(false);
  const staticServerRunning = useRef<string | null>(null);

  // ─── Listen to WebContainer server ready ───
  useEffect(() => {
    let cleanup = false;
    getWebContainer().then(wc => {
      if (cleanup) return;
      wc.on('server-ready', (port, url) => {
        console.log(`Server ready on port ${port} at ${url}`);
        setServerUrl(url);
      });
    }).catch(err => console.error(err));
    return () => { cleanup = true; };
  }, []);

  // ─── Sync Workspace to WebContainer ───
  useEffect(() => {
    const syncToWC = async () => {
      try {
        const wc = await getWebContainer();
        const buildTree = (nodes: FileNode[]): FileSystemTree => {
          const tree: FileSystemTree = {};
          for (const n of nodes) {
            if (n.type === 'file') {
              let contents = n.content ?? '';
              if (inspectEnabled && (n.name === 'index.html' || n.name.endsWith('.html'))) {
                contents = contents.replace(/<head([^>]*)>/i, `<head$1><script src="https://cdn.jsdelivr.net/npm/eruda"></script><script>eruda.init();</script>`);
              }
              tree[n.name] = { file: { contents } };
            } else if (n.type === 'folder') {
              tree[n.name] = { directory: buildTree(n.children ?? []) };
            }
          }
          return tree;
        };
        await wc.mount(buildTree(workspace.files));
        
      } catch (e) {
        console.error('Failed to sync to WebContainer:', e);
      }
    };
    syncToWC();
    // Re-run sync when inspect is toggled
  }, [workspace.files, inspectEnabled]);

  // Removed STARTER_FILES since we use BootstrapScreen now.


  // ─── Tab management ───
  const openTab = useCallback((file: FileNode) => {
    if (file.type !== 'file') return;
    const fresh = workspace.findFile(file.id) ?? file;
    setOpenTabs(prev => prev.find(t => t.id === fresh.id) ? prev : [...prev, fresh]);
    setActiveTabId(fresh.id);
  }, [workspace]);

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
    workspace.updateFileContent(activeTabId, content);
    setOpenTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, content } : t));
    
    // Dynamically write to WebContainer FS to trigger HMR efficiently
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

  const handleFileRename = useCallback((id: string, name: string) => {
    workspace.renameFile(id, name);
    setOpenTabs(prev => prev.map(t =>
      t.id === id ? { ...t, name, language: getLanguageFromFilename(name) } : t
    ));
  }, [workspace]);

  const handleFileDelete = useCallback((id: string) => {
    workspace.deleteFile(id);
    closeTab(id);
  }, [workspace, closeTab]);

  // ─── Active file ───
  const activeFile = openTabs.find(t => t.id === activeTabId) ?? null;

  // Keep open tab content in sync with workspace (for imports/renames from elsewhere)
  useEffect(() => {
    setOpenTabs(prev => prev.map(t => {
      const fresh = workspace.findFile(t.id);
      return fresh ? { ...t, content: fresh.content } : t;
    }));
  }, [workspace.files]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Ctrl+Enter global shortcut
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
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [runActiveFile]);

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
          onClose={() => setActivityView('explorer')}
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
    if (activityView === 'assets') {
      return <AssetLibrary />;
    }
    // Default: explorer
    return (
      <FileExplorer
        files={workspace.files}
        selectedFileId={activeTabId}
        onFileSelect={openTab}
        onFileCreate={workspace.createFile}
        onFileDelete={handleFileDelete}
        onFileRename={handleFileRename}
        onImportFolder={workspace.importFolder}
        onSync={async () => {
          const { readWebContainerFS } = await import('@/lib/webcontainer');
          const updatedNodes = await readWebContainerFS(workspace.files);
          workspace.setWorkspaceFiles(updatedNodes);
        }}
        onLoadTemplate={async (type) => {
          const folderName = await workspace.loadTemplate(type);
          
          if (type === 'react' || type === 'express' || type === 'node') {
            // Give the state a moment to settle, then sync files and start dev
            setTimeout(() => {
              setBottomPanelOpen(true);
              setBottomTab('terminal');
              const npmInstall = 'npm install --no-audit --no-fund';
              const cmd = type === 'react' ? `cd ${folderName} && ${npmInstall} && npm run dev` 
                        : type === 'express' ? `cd ${folderName} && ${npmInstall} && npm run dev`
                        : `cd ${folderName} && ${npmInstall} && npm start`;
              const termId = terminals.length > 0 ? terminals[0].id : activeTerminalId;
              const term = terminalRefs.current[termId];
              if (term) term.execute(cmd);
            }, 1000);
          }
        }}
      />
    );
  };

  const errorCount = problems.filter(p => p.severity === 'error').length;
  const warningCount = problems.filter(p => p.severity === 'warning').length;

  useEffect(() => {
    let unmounted = false;
    getWebContainer().then(wc => {
      if (unmounted) return;
      wc.on('server-ready', (port, url) => {
        setServerUrl(url);
      });
    });
    return () => { unmounted = true; };
  }, []);

  // Removed hasBootstrapped useEffect to fix Bootstrap screen locking

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
          const folderName = await workspace.loadTemplate(type as any);
          
          if (type === 'react' || type === 'express' || type === 'node') {
            setTimeout(() => {
              setBottomPanelOpen(true);
              setBottomTab('terminal');
              const npmInstall = 'npm install --no-audit --no-fund';
              const cmd = type === 'react' ? `cd ${folderName} && ${npmInstall} && npm run dev` 
                        : type === 'express' ? `cd ${folderName} && ${npmInstall} && npm run dev`
                        : `cd ${folderName} && ${npmInstall} && npm start`;
              const termId = terminals.length > 0 ? terminals[0].id : activeTerminalId;
              const term = terminalRefs.current[termId];
              if (term) term.execute(cmd);
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
      {/* Header */}
      <SystemHeader
        activeFile={activeFile}
        onRun={runActiveFile}
        onFormat={handleFormat}
        onExport={exportProject}
        onPublish={handlePublishClick}
        onDownloadCurrent={downloadCurrent}
        terminalOpen={bottomPanelOpen}
        onToggleTerminal={() => setBottomPanelOpen(v => !v)}
        rightPanelOpen={rightPanel !== null}
        onToggleRightPanel={() => setRightPanel(prev => prev ? null : 'preview')}
      />

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
        <ActivityBar
          active={activityView}
          onChange={(view) => {
            if (['excalidraw', 'mdn', 'learn'].includes(view)) {
              const toolId = `tool:${view}`;
              const existing = openTabs.find(t => t.id === toolId);
              if (!existing) {
                const name = view === 'excalidraw' ? 'Whiteboard' : view === 'mdn' ? 'MDN Docs' : 'Learn Web Dev';
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

        {/* Main layout */}
        <div className="flex flex-col flex-1 overflow-hidden min-h-0">
          <ResizablePanelGroup direction="vertical" className="flex-1 min-h-0">
            <ResizablePanel defaultSize={75} minSize={30} className="flex-1 min-h-0">
              <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Sidebar */}
            {!['excalidraw', 'mdn', 'learn'].includes(activityView) && (
              <>
                <ResizablePanel defaultSize={20} minSize={14} maxSize={40}>
                  <div className="flex flex-col h-full border-r border-editor-border bg-editor-sidebar">
                    {/* Sidebar title */}
                    <div
                      className="px-4 py-2 flex-shrink-0 border-b border-editor-border"
                      style={{ height: 36 }}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-editor-text-muted">
                        {activityView === 'explorer' ? 'Explorer'
                        : activityView === 'search'   ? 'Search'
                        : activityView === 'projects' ? 'Projects'
                        : activityView === 'docs'      ? 'Documentation'
                        : 'Settings'}
                      </p>
                    </div>
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
                            setActiveTabId(null);
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
                          <IframePanel title="MDN Web Docs" url="https://corsproxy.io/?url=https%3A%2F%2Fdeveloper.mozilla.org%2Fen-US%2Fdocs%2FWeb" icon={<BookOpen className="w-5 h-5" />} />
                        ) : (
                          <IframePanel title="Learn Web Dev" url="https://corsproxy.io/?url=https%3A%2F%2Fweb.dev%2Flearn" icon={<GraduationCap className="w-5 h-5" />} />
                        )
                      ) : (
                        <CodeEditor
                          key={activeFile.id}
                          value={activeFile.content ?? ''}
                          onChange={handleContentChange}
                          language={activeFile.language || getLanguageFromFilename(activeFile.name)}
                          fileName={activeFile.name}
                          settings={settings}
                          onRun={runActiveFile}
                          onCursorChange={(line, column) => setCursorPos({ line, column })}
                          onSelectionChange={(text, pos) => setSelection({ text, pos })}
                          onErrors={handleEditorErrors}
                          onEditorReady={api => { editorRef.current = api; }}
                        />
                      )}
                      <SmartPopup 
                        position={selection.pos}
                        text={selection.text}
                        onAction={(action) => {
                          const message = `Please ${action} this code:\n\`\`\`\n${selection.text}\n\`\`\``;
                          window.open(`https://chatgpt.com/?q=${encodeURIComponent(message)}`, '_blank');
                        }}
                      />
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
                    {/* Right panel tabs */}
                    <div
                      className="flex items-center justify-between flex-shrink-0"
                      style={{
                        height: 36,
                        background: 'hsl(var(--mantle))',
                        borderBottom: '1px solid hsl(var(--surface1))',
                      }}
                    >
                      <div className="flex items-center">
                        <button
                          className={`panel-tab ${rightPanel === 'preview' ? 'active' : ''}`}
                          onClick={() => setRightPanel('preview')}
                        >
                          <Monitor className="w-3.5 h-3.5" />
                          Preview
                        </button>
                        <button
                          className={`panel-tab ${rightPanel === 'docs' ? 'active' : ''}`}
                          onClick={() => setRightPanel('docs')}
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          Docs
                        </button>
                        <button
                          className={`panel-tab ${rightPanel === 'assets' ? 'active' : ''}`}
                          onClick={() => setRightPanel('assets')}
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          Assets
                        </button>
                      </div>
                      <button
                        onClick={() => setRightPanel(null)}
                        className="px-2 text-editor-text-dim hover:text-editor-text transition-fast"
                        title="Close panel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex-1 min-h-0">
                      {rightPanel === 'preview' ? (
                        <LivePreview
                          htmlContent={previewContent.html}
                          cssContent={previewContent.css}
                          jsContent={previewContent.js}
                          activeFileName={activeFile?.name}
                          serverUrl={serverUrl}
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

        {bottomPanelOpen && (
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
              <button
                onClick={() => setBottomPanelOpen(false)}
                className="px-2 text-editor-text-dim hover:text-editor-text transition-fast"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Panel content */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              {bottomTab === 'terminal' && (
                <>
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
                          ref={el => terminalRefs.current[term.id] = el}
                          getFileSystem={() => workspace.files}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}
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
                  <div className="max-w-3xl mx-auto space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-emerald-400 mb-2 border-b border-editor-border pb-2">Available Commands</h3>
                      <p className="text-sm text-editor-text-muted mb-4">You can type these commands directly into the terminal or use the quick-action buttons above.</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-editor-panel border border-editor-border p-4 rounded-lg">
                          <code className="text-blue-400 font-mono text-sm font-semibold bg-blue-500/10 px-2 py-1 rounded">npm run dev</code>
                          <p className="text-sm text-editor-text-muted mt-2">Starts the Vite development server with Hot Module Replacement (HMR). Code changes will automatically reload the preview.</p>
                        </div>
                        <div className="bg-editor-panel border border-editor-border p-4 rounded-lg">
                          <code className="text-blue-400 font-mono text-sm font-semibold bg-blue-500/10 px-2 py-1 rounded">npm run build</code>
                          <p className="text-sm text-editor-text-muted mt-2">Creates an optimized production build of your application in the <code className="text-emerald-400">dist</code> folder.</p>
                        </div>
                        <div className="bg-editor-panel border border-editor-border p-4 rounded-lg">
                          <code className="text-blue-400 font-mono text-sm font-semibold bg-blue-500/10 px-2 py-1 rounded">npm install</code>
                          <p className="text-sm text-editor-text-muted mt-2">Installs all dependencies listed in your <code className="text-emerald-400">package.json</code>.</p>
                        </div>
                        <div className="bg-editor-panel border border-editor-border p-4 rounded-lg">
                          <code className="text-blue-400 font-mono text-sm font-semibold bg-blue-500/10 px-2 py-1 rounded">help</code>
                          <p className="text-sm text-editor-text-muted mt-2">Displays this help documentation panel.</p>
                        </div>
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
      <StatusBar
        activeFile={activeFile}
        cursorPosition={cursorPos}
        totalLines={activeFile?.content?.split('\n').length ?? 0}
        errors={errorCount}
        warnings={warningCount}
        onShowProblems={() => { setBottomPanelOpen(true); setBottomTab('problems'); }}
      />
    </div>
  );
};
