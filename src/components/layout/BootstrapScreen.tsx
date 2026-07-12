import { useState } from 'react';
import {
  FolderPlus, Terminal, Code2, Coffee, Clock, Trash2,
  ExternalLink, Star, Search, Zap, Globe, Cpu, Box,
} from 'lucide-react';
import type { TEMPLATES } from '@/lib/templates';
import type { ProjectMeta } from '@/hooks/use-workspace';

interface BootstrapScreenProps {
  projects?: ProjectMeta[];
  onOpenProject?: (id: string) => void;
  onDeleteProject?: (id: string) => void;
  onLoadTemplate: (type: keyof typeof TEMPLATES | 'empty') => void;
  onImportFolder: () => void;
}

interface TemplateCard {
  type: keyof typeof TEMPLATES | 'empty' | 'import';
  label: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  badge?: string;
  stagger: string;
}

const TEMPLATE_CARDS: TemplateCard[] = [
  {
    type: 'react',
    label: 'React + Vite',
    description: 'Modern component-based frontend with HMR and TypeScript.',
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7 text-cyan-400" fill="none">
        <circle cx="12" cy="12" r="2.5" fill="currentColor" />
        <ellipse cx="12" cy="12" rx="11" ry="4.5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
        <ellipse cx="12" cy="12" rx="11" ry="4.5" stroke="currentColor" strokeWidth="1.2" fill="none" transform="rotate(60 12 12)"/>
        <ellipse cx="12" cy="12" rx="11" ry="4.5" stroke="currentColor" strokeWidth="1.2" fill="none" transform="rotate(120 12 12)"/>
      </svg>
    ),
    gradient: 'from-cyan-500/15 via-transparent to-transparent',
    badge: 'Popular',
    stagger: 'stagger-1',
  },
  {
    type: 'html',
    label: 'HTML / CSS / JS',
    description: 'Standard static web project with live preview.',
    icon: <Globe className="w-7 h-7 text-orange-400" />,
    gradient: 'from-orange-500/15 via-transparent to-transparent',
    badge: 'Starter',
    stagger: 'stagger-2',
  },
  {
    type: 'node',
    label: 'Node.js',
    description: 'Server-side JavaScript with Node.js runtime.',
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7 text-green-400" fill="currentColor">
        <path d="M12 1.85l-9 5.19v10.57l9 5.19 9-5.19V7.04L12 1.85zm0 2.3l6.5 3.75-6.5 3.76L5.5 7.9 12 4.15zM4.5 9.25l7 4.04v7.51l-7-4.04V9.25zm8.5 11.55v-7.51l7-4.04v7.51l-7 4.04z"/>
      </svg>
    ),
    gradient: 'from-green-500/15 via-transparent to-transparent',
    stagger: 'stagger-3',
  },
  {
    type: 'express',
    label: 'Express API',
    description: 'REST API server with Express.js framework.',
    icon: <Zap className="w-7 h-7 text-yellow-400" />,
    gradient: 'from-yellow-500/15 via-transparent to-transparent',
    stagger: 'stagger-4',
  },
  {
    type: 'python' as keyof typeof TEMPLATES,
    label: 'Python',
    description: 'Python scripting environment with Pyodide.',
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
        <path d="M12 2C8.5 2 8 3.5 8 5v2h4v1H6C4.3 8 3 9.3 3 11v3c0 1.7 1.3 3 3 3h1.5v-2C7.5 13.3 8.8 12 10.5 12H14c1.7 0 3-1.3 3-3V6c0-1.7-1.3-3-3-3h-2z" fill="#3776AB" opacity="0.9"/>
        <path d="M12 22c3.5 0 4-1.5 4-3v-2h-4v-1h6c1.7 0 3-1.3 3-3v-3c0-1.7-1.3-3-3-3h-1.5v2c0 1.7-1.3 3-3 3h-3.5c-1.7 0-3 1.3-3 3v3c0 1.7 1.3 3 3 3h2z" fill="#FFD43B" opacity="0.9"/>
      </svg>
    ),
    gradient: 'from-blue-500/15 via-transparent to-transparent',
    stagger: 'stagger-5',
  },
  {
    type: 'c' as keyof typeof TEMPLATES,
    label: 'C / C++',
    description: 'Compile and run native C/C++ via Piston API.',
    icon: <Cpu className="w-7 h-7 text-purple-400" />,
    gradient: 'from-purple-500/15 via-transparent to-transparent',
    stagger: 'stagger-6',
  },
  {
    type: 'import',
    label: 'Import Folder',
    description: 'Load an existing project from your computer.',
    icon: <FolderPlus className="w-7 h-7 text-editor-text-muted" />,
    gradient: 'from-white/5 via-transparent to-transparent',
    stagger: 'stagger-1',
  },
  {
    type: 'empty',
    label: 'Empty Project',
    description: 'Start from scratch with no files.',
    icon: <Box className="w-7 h-7 text-editor-text-muted" />,
    gradient: 'from-white/5 via-transparent to-transparent',
    stagger: 'stagger-2',
  },
];

export const BootstrapScreen = ({
  projects = [],
  onOpenProject,
  onDeleteProject,
  onLoadTemplate,
  onImportFolder,
}: BootstrapScreenProps) => {
  const [search, setSearch] = useState('');
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);

  const sortedProjects = [...projects]
    .sort((a, b) => b.lastOpened - a.lastOpened)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  const handleTemplate = (type: TemplateCard['type']) => {
    if (type === 'import') {
      onImportFolder();
    } else {
      onLoadTemplate(type as any);
    }
  };

  return (
    <div
      className="flex flex-col items-center w-full h-full overflow-y-auto custom-scrollbar relative"
      style={{ background: 'hsl(var(--editor-bg))' }}
    >
      {/* Ambient background gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% -20%, hsl(var(--blue) / 0.08) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 w-full max-w-4xl px-6 py-12 space-y-12">
        {/* Hero */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{
                background: 'hsl(var(--blue) / 0.1)',
                border: '1px solid hsl(var(--blue) / 0.2)',
              }}
            >
              <Code2 className="w-5 h-5" style={{ color: 'hsl(var(--blue))' }} />
              <span className="text-xl font-bold tracking-tight" style={{ color: 'hsl(var(--text))' }}>
                HRDK<span style={{ color: 'hsl(var(--blue))' }}>Pen</span>
              </span>
            </div>
          </div>
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--text)) 0%, hsl(var(--overlay2)) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Your Professional Browser IDE
          </h1>
          <p className="text-sm max-w-md mx-auto leading-relaxed" style={{ color: 'hsl(var(--overlay1))' }}>
            A persistent, full-featured coding environment — no installation required. Pick a template or open a recent project.
          </p>
        </div>

        {/* Recent Projects */}
        {projects.length > 0 && (
          <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'hsl(var(--text))' }}>
                <Clock className="w-4 h-4" style={{ color: 'hsl(var(--blue))' }} />
                Recent Projects
              </h2>
              {projects.length > 3 && (
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-editor-text-dim" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Filter..."
                    className="h-6 pl-6 pr-3 text-xs bg-editor-active-tab border border-editor-border rounded-md text-editor-text outline-none"
                    style={{ width: 140 }}
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {sortedProjects.map((proj, i) => (
                <div
                  key={proj.id}
                  className="relative group rounded-xl border cursor-pointer transition-all duration-200 overflow-hidden"
                  style={{
                    background: hoveredProject === proj.id
                      ? 'hsl(var(--surface0))'
                      : 'hsl(var(--mantle))',
                    borderColor: hoveredProject === proj.id
                      ? 'hsl(var(--blue) / 0.4)'
                      : 'hsl(var(--surface1))',
                    animationDelay: `${i * 0.05}s`,
                  }}
                  onMouseEnter={() => setHoveredProject(proj.id)}
                  onMouseLeave={() => setHoveredProject(null)}
                  onClick={() => onOpenProject?.(proj.id)}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3
                        className="font-semibold text-sm truncate max-w-[70%]"
                        style={{ color: 'hsl(var(--text))' }}
                      >
                        {proj.name}
                      </h3>
                      {proj.isFavorite && (
                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-current flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] mb-3" style={{ color: 'hsl(var(--overlay0))' }}>
                      {new Date(proj.lastOpened).toLocaleString(undefined, {
                        month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={e => { e.stopPropagation(); onOpenProject?.(proj.id); }}
                        className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-fast"
                        style={{
                          background: 'hsl(var(--blue) / 0.15)',
                          color: 'hsl(var(--blue))',
                          border: '1px solid hsl(var(--blue) / 0.25)',
                        }}
                      >
                        Open
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          window.open(window.location.href, '_blank');
                          onOpenProject?.(proj.id);
                        }}
                        className="p-1.5 rounded-lg text-editor-text-dim hover:text-editor-text transition-fast"
                        style={{ background: 'hsl(var(--surface0))' }}
                        title="Open in new tab"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  {/* Delete button */}
                  {onDeleteProject && (
                    <button
                      onClick={e => { e.stopPropagation(); onDeleteProject(proj.id); }}
                      className="absolute top-3 right-3 p-1 rounded opacity-0 group-hover:opacity-100 transition-all text-editor-text-dim hover:text-red-400 hover:bg-red-500/10"
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Templates */}
        <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'hsl(var(--text))' }}>
            <Zap className="w-4 h-4" style={{ color: 'hsl(var(--yellow))' }} />
            Start New Project
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {TEMPLATE_CARDS.map((card, i) => (
              <button
                key={card.type}
                onClick={() => handleTemplate(card.type)}
                className={`group relative flex flex-col p-4 rounded-xl border text-left transition-all duration-200 overflow-hidden animate-fade-in ${card.stagger}`}
                style={{
                  background: 'hsl(var(--mantle))',
                  borderColor: 'hsl(var(--surface1))',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget;
                  el.style.borderColor = 'hsl(var(--blue) / 0.4)';
                  el.style.background = 'hsl(var(--surface0))';
                  el.style.transform = 'translateY(-2px)';
                  el.style.boxShadow = '0 8px 24px hsl(var(--blue) / 0.1)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget;
                  el.style.borderColor = 'hsl(var(--surface1))';
                  el.style.background = 'hsl(var(--mantle))';
                  el.style.transform = 'translateY(0)';
                  el.style.boxShadow = 'none';
                }}
              >
                {/* Background gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                />

                {/* Badge */}
                {card.badge && (
                  <span
                    className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{ background: 'hsl(var(--blue) / 0.2)', color: 'hsl(var(--blue))' }}
                  >
                    {card.badge}
                  </span>
                )}

                <div className="relative z-10">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-transform duration-200 group-hover:scale-110"
                    style={{ background: 'hsl(var(--surface0))' }}
                  >
                    {card.icon}
                  </div>
                  <h3 className="font-semibold text-sm mb-1" style={{ color: 'hsl(var(--text))' }}>
                    {card.label}
                  </h3>
                  <p className="text-[11px] leading-relaxed" style={{ color: 'hsl(var(--overlay0))' }}>
                    {card.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <p className="text-[11px]" style={{ color: 'hsl(var(--overlay0))' }}>
            HRDK Pen — Browser IDE powered by WebContainers, Monaco Editor & Pyodide
          </p>
        </div>
      </div>
    </div>
  );
};
