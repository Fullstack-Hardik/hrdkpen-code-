import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Play,
  Download,
  Code2,
  Globe,
  AlignLeft,
  TerminalSquare,
  PanelRightClose,
  PanelRightOpen,
  ChevronDown,
  FolderOpen,
  FileArchive,
  Upload,
  Rocket,
  Settings2,
  Eye,
  Monitor,
  Cpu,
  Package,
  Save,
  RefreshCw,
  Share2,
  Maximize,
  Minimize,
  EyeOff,
  HelpCircle,
  Keyboard,
  Info,
} from 'lucide-react';
import { LANGUAGE_LABELS, getLanguageFromFilename } from '@/lib/languages';
import type { FileNode } from '@/types';
import { ProductivityTools } from '../layout/ProductivityTools';

interface SystemHeaderProps {
  activeFile?: FileNode | null;
  projectName?: string;
  projectLanguage?: string;
  onRun: () => void;
  onFormat: () => void;
  onExport: () => void;
  onPublish: () => void;
  onDownloadCurrent: () => void;
  terminalOpen?: boolean;
  onToggleTerminal?: () => void;
  rightPanelOpen?: boolean;
  onToggleRightPanel?: () => void;
  onNewProject?: () => void;
  onOpenProjects?: () => void;
  onTogglePreview?: () => void;
  serverUrl?: string | null;
  onToggleFullscreen?: () => void;
  onToggleZenMode?: () => void;
  isFullscreen?: boolean;
  isZenMode?: boolean;
}

const PUBLISHABLE_PROJECT_TYPES = new Set(['html', 'plaintext', '']);

export const SystemHeader = ({
  activeFile,
  projectName,
  projectLanguage,
  onRun,
  onFormat,
  onExport,
  onPublish,
  onDownloadCurrent,
  terminalOpen,
  onToggleTerminal,
  rightPanelOpen,
  onToggleRightPanel,
  onNewProject,
  onOpenProjects,
  onTogglePreview,
  serverUrl,
  onToggleFullscreen,
  onToggleZenMode,
  isFullscreen,
  isZenMode,
}: SystemHeaderProps) => {
  const lang = activeFile?.language || (activeFile ? getLanguageFromFilename(activeFile.name) : '');
  const langLabel = LANGUAGE_LABELS[lang] ?? '';
  const canRun = ['javascript', 'typescript', 'python', 'c', 'cpp'].includes(lang);

  const projLang = projectLanguage || '';
  const canPublish = PUBLISHABLE_PROJECT_TYPES.has(projLang) || projLang === 'html';

  return (
    <header
      className="flex items-center justify-between flex-shrink-0 no-select relative z-10"
      style={{
        height: 44,
        background: 'hsl(var(--crust))',
        borderBottom: '1px solid hsl(var(--surface1))',
      }}
    >
      {/* ── LEFT: Brand + macOS dots + Menus ── */}
      <div className="flex items-center gap-0 h-full">
        <div className="flex items-center gap-1.5 px-4 py-2 border-r h-full border-editor-border">
          <div className="mac-btn mac-btn-close" />
          <div className="mac-btn mac-btn-min" />
          <div className="mac-btn mac-btn-max" />
        </div>

        <div className="flex items-center gap-2 px-4 h-full border-r border-editor-border">
          <div className="flex items-center gap-1.5 rounded-md px-2 py-1 bg-blue-500/10">
            <Code2 className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[13px] font-bold tracking-tight text-editor-text">
              HRDK<span className="text-blue-500">Pen</span>
            </span>
          </div>
        </div>

        {/* Workspace Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 px-3 h-full text-xs hover:bg-editor-active-tab transition-fast text-editor-text-muted">
              Workspace
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52 bg-editor-panel border-editor-border text-editor-text animate-scale-in">
            {onNewProject && (
              <DropdownMenuItem onClick={onNewProject} className="text-xs gap-2 cursor-pointer hover:bg-editor-active-tab">
                <FolderOpen className="w-3.5 h-3.5" /> New Project
              </DropdownMenuItem>
            )}
            {onOpenProjects && (
              <DropdownMenuItem onClick={onOpenProjects} className="text-xs gap-2 cursor-pointer hover:bg-editor-active-tab">
                <Package className="w-3.5 h-3.5" /> All Projects
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator className="bg-editor-border" />
            <DropdownMenuItem onClick={onExport} className="text-xs gap-2 cursor-pointer hover:bg-editor-active-tab">
              <FileArchive className="w-3.5 h-3.5" /> Export as ZIP
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Edit Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 px-3 h-full text-xs hover:bg-editor-active-tab transition-fast text-editor-text-muted">
              Edit
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52 bg-editor-panel border-editor-border text-editor-text animate-scale-in">
            <DropdownMenuItem onClick={onFormat} className="text-xs gap-2 cursor-pointer hover:bg-editor-active-tab">
              <AlignLeft className="w-3.5 h-3.5" /> Format Document
              <kbd className="ml-auto text-[9px] opacity-40">Alt+Shift+F</kbd>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* View Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 px-3 h-full text-xs hover:bg-editor-active-tab transition-fast text-editor-text-muted">
              View
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52 bg-editor-panel border-editor-border text-editor-text animate-scale-in">
            {onToggleTerminal && (
              <DropdownMenuItem onClick={onToggleTerminal} className="text-xs gap-2 cursor-pointer hover:bg-editor-active-tab">
                <TerminalSquare className="w-3.5 h-3.5" /> {terminalOpen ? 'Hide Terminal' : 'Show Terminal'}
              </DropdownMenuItem>
            )}
            {onTogglePreview && (
              <DropdownMenuItem onClick={onTogglePreview} className="text-xs gap-2 cursor-pointer hover:bg-editor-active-tab">
                <Monitor className="w-3.5 h-3.5" /> {rightPanelOpen ? 'Hide Preview' : 'Show Preview'}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator className="bg-editor-border" />
            {onToggleFullscreen && (
              <DropdownMenuItem onClick={onToggleFullscreen} className="text-xs gap-2 cursor-pointer hover:bg-editor-active-tab">
                {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
                {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                <kbd className="ml-auto text-[9px] opacity-40">F11</kbd>
              </DropdownMenuItem>
            )}
            {onToggleZenMode && (
              <DropdownMenuItem onClick={onToggleZenMode} className="text-xs gap-2 cursor-pointer hover:bg-editor-active-tab">
                <EyeOff className="w-3.5 h-3.5" /> {isZenMode ? 'Exit Zen Mode' : 'Zen Mode'}
                <kbd className="ml-auto text-[9px] opacity-40">Ctrl+K Z</kbd>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Run Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 px-3 h-full text-xs hover:bg-editor-active-tab transition-fast text-editor-text-muted">
              Run
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52 bg-editor-panel border-editor-border text-editor-text animate-scale-in">
            {canRun && (
              <DropdownMenuItem onClick={onRun} className="text-xs gap-2 cursor-pointer hover:bg-editor-active-tab">
                <Play className="w-3.5 h-3.5 text-green-400" /> Run Active File
                <kbd className="ml-auto text-[9px] opacity-40">Ctrl+Enter</kbd>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="text-xs gap-2 cursor-pointer hover:bg-editor-active-tab">
              <RefreshCw className="w-3.5 h-3.5" /> Restart Dev Server
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Help Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 px-3 h-full text-xs hover:bg-editor-active-tab transition-fast text-editor-text-muted">
              Help
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52 bg-editor-panel border-editor-border text-editor-text animate-scale-in">
            <DropdownMenuItem className="text-xs gap-2 cursor-pointer hover:bg-editor-active-tab">
              <HelpCircle className="w-3.5 h-3.5" /> Documentation
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs gap-2 cursor-pointer hover:bg-editor-active-tab">
              <Keyboard className="w-3.5 h-3.5" /> Keyboard Shortcuts
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-editor-border" />
            <DropdownMenuItem className="text-xs gap-2 cursor-pointer hover:bg-editor-active-tab">
              <Info className="w-3.5 h-3.5" /> About HRDK Pen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── CENTER: Project name ── */}
      <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
        {projectName && (
          <span className="text-xs font-medium truncate max-w-[200px] text-editor-text-muted" title={projectName}>
            {projectName}
          </span>
        )}
      </div>

      {/* ── RIGHT: Productivity + Publish + Panels ── */}
      <div className="flex items-center gap-3 px-3 h-full border-l border-editor-border">
        
        <ProductivityTools />

        <div className="w-px h-4 bg-editor-border" />

        {serverUrl && (
          <a
            href={serverUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] hover:bg-editor-active-tab transition-fast text-green-400"
            title={`Server running: ${serverUrl}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            Live
          </a>
        )}

        {canPublish && (
          <button
            onClick={onPublish}
            className="flex items-center gap-1.5 h-7 px-3 rounded-md text-[12px] font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            title="Publish to the web"
          >
            <Rocket className="w-3 h-3" />
            <span className="hidden sm:inline">Publish</span>
          </button>
        )}

        {onToggleTerminal && (
          <Button
            variant="ghost" size="sm"
            onClick={onToggleTerminal}
            className={`h-7 w-7 p-0 rounded-md transition-fast ${terminalOpen ? 'bg-editor-active-tab text-editor-text' : 'text-editor-text-muted hover:text-editor-text hover:bg-editor-active-tab'}`}
            title="Toggle Terminal (Ctrl+`)"
          >
            <TerminalSquare className="w-3.5 h-3.5" />
          </Button>
        )}

        {onToggleRightPanel && (
          <Button
            variant="ghost" size="sm"
            onClick={onToggleRightPanel}
            className={`h-7 w-7 p-0 rounded-md transition-fast ${rightPanelOpen ? 'bg-editor-active-tab text-editor-text' : 'text-editor-text-muted hover:text-editor-text hover:bg-editor-active-tab'}`}
            title="Toggle Preview Panel"
          >
            {rightPanelOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
          </Button>
        )}
      </div>
    </header>
  );
};