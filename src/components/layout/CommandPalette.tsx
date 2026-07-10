import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { Search, FileCode, Play, Settings, Bot, BookOpen, ImageIcon, LayoutPanelLeft } from 'lucide-react';
import type { FileNode } from '@/types';

export const CommandPalette = ({
  open,
  setOpen,
  onAction,
  files = []
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  onAction: (action: string, payload?: any) => void;
  files: FileNode[];
}) => {

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [setOpen]);

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Global Command Menu"
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] sm:pt-[20vh] bg-black/40 backdrop-blur-sm"
    >
      <div className="w-full max-w-xl bg-editor-panel border border-editor-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center border-b border-editor-border px-3">
          <Search className="w-4 h-4 text-editor-text-muted" />
          <Command.Input
            autoFocus
            placeholder="Type a command or search..."
            className="w-full h-12 bg-transparent border-none outline-none text-sm text-editor-text placeholder:text-editor-text-muted ml-3"
          />
        </div>
        <Command.List className="max-h-[300px] overflow-y-auto p-2 custom-scrollbar">
          <Command.Empty className="py-6 text-center text-sm text-editor-text-muted">
            No results found.
          </Command.Empty>

          <Command.Group heading="Files" className="text-[11px] font-semibold text-editor-text-muted uppercase tracking-wider mb-2 px-2 pt-2">
            {files.map((file) => (
              <Command.Item
                key={file.id}
                onSelect={() => {
                  onAction('openFile', file);
                  setOpen(false);
                }}
                className="flex items-center gap-2 px-2 py-2 rounded-md text-sm text-editor-text cursor-pointer hover:bg-editor-active-tab aria-selected:bg-editor-active-tab aria-selected:text-editor-text"
              >
                <FileCode className="w-4 h-4 text-editor-text-dim" />
                {file.name}
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Separator className="h-px bg-editor-border my-2" />

          <Command.Group heading="Actions" className="text-[11px] font-semibold text-editor-text-muted uppercase tracking-wider mb-2 px-2">
            <Command.Item
              onSelect={() => {
                onAction('run');
                setOpen(false);
              }}
              className="flex items-center gap-2 px-2 py-2 rounded-md text-sm text-editor-text cursor-pointer hover:bg-editor-active-tab aria-selected:bg-editor-active-tab aria-selected:text-editor-text"
            >
              <Play className="w-4 h-4 text-emerald-400" />
              Run Code
            </Command.Item>
            <Command.Item
              onSelect={() => {
                onAction('view', 'ai');
                setOpen(false);
              }}
              className="flex items-center gap-2 px-2 py-2 rounded-md text-sm text-editor-text cursor-pointer hover:bg-editor-active-tab aria-selected:bg-editor-active-tab aria-selected:text-editor-text"
            >
              <Bot className="w-4 h-4 text-blue-400" />
              Open AI Assistant
            </Command.Item>
            <Command.Item
              onSelect={() => {
                onAction('view', 'docs');
                setOpen(false);
              }}
              className="flex items-center gap-2 px-2 py-2 rounded-md text-sm text-editor-text cursor-pointer hover:bg-editor-active-tab aria-selected:bg-editor-active-tab aria-selected:text-editor-text"
            >
              <BookOpen className="w-4 h-4 text-purple-400" />
              Open Documentation
            </Command.Item>
            <Command.Item
              onSelect={() => {
                onAction('view', 'assets');
                setOpen(false);
              }}
              className="flex items-center gap-2 px-2 py-2 rounded-md text-sm text-editor-text cursor-pointer hover:bg-editor-active-tab aria-selected:bg-editor-active-tab aria-selected:text-editor-text"
            >
              <ImageIcon className="w-4 h-4 text-orange-400" />
              Asset Library
            </Command.Item>
            <Command.Item
              onSelect={() => {
                onAction('view', 'settings');
                setOpen(false);
              }}
              className="flex items-center gap-2 px-2 py-2 rounded-md text-sm text-editor-text cursor-pointer hover:bg-editor-active-tab aria-selected:bg-editor-active-tab aria-selected:text-editor-text"
            >
              <Settings className="w-4 h-4 text-gray-400" />
              Settings
            </Command.Item>
          </Command.Group>
        </Command.List>
      </div>
    </Command.Dialog>
  );
};
