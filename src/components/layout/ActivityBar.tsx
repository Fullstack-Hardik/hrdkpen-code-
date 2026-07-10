import type { ReactNode } from 'react';
import {
  FolderSearch,
  Settings2,
  Files,
  TerminalSquare,
  BookOpen,
  Image as ImageIcon,
  FolderTree,
  PenTool,
  GraduationCap
} from 'lucide-react';

export type ActivityBarView = 'explorer' | 'search' | 'projects' | 'excalidraw' | 'mdn' | 'learn' | 'settings' | 'docs' | 'assets';

interface ActivityBarProps {
  active: ActivityBarView;
  onChange: (view: ActivityBarView) => void;
  terminalOpen: boolean;
  onToggleTerminal: () => void;
  errorCount: number;
}

interface BarItem {
  id: ActivityBarView;
  icon: ReactNode;
  label: string;
  position: 'top' | 'bottom';
}

export const ActivityBar = ({
  active,
  onChange,
  terminalOpen,
  onToggleTerminal,
  errorCount,
}: ActivityBarProps) => {
  const topItems: BarItem[] = [
    { id: 'explorer',   icon: <Files className="w-5 h-5" />,       label: 'Explorer', position: 'top' },
    { id: 'search',     icon: <FolderSearch className="w-5 h-5" />, label: 'Search',   position: 'top' },
    { id: 'projects',   icon: <FolderTree className="w-5 h-5" />,   label: 'Projects', position: 'top' },
    { id: 'excalidraw', icon: <PenTool className="w-5 h-5" />,      label: 'Whiteboard', position: 'top' },
    { id: 'mdn',        icon: <BookOpen className="w-5 h-5" />,     label: 'MDN Web Docs', position: 'top' },
    { id: 'learn',      icon: <GraduationCap className="w-5 h-5" />, label: 'Learn', position: 'top' },
  ];

  const bottomItems: BarItem[] = [
    { id: 'settings', icon: <Settings2 className="w-5 h-5" />, label: 'Settings', position: 'bottom' },
  ];

  const renderItem = (item: BarItem) => (
    <button
      key={item.id}
      title={item.label}
      onClick={() => onChange(active === item.id ? active : item.id)}
      className={`activity-bar-icon group relative ${active === item.id ? 'active' : ''}`}
    >
      {item.icon}
      {active === item.id && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[hsl(var(--blue))] rounded-r" />
      )}
      {/* Tooltip */}
      <span className="absolute left-full ml-3 px-2 py-1 text-xs bg-[hsl(var(--crust))] text-[hsl(var(--text))] rounded border border-[hsl(var(--surface1))] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity">
        {item.label}
      </span>
    </button>
  );

  return (
    <div
      className="flex flex-col items-center justify-between flex-shrink-0 border-r border-editor-border bg-activity-bar"
      style={{ width: 48 }}
    >
      {/* Top icons */}
      <div className="flex flex-col items-center pt-2">
        {topItems.map(renderItem)}
      </div>

      {/* Bottom icons */}
      <div className="flex flex-col items-center pb-2 gap-1">
        {/* Terminal toggle */}
        <button
          title="Terminal (Ctrl+`)"
          onClick={onToggleTerminal}
          className={`activity-bar-icon group relative ${terminalOpen ? 'text-[hsl(var(--text))]' : ''}`}
        >
          <TerminalSquare className="w-5 h-5" />
          {errorCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-[hsl(var(--red))] text-white text-[9px] rounded-full flex items-center justify-center font-bold leading-none">
              {errorCount > 9 ? '9+' : errorCount}
            </span>
          )}
          <span className="absolute left-full ml-3 px-2 py-1 text-xs bg-[hsl(var(--crust))] text-[hsl(var(--text))] rounded border border-[hsl(var(--surface1))] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity">
            Terminal (Ctrl+`)
          </span>
        </button>

        {bottomItems.map(renderItem)}
      </div>
    </div>
  );
};
