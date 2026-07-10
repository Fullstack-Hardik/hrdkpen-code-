import { Sparkles, FileCode2, Wrench } from 'lucide-react';

interface SmartPopupProps {
  position: { top: number; left: number; height: number } | null;
  text: string;
  onAction: (action: 'explain' | 'fix' | 'optimize') => void;
}

export const SmartPopup = ({ position, text, onAction }: SmartPopupProps) => {
  if (!position || !text) return null;

  return (
    <div
      className="absolute z-50 flex items-center gap-1 p-1 rounded-md shadow-xl border border-editor-border bg-editor-panel animate-fade-in"
      style={{
        top: position.top - 40,
        left: position.left,
      }}
    >
      <button
        onClick={() => onAction('explain')}
        className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded hover:bg-editor-active-tab text-editor-text transition-fast"
      >
        <Sparkles className="w-3.5 h-3.5 text-lavender-400" style={{ color: 'hsl(var(--lavender))' }} />
        Explain
      </button>
      <div className="w-px h-4 bg-editor-border mx-1" />
      <button
        onClick={() => onAction('fix')}
        className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded hover:bg-editor-active-tab text-editor-text transition-fast"
      >
        <Wrench className="w-3.5 h-3.5" style={{ color: 'hsl(var(--peach))' }} />
        Fix
      </button>
      <div className="w-px h-4 bg-editor-border mx-1" />
      <button
        onClick={() => onAction('optimize')}
        className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded hover:bg-editor-active-tab text-editor-text transition-fast"
      >
        <FileCode2 className="w-3.5 h-3.5" style={{ color: 'hsl(var(--green))' }} />
        Optimize
      </button>
    </div>
  );
};
