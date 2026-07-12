import type { ReactNode } from 'react';
import {
  Settings2,
  Files,
  TerminalSquare,
  BookOpen,
  Image as ImageIcon,
  FolderTree,
  PenTool,
  GraduationCap,
  Search,
  HelpCircle,
} from 'lucide-react';

export type ActivityBarView =
  | 'explorer'
  | 'search'
  | 'projects'
  | 'excalidraw'
  | 'mdn'
  | 'learn'
  | 'settings'
  | 'docs'
  | 'help';

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
    { id: 'explorer',   icon: <Files className="w-5 h-5" />,          label: 'Explorer',    position: 'top' },
    { id: 'search',     icon: <Search className="w-5 h-5" />,          label: 'Search',      position: 'top' },
    { id: 'projects',   icon: <FolderTree className="w-5 h-5" />,      label: 'Projects',    position: 'top' },
    { id: 'docs',       icon: <BookOpen className="w-5 h-5" />,        label: 'Docs & Help', position: 'top' },
    { id: 'excalidraw', icon: <PenTool className="w-5 h-5" />,         label: 'Whiteboard',  position: 'top' },
    { id: 'mdn',        icon: <GraduationCap className="w-5 h-5" />,   label: 'DevDocs',     position: 'top' },
  ];

  const bottomItems: BarItem[] = [
    { id: 'settings', icon: <Settings2 className="w-5 h-5" />, label: 'Settings', position: 'bottom' },
  ];

  const renderItem = (item: BarItem) => {
    const isActive = active === item.id;
    return (
      <button
        key={item.id}
        title={item.label}
        onClick={() => onChange(item.id)}
        className={`activity-bar-icon group relative ${isActive ? 'active' : ''}`}
        aria-label={item.label}
        aria-pressed={isActive}
      >
        {/* Active indicator bar */}
        {isActive && (
          <span className="activity-bar-indicator animate-fade-in" />
        )}

        {/* Icon with subtle scale on active */}
        <span
          className="relative z-10 transition-transform duration-150"
          style={{ transform: isActive ? 'scale(1.1)' : 'scale(1)' }}
        >
          {item.icon}
        </span>

        {/* Tooltip */}
        <span
          className="absolute left-full ml-3 px-2.5 py-1 text-xs rounded-md whitespace-nowrap pointer-events-none z-50
                     opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-editor-md"
          style={{
            background: 'hsl(var(--crust))',
            color: 'hsl(var(--text))',
            border: '1px solid hsl(var(--surface1))',
          }}
        >
          {item.label}
        </span>
      </button>
    );
  };

  return (
    <div
      className="flex flex-col items-center justify-between flex-shrink-0 border-r border-editor-border bg-activity-bar"
      style={{ width: 48 }}
      role="navigation"
      aria-label="Activity Bar"
    >
      {/* Top icons */}
      <div className="flex flex-col items-center pt-2 gap-0.5">
        {topItems.map(renderItem)}
      </div>

      {/* Bottom icons */}
      <div className="flex flex-col items-center pb-2 gap-0.5">
        {/* Terminal toggle */}
        <button
          title="Terminal (Ctrl+`)"
          onClick={onToggleTerminal}
          className={`activity-bar-icon group relative ${terminalOpen ? 'active text-[hsl(var(--text))]' : ''}`}
          aria-label="Toggle Terminal"
          aria-pressed={terminalOpen}
        >
          {terminalOpen && <span className="activity-bar-indicator" />}
          <TerminalSquare className="w-5 h-5 relative z-10" />
          {errorCount > 0 && (
            <span
              className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white z-20"
              style={{ background: 'hsl(var(--red))' }}
            >
              {errorCount > 9 ? '9+' : errorCount}
            </span>
          )}
          <span
            className="absolute left-full ml-3 px-2.5 py-1 text-xs rounded-md whitespace-nowrap pointer-events-none z-50
                       opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-editor-md"
            style={{
              background: 'hsl(var(--crust))',
              color: 'hsl(var(--text))',
              border: '1px solid hsl(var(--surface1))',
            }}
          >
            Terminal (Ctrl+`)
          </span>
        </button>

        {bottomItems.map(renderItem)}
      </div>
    </div>
  );
};
