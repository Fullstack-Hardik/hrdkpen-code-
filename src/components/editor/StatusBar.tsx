import { AlertCircle, AlertTriangle, GitBranch, Check } from 'lucide-react';
import { LANGUAGE_LABELS } from '@/lib/languages';
import type { FileNode } from '@/types';

interface StatusBarProps {
  activeFile?: FileNode | null;
  cursorPosition?: { line: number; column: number };
  totalLines?: number;
  errors?: number;
  warnings?: number;
  onShowProblems?: () => void;
}

export const StatusBar = ({
  activeFile,
  cursorPosition = { line: 1, column: 1 },
  totalLines = 0,
  errors = 0,
  warnings = 0,
  onShowProblems,
}: StatusBarProps) => {
  const language = activeFile?.language ?? '';
  const langLabel = LANGUAGE_LABELS[language] ?? (language || 'Plain Text');

  return (
    <div
      className="h-6 flex items-center justify-between px-3 flex-shrink-0 select-none font-code text-[11px]"
      style={{
        background: 'hsl(var(--crust))',
        borderTop: '1px solid hsl(var(--surface1))',
        color: 'hsl(var(--overlay1))',
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-4">
        {/* Branch indicator */}
        <span className="flex items-center gap-1" style={{ color: 'hsl(var(--overlay1))' }}>
          <GitBranch className="w-3 h-3" />
          main
        </span>

        {/* Error / Warning count */}
        <button
          onClick={onShowProblems}
          className="flex items-center gap-2 hover:text-[hsl(var(--text))] transition-fast"
        >
          <span className={`flex items-center gap-1 ${errors > 0 ? 'text-[hsl(var(--red))]' : 'text-[hsl(var(--overlay0))]'}`}>
            <AlertCircle className="w-3 h-3" />
            {errors}
          </span>
          <span className={`flex items-center gap-1 ${warnings > 0 ? 'text-[hsl(var(--peach))]' : 'text-[hsl(var(--overlay0))]'}`}>
            <AlertTriangle className="w-3 h-3" />
            {warnings}
          </span>
        </button>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        {activeFile && (
          <>
            <span>
              Ln {cursorPosition.line}, Col {cursorPosition.column}
            </span>
            {totalLines > 0 && <span>{totalLines} lines</span>}
            <span>UTF-8</span>
            <span>LF</span>
            <span className="text-[hsl(var(--blue))]">{langLabel}</span>
          </>
        )}
        <span className="flex items-center gap-1 text-[hsl(var(--green))]">
          <Check className="w-3 h-3" />
          Ready
        </span>
      </div>
    </div>
  );
};
