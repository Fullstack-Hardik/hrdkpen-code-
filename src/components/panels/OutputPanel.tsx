import { useRef, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface OutputLine {
  id: string;
  type: 'log' | 'warn' | 'error' | 'info' | 'system' | 'alert';
  content: string;
  timestamp: number;
}

interface OutputPanelProps {
  lines: OutputLine[];
  onClear: () => void;
}

const LINE_COLORS: Record<OutputLine['type'], string> = {
  log:    'text-editor-text',
  info:   'text-[hsl(var(--sky))]',
  warn:   'text-editor-warning',
  error:  'text-editor-error',
  system: 'text-editor-text-dim',
  alert:  'text-[hsl(var(--mauve))]',
};

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function makeOutputLine(type: OutputLine['type'], content: string): OutputLine {
  return { id: genId(), type, content, timestamp: Date.now() };
}

export const OutputPanel = ({ lines, onClear }: OutputPanelProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1 border-b border-editor-border bg-editor-sidebar flex-shrink-0">
        <span className="text-xs text-editor-text-muted font-medium">Output</span>
        <Button
          variant="ghost" size="sm"
          onClick={onClear}
          className="h-6 w-6 p-0 text-editor-text-dim hover:text-editor-text"
          title="Clear output"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      {/* Lines */}
      <div className="flex-1 overflow-y-auto p-3 font-code text-xs space-y-0.5 allow-select">
        {lines.length === 0 ? (
          <p className="text-editor-text-dim italic">No output yet. Run your code with Ctrl+Enter.</p>
        ) : (
          lines.map(line => (
            <div key={line.id} className={`whitespace-pre-wrap break-all leading-relaxed ${LINE_COLORS[line.type]}`}>
              {line.type === 'error'  && <span className="text-editor-error mr-1">✖</span>}
              {line.type === 'warn'   && <span className="text-editor-warning mr-1">⚠</span>}
              {line.type === 'alert'  && <span className="text-[hsl(var(--mauve))] mr-1">◆</span>}
              {line.type === 'system' && <span className="text-editor-text-dim mr-1">›</span>}
              {line.content}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
