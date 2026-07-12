import { useState, useMemo } from 'react';
import { Search, Star, ExternalLink, Copy, Check, X, ChevronRight } from 'lucide-react';
import { HELP_DATA, type HelpDoc } from '@/data/helpData';
interface CheatSheetProps {
  pkg: HelpDoc;
  onClose: () => void;
}

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="p-1 rounded hover:bg-white/10 text-editor-text-dim hover:text-editor-text transition-fast"
      title="Copy"
    >
      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
    </button>
  );
};

const CodeBlock = ({ code, label }: { code: string; label: string }) => (
  <div className="mb-3">
    <div className="flex items-center justify-between mb-1">
      <span className="text-[10px] uppercase tracking-widest text-editor-text-dim">{label}</span>
      <CopyButton text={code} />
    </div>
    <pre
      className="font-code text-[11px] leading-relaxed rounded-md p-3 overflow-x-auto custom-scrollbar"
      style={{ background: 'hsl(var(--crust))', color: 'hsl(var(--text))', border: '1px solid hsl(var(--surface1))' }}
    >
      <code>{code}</code>
    </pre>
  </div>
);

const CheatSheet = ({ pkg, onClose }: CheatSheetProps) => (
  <div
    className="flex flex-col h-full animate-slide-up"
    style={{ background: 'hsl(var(--editor-bg))' }}
  >
    {/* Header */}
    <div
      className="flex items-center justify-between px-4 py-3 border-b border-editor-border flex-shrink-0"
      style={{ background: 'hsl(var(--mantle))' }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white"
          style={{ background: pkg.color, boxShadow: `0 0 12px ${pkg.color}40` }}
        >
          {pkg.badge}
        </div>
        <div>
          <h3 className="font-semibold text-sm text-editor-text">{pkg.name}</h3>
          <p className="text-[11px] text-editor-text-dim">{pkg.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <a
          href={pkg.docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded hover:bg-white/5 text-editor-text-dim hover:text-blue-400 transition-fast"
          title="Official Docs"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <button
          onClick={onClose}
          className="p-1.5 rounded hover:bg-white/5 text-editor-text-dim hover:text-editor-text transition-fast"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-editor-bg">
      {(pkg.install || pkg.uninstall) && (
        <div className="space-y-3">
          {pkg.install && (
            <div className="space-y-1.5">
              <h3 className="text-[10px] font-bold text-editor-text-muted uppercase tracking-wider">Install</h3>
              <CodeBlock code={pkg.install} />
            </div>
          )}
          {pkg.uninstall && (
            <div className="space-y-1.5">
              <h3 className="text-[10px] font-bold text-editor-text-muted uppercase tracking-wider">Uninstall</h3>
              <CodeBlock code={pkg.uninstall} />
            </div>
          )}
        </div>
      )}

      <div className="space-y-3 border-t border-editor-border pt-4">
        {pkg.importExample && (
          <div className="space-y-1.5">
            <h3 className="text-[10px] font-bold text-editor-text-muted uppercase tracking-wider">Import</h3>
            <CodeBlock code={pkg.importExample} language="typescript" />
          </div>
        )}
        
        <div className="space-y-1.5">
          <h3 className="text-[10px] font-bold text-editor-text-muted uppercase tracking-wider">Basic Usage</h3>
          <CodeBlock code={pkg.basicUsage} language={pkg.badge === 'CSS' ? 'css' : pkg.badge === 'HTML' ? 'html' : 'typescript'} />
        </div>
      </div>
    </div>
  </div>
);

export const HelpCenter = () => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<HelpDoc | null>(null);

  const categories = useMemo(() => {
    const cats = new Set(HELP_DATA.map(p => p.category));
    return ['All', ...Array.from(cats)];
  }, []);

  const filtered = useMemo(() => {
    return HELP_DATA.filter(pkg => {
      const matchesCategory = activeCategory === 'All' || pkg.category === activeCategory;
      const matchesSearch = !search ||
        pkg.name.toLowerCase().includes(search.toLowerCase()) ||
        pkg.description.toLowerCase().includes(search.toLowerCase()) ||
        pkg.category.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [search, activeCategory]);

  const toggleFav = (name: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  if (selected) {
    return <CheatSheet pkg={selected} onClose={() => setSelected(null)} />;
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'hsl(var(--editor-bg))' }}>
      <div className="px-3 py-2 border-b border-editor-border flex-shrink-0" style={{ background: 'hsl(var(--mantle))' }}>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-editor-text-dim" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search packages, frameworks..."
            className="w-full h-7 pl-8 pr-3 text-xs bg-editor-active-tab border border-editor-border rounded-md text-editor-text placeholder:text-editor-text-dim outline-none"
          />
        </div>
      </div>

      <div
        className="flex gap-1 px-2 py-1.5 border-b border-editor-border overflow-x-auto flex-shrink-0 custom-scrollbar"
        style={{ background: 'hsl(var(--crust))' }}
      >
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-2.5 py-0.5 rounded-full text-[10px] whitespace-nowrap transition-fast font-medium flex-shrink-0 ${
              activeCategory === cat
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                : 'text-editor-text-dim hover:text-editor-text hover:bg-white/5'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <p className="text-sm text-editor-text-dim">No packages found</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map((pkg, i) => (
              <div
                key={pkg.name}
                onClick={() => setSelected(pkg)}
                className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer group transition-all hover:bg-white/5 border border-transparent hover:border-editor-border animate-fade-in"
                style={{ animationDelay: `${i * 0.02}s` }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                  style={{ background: pkg.color, opacity: 0.9 }}
                >
                  {pkg.badge}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-editor-text">{pkg.name}</span>
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-full"
                      style={{ background: 'hsl(var(--surface0))', color: 'hsl(var(--overlay1))' }}
                    >
                      {pkg.category}
                    </span>
                  </div>
                  <p className="text-[10px] text-editor-text-muted mt-0.5 line-clamp-1">{pkg.description}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={e => { e.stopPropagation(); toggleFav(pkg.name); }}
                    className={`p-1 rounded transition-fast ${favorites.has(pkg.name) ? 'text-yellow-400' : 'text-editor-text-dim opacity-0 group-hover:opacity-100 hover:text-yellow-400'}`}
                  >
                    <Star className={`w-3 h-3 ${favorites.has(pkg.name) ? 'fill-current' : ''}`} />
                  </button>
                  <ChevronRight className="w-3.5 h-3.5 text-editor-text-dim opacity-0 group-hover:opacity-100 transition-fast" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div
        className="px-3 py-1.5 border-t border-editor-border flex items-center justify-between flex-shrink-0"
        style={{ background: 'hsl(var(--crust))' }}
      >
        <span className="text-[10px] text-editor-text-dim">{filtered.length} packages</span>
        <span className="text-[10px] text-editor-text-dim">{favorites.size} starred</span>
      </div>
    </div>
  );
};
