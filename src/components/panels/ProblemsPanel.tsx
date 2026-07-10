import { AlertCircle, AlertTriangle, X } from 'lucide-react';
import { getFileLanguageIcon } from '@/utils/languageIcons';
import type { FileNode } from '@/types';

export interface Problem {
  fileId: string;
  fileName: string;
  line: number;
  column: number;
  severity: 'error' | 'warning';
  message: string;
}

interface ProblemsPanelProps {
  problems: Problem[];
  onJumpTo: (fileId: string, line: number, column: number) => void;
}

export const ProblemsPanel = ({ problems, onJumpTo }: ProblemsPanelProps) => {
  const errors   = problems.filter(p => p.severity === 'error');
  const warnings = problems.filter(p => p.severity === 'warning');

  if (problems.length === 0) {
    return (
      <div className="flex items-center justify-center h-full gap-2 text-editor-text-muted text-xs">
        <AlertCircle className="w-4 h-4 text-editor-success" />
        No problems detected
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto font-code text-xs">
      {problems.map((p, i) => (
        <button
          key={i}
          onClick={() => onJumpTo(p.fileId, p.line, p.column)}
          className="flex items-start gap-2 px-3 py-1.5 text-left hover:bg-editor-active-tab transition-fast border-b border-editor-border/50 group w-full"
        >
          {p.severity === 'error'
            ? <AlertCircle className="w-3.5 h-3.5 text-editor-error flex-shrink-0 mt-0.5" />
            : <AlertTriangle className="w-3.5 h-3.5 text-editor-warning flex-shrink-0 mt-0.5" />
          }
          <div className="min-w-0 flex-1">
            <span className="text-editor-text">{p.message}</span>
            <span className="text-editor-text-dim ml-2">
              {p.fileName}:{p.line}:{p.column}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
};
