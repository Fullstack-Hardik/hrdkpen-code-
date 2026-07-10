import { useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Play,
  Download,
  Code2,
  ExternalLink,
  AlignLeft,
  Keyboard,
  TerminalSquare,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import { LANGUAGE_LABELS, getLanguageFromFilename } from '@/lib/languages';
import type { FileNode } from '@/types';

interface SystemHeaderProps {
  activeFile?: FileNode | null;
  onRun: () => void;
  onFormat: () => void;
  onExport: () => void;
  onPublish: () => void;
  onDownloadCurrent: () => void;
  terminalOpen?: boolean;
  onToggleTerminal?: () => void;
  rightPanelOpen?: boolean;
  onToggleRightPanel?: () => void;
}

export const SystemHeader = ({
  activeFile,
  onRun,
  onFormat,
  onExport,
  onPublish,
  onDownloadCurrent,
  terminalOpen,
  onToggleTerminal,
  rightPanelOpen,
  onToggleRightPanel,
}: SystemHeaderProps) => {
  const lang = activeFile?.language || (activeFile ? getLanguageFromFilename(activeFile.name) : '');
  const langLabel = LANGUAGE_LABELS[lang] ?? '';
  const canRun = ['javascript', 'typescript', 'python', 'c', 'cpp'].includes(lang);

  return (
    <header
      className="flex items-center justify-between px-3 flex-shrink-0 no-select bg-editor-panel z-10 relative"
      style={{
        height: 40,
        borderBottom: '1px solid hsl(var(--surface1))',
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2">
        <div
          className="flex items-center gap-1.5 rounded-md px-2 py-1"
          style={{ background: 'hsl(var(--blue) / 0.15)' }}
        >
          <Code2 className="w-4 h-4" style={{ color: 'hsl(var(--blue))' }} />
          <span
            className="text-sm font-bold tracking-tight"
            style={{ color: 'hsl(var(--text))' }}
          >
            HRDK<span style={{ color: 'hsl(var(--blue))' }}>Pen</span>
          </span>
        </div>
      </div>

      {/* Center actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost" size="sm"
          onClick={onFormat}
          className="h-7 px-2 gap-1.5 text-xs"
          style={{ color: 'hsl(var(--overlay2))' }}
          title="Format document (Alt+Shift+F)"
        >
          <AlignLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Format</span>
        </Button>

        {onToggleTerminal && (
          <Button
            variant="ghost" size="sm"
            onClick={onToggleTerminal}
            className={`h-7 px-2 gap-1.5 text-xs ${terminalOpen ? 'bg-black/20' : ''}`}
            style={{ color: terminalOpen ? 'hsl(var(--text))' : 'hsl(var(--overlay2))' }}
            title="Toggle Terminal (Ctrl+`)"
          >
            <TerminalSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Terminal</span>
          </Button>
        )}

        <Button
          variant="ghost" size="sm"
          onClick={onDownloadCurrent}
          className="h-7 px-2 gap-1.5 text-xs"
          style={{ color: 'hsl(var(--overlay2))' }}
          title="Download current file"
          disabled={!activeFile}
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Download</span>
        </Button>

        <Button
          variant="ghost" size="sm"
          onClick={onExport}
          className="h-7 px-2 gap-1.5 text-xs"
          style={{ color: 'hsl(var(--overlay2))' }}
          title="Export project as ZIP"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export ZIP</span>
        </Button>

        <Button
          variant="ghost" size="sm"
          onClick={onPublish}
          className="h-7 px-2 gap-1.5 text-xs text-lavender-400 hover:text-lavender-300"
          title="Publish Project Instantly"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline font-medium">Publish</span>
        </Button>

        {canRun && (
          <Button
            size="sm"
            onClick={onRun}
            className="h-7 px-3 gap-1.5 text-xs ml-1 font-medium"
            style={{
              background: 'hsl(var(--green) / 0.2)',
              color: 'hsl(var(--green))',
              border: '1px solid hsl(var(--green) / 0.4)',
            }}
            title="Run code (Ctrl+Enter)"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Run
            {langLabel && <span className="opacity-60 text-[10px]">{langLabel}</span>}
          </Button>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        <kbd
          className="hidden md:flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]"
          style={{
            background: 'hsl(var(--surface0))',
            color: 'hsl(var(--overlay1))',
            border: '1px solid hsl(var(--surface1))',
          }}
          title="Keyboard shortcuts"
        >
          <Keyboard className="w-3 h-3" />
          Ctrl+Enter to run
        </kbd>
        
        {onToggleRightPanel && (
          <Button
            variant="ghost" size="sm"
            onClick={onToggleRightPanel}
            className={`h-7 w-7 p-0 ml-2 transition-fast ${rightPanelOpen ? 'bg-black/20' : ''}`}
            style={{ color: rightPanelOpen ? 'hsl(var(--text))' : 'hsl(var(--overlay2))' }}
            title="Toggle Right Panel"
          >
            {rightPanelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          </Button>
        )}
      </div>
    </header>
  );
};