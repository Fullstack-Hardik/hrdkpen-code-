import { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { Terminal, TerminalHandle } from './Terminal';
import type { FileNode } from './FileExplorer';

interface MultiTerminalProps {
  getFileSystem?: () => FileNode[];
}

export type MultiTerminalHandle = {
  runCode: (language: string, code: string) => void;
};

export const MultiTerminal = forwardRef<MultiTerminalHandle, MultiTerminalProps>(
  ({ getFileSystem }, ref) => {
    const [sessions, setSessions] = useState<{ id: string; name: string }[]>([
      { id: 'term-1', name: 'Terminal 1' },
    ]);
    const [active, setActive] = useState('term-1');
    const termRefs = useRef<Record<string, TerminalHandle | null>>({});

    const addSession = () => {
      const id = `term-${Date.now()}`;
      setSessions((s) => [...s, { id, name: `Terminal ${s.length + 1}` }]);
      setActive(id);
    };

    const killActive = () => {
      setSessions((s) => s.filter((x) => x.id !== active));
      setActive((prev) => {
        const remaining = sessions.filter((x) => x.id !== prev);
        return remaining[0]?.id || '';
      });
    };

    useImperativeHandle(ref, () => ({
      runCode: (language: string, code: string) => {
        const handle = termRefs.current[active];
        if (!handle) return;
        if (language === 'typescript' || language === 'javascript') {
          handle.runJS(code);
        }
      },
    }));

    return (
      <div className="flex flex-col h-full bg-editor-bg">
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-editor-sidebar">
          <div className="text-xs font-medium text-editor-text">Terminal</div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={addSession} className="h-6 px-2 text-xs">
              <Plus className="w-3 h-3" />
            </Button>
            {sessions.length > 1 && (
              <Button variant="ghost" size="sm" onClick={killActive} className="h-6 px-2 text-xs">
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        <Tabs value={active} onValueChange={setActive} className="flex-1 flex flex-col">
          {sessions.length > 1 && (
            <div className="px-2 py-1 bg-editor-panel border-b border-border">
              <div className="flex gap-1">
                {sessions.map((s) => (
                  <Button
                    key={s.id}
                    variant={active === s.id ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActive(s.id)}
                    className="h-6 px-2 text-xs"
                  >
                    {s.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {sessions.map((s) => (
            <div key={s.id} className={`flex-1 ${active === s.id ? 'block' : 'hidden'}`}>
              <Terminal
                ref={(r) => { if (r) termRefs.current[s.id] = r; }}
                getFileSystem={getFileSystem}
                name={s.name}
                showHeader={false}
              />
            </div>
          ))}
        </Tabs>
      </div>
    );
  }
);
