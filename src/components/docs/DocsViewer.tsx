import React, { useState, useMemo, useRef, useEffect } from 'react';
import { BookOpen, Search, ExternalLink, ChevronRight, Hash } from 'lucide-react';
import Fuse from 'fuse.js';

const CATEGORIES = ['HTML & CSS', 'JavaScript & React', 'Backend & DB', 'Languages'];

interface DocTopic {
  id: string;
  title: string;
  category: string;
  desc: string;
  slug: string;
}

const POPULAR_TOPICS: DocTopic[] = [
  { id: 'html', title: 'HTML', category: 'HTML & CSS', desc: 'HyperText Markup Language', slug: 'html' },
  { id: 'css', title: 'CSS', category: 'HTML & CSS', desc: 'Cascading Style Sheets', slug: 'css' },
  { id: 'javascript', title: 'JavaScript', category: 'JavaScript & React', desc: 'JS Reference', slug: 'javascript' },
  { id: 'react', title: 'React', category: 'JavaScript & React', desc: 'UI Library', slug: 'react' },
  { id: 'node', title: 'Node.js', category: 'Backend & DB', desc: 'JS Runtime', slug: 'node' },
  { id: 'express', title: 'Express', category: 'Backend & DB', desc: 'Web framework', slug: 'express' },
  { id: 'python', title: 'Python', category: 'Languages', desc: 'Programming language', slug: 'python~3.11' },
  { id: 'c', title: 'C', category: 'Languages', desc: 'C language', slug: 'c' },
  { id: 'cpp', title: 'C++', category: 'Languages', desc: 'C++ language', slug: 'cpp' },
  { id: 'typescript', title: 'TypeScript', category: 'JavaScript & React', desc: 'Typed JS', slug: 'typescript' },
  { id: 'git', title: 'Git', category: 'Languages', desc: 'Version control', slug: 'git' },
];

export const DocsViewer = () => {
  const [topics] = useState<DocTopic[]>(POPULAR_TOPICS);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('HTML & CSS');
  const [activeTopic, setActiveTopic] = useState<DocTopic>(POPULAR_TOPICS[0]);
  const activeUrl = `https://devdocs.io/${activeTopic.slug}/`;

  // Fuzzy search setup
  const fuse = useMemo(() => new Fuse(topics, { keys: ['title', 'desc', 'slug'], threshold: 0.4 }), [topics]);

  const searchResults = useMemo(() => {
    if (!query) {
      return topics.filter(t => t.category === selectedCategory);
    }
    return fuse.search(query).map(r => r.item);
  }, [query, selectedCategory, fuse, topics]);

  return (
    <div className="flex h-full bg-editor-bg">
      {/* Left Sidebar for Topics/Search */}
      <div className="w-64 flex flex-col border-r border-editor-border bg-editor-panel flex-shrink-0">
        <div className="p-3 border-b border-editor-border bg-editor-sidebar">
          <h2 className="text-sm font-semibold text-editor-text flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-emerald-400" /> DevDocs Local
          </h2>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-editor-text-dim" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search topics (e.g. flexbox)..."
              className="w-full h-7 pl-8 pr-3 text-xs bg-editor-bg border border-editor-border rounded text-editor-text outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>

        {!query && (
          <div className="flex overflow-x-auto p-2 gap-1 border-b border-editor-border scrollbar-none flex-shrink-0 bg-editor-sidebar">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-1 text-[10px] rounded transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-emerald-600/20 text-emerald-400 font-medium border border-emerald-500/30'
                    : 'text-editor-text-muted hover:text-editor-text hover:bg-editor-active-tab border border-transparent'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          <div className="text-[10px] font-semibold text-editor-text-muted uppercase tracking-wider mb-2 px-1">
            {query ? 'Search Results' : 'Quick Topics'}
          </div>
          {searchResults.map(topic => (
            <button
              key={topic.id}
              onClick={() => setActiveTopic(topic)}
              className={`w-full text-left flex items-start gap-2 p-2 rounded transition-colors ${
                activeTopic.id === topic.id
                  ? 'bg-editor-active-tab border border-editor-border text-editor-text'
                  : 'text-editor-text-muted hover:bg-editor-active-tab hover:text-editor-text border border-transparent'
              }`}
            >
              <Hash className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-emerald-500/60" />
              <div className="min-w-0">
                <div className="text-xs font-medium truncate">{topic.title}</div>
                <div className="text-[10px] truncate text-editor-text-dim mt-0.5">{topic.desc}</div>
              </div>
            </button>
          ))}
          {searchResults.length === 0 && (
            <div className="text-xs text-editor-text-muted text-center p-4">No matching topics</div>
          )}
        </div>
      </div>

      {/* Main Iframe Viewer */}
      <div className="flex-1 flex flex-col min-w-0 bg-editor-bg">
        <div className="h-10 bg-editor-sidebar border-b border-editor-border flex items-center justify-between px-4 flex-shrink-0">
          <div className="text-xs text-editor-text-muted truncate flex-1 font-mono">
            {activeUrl}
          </div>
          <a
            href={activeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[10px] bg-editor-panel border border-editor-border hover:text-white px-2 py-1 rounded transition-colors"
          >
            <ExternalLink className="w-3 h-3" /> Open in New Tab
          </a>
        </div>
        <div className="flex-1 relative bg-white">
          <iframe
            src={`https://corsproxy.io/?url=${encodeURIComponent(activeUrl)}`}
            className="absolute inset-0 w-full h-full border-0"
            title="DevDocs Reference"
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
        </div>
      </div>
    </div>
  );
};
