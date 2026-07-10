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
import { X, Monitor, Bot, Search, Minus, Square, BookOpen, Plus, Image as ImageIcon } from 'lucide-react';

import { SystemHeader } from './SystemHeader';
import { FileExplorer } from './FileExplorer';
import { CodeEditor } from './CodeEditor';
import { LivePreview } from './LivePreview';
import { Terminal, type TerminalHandle } from './Terminal';
import { PublishModal } from '@/components/publish/PublishModal';
import { StatusBar } from './StatusBar';
import { ActivityBar, type ActivityBarView } from '@/components/layout/ActivityBar';
import { AIAssistant } from '@/components/ai/AIAssistant';
import { SmartPopup } from '@/components/ai/SmartPopup';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { ProblemsPanel, type Problem } from '@/components/panels/ProblemsPanel';
import { OutputPanel, type OutputLine, makeOutputLine } from '@/components/panels/OutputPanel';
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
  const [hasBootstrapped, setHasBootstrapped] = useState(false);
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
              tree[n.name] = { file: { contents: n.content ?? '' } };
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
  }, [workspace.files]);

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
  }, [activeTabId, workspace]);

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
  const previewContent = {
    html: openTabs.find(t => t.language === 'html')?.content ?? '',
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
    if (activityView === 'ai') {
      return (
        <AIAssistant
          activeFile={activeFile ? { name: activeFile.name, content: activeFile.content ?? '' } : null}
          onCodeInsert={code => { if (activeFile) handleContentChange(code); }}
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
        // Force the right panel to show preview
        setRightPanel('preview');
        setRightPanelOpen(true);
      });
    });
    return () => { unmounted = true; };
  }, []);

  useEffect(() => {
    if (workspace.isReady && workspace.files.length > 0) {
      setHasBootstrapped(true);
    }
  }, [workspace.isReady, workspace.files.length]);

  if (!workspace.isReady) {
    return (
      <div className="flex flex-col items-center justify-center w-screen h-screen bg-[#1e1e2e] text-[#cdd6f4]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
        <p>Loading Workspace...</p>
      </div>
    );
  }

  if (!hasBootstrapped && workspace.files.length === 0) {
    return (
      <BootstrapScreen 
        onLoadTemplate={async (type) => {
          setHasBootstrapped(true);
          const folderName = await workspace.loadTemplate(type);
          
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
          setHasBootstrapped(true);
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
      />

      {/* Body */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Activity bar */}
        <ActivityBar
          active={activityView}
          onChange={setActivityView}
          terminalOpen={bottomPanelOpen}
          onToggleTerminal={() => setBottomPanelOpen(v => !v)}
          errorCount={errorCount}
        />

        {/* Main layout */}
        <div className="flex flex-col flex-1 overflow-hidden min-h-0">
          <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
            {/* Sidebar */}
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
                    : activityView === 'ai'        ? 'AI Assistant'
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

            {/* Editor + Right panel */}
            <ResizablePanel defaultSize={rightPanel ? 55 : 80}>
              <div className="flex flex-col h-full">
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
                      <CodeEditor
                        key={activeFile.id}
                        value={activeFile.content ?? ''}
                        onChange={handleContentChange}
                        language={activeFile.language ?? 'plaintext'}
                        fileName={activeFile.name}
                        settings={settings}
                        onRun={runActiveFile}
                        onCursorChange={(line, column) => setCursorPos({ line, column })}
                        onSelectionChange={(text, pos) => setSelection({ text, pos })}
                        onErrors={handleEditorErrors}
                        onEditorReady={api => { editorRef.current = api; }}
                      />
                      <SmartPopup 
                        position={selection.pos}
                        text={selection.text}
                        onAction={(action) => {
                          setRightPanel('ai');
                          const message = `Please ${action} this code:\n\`\`\`\n${selection.text}\n\`\`\``;
                          window.dispatchEvent(new CustomEvent('ai-chat', { detail: message }));
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
                          className={`panel-tab ${rightPanel === 'ai' ? 'active' : ''}`}
                          onClick={() => setRightPanel('ai')}
                        >
                          <Bot className="w-3.5 h-3.5" />
                          AI
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
                          onConsoleMessage={(type, args) => {
                            addOutput(type as OutputLine['type'], args.join(' '));
                          }}
                        />
                      ) : rightPanel === 'ai' ? (
                        <AIAssistant
                          activeFile={activeFile ? { name: activeFile.name, content: activeFile.content ?? '' } : null}
                          onCodeInsert={code => { if (activeFile) handleContentChange(code); }}
                        />
                      ) : rightPanel === 'assets' ? (
                        <AssetLibrary />
                      ) : null}
                    </div>
                  </div>
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>

          {/* Bottom panels (Terminal / Output / Problems) */}
          <div
            className="flex-shrink-0 border-t border-editor-border overflow-hidden transition-all duration-200"
            style={{ height: bottomPanelOpen ? 260 : 0 }}
          >
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
                {(['terminal', 'output', 'problems', 'inspect'] as BottomPanel[]).map(tab => (
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
            <div className="h-[228px] flex flex-col">
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
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-editor-bg">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
                    <Bug className="w-6 h-6" />
                  </div>
                  <h3 className="text-editor-text font-medium mb-2">Web Inspector</h3>
                  <p className="text-editor-text-muted text-sm max-w-md mb-4">
                    Browser security prevents embedding full Developer Tools directly inside this panel for WebContainers. 
                  </p>
                  <button
                    onClick={() => {
                      if (serverUrl) {
                        window.open(serverUrl, '_blank');
                      } else {
                        alert('Please use the "Open in new tab" button in the Preview panel to inspect static projects.');
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm transition-colors"
                  >
                    Open Project in New Tab (Press F12 to Inspect)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Floating right panel buttons (when right panel hidden) */}
        {!rightPanel && (
          <div className="absolute right-3 top-12 flex flex-col gap-1 z-40">
            <button
              onClick={() => setRightPanel('preview')}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-fast"
              style={{
                background: 'hsl(var(--surface0))',
                border: '1px solid hsl(var(--surface1))',
                color: 'hsl(var(--overlay2))',
              }}
              title="Show preview"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setRightPanel('ai')}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-fast"
              style={{
                background: 'hsl(var(--lavender) / 0.2)',
                border: '1px solid hsl(var(--lavender) / 0.4)',
                color: 'hsl(var(--lavender))',
              }}
              title="Show AI Assistant"
            >
              <Bot className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
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
