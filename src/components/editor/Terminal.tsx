import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { TerminalSquare, Trash2, X } from 'lucide-react';
import { Play, HelpCircle, Code2, Bug } from 'lucide-react';
import { getWebContainer } from '@/lib/webcontainer';
import { executeJavaScript, executePython, executeCompiled } from '@/lib/execution';
import '@xterm/xterm/css/xterm.css';

export interface TerminalHandle {
  runCode: (language: string, code: string) => void;
  execute: (cmd: string) => void;
}

interface TerminalProps {
  onClose?: () => void;
}

export const Terminal = forwardRef<TerminalHandle, TerminalProps>(({ onClose }, ref) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const processRef = useRef<any>(null); // WebContainer process
  const writerRef = useRef<any>(null); // WebContainer input writer
  const [isBooting, setIsBooting] = useState(true);

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new XTerm({
      theme: {
        background: '#09090b', // zinc-950 (crust)
        foreground: '#fafafa', // zinc-50 (text)
        cursor: '#f4f4f5',
        black: '#27272a',
        red: '#f87171',
        green: '#4ade80',
        yellow: '#facc15',
        blue: '#60a5fa',
        magenta: '#c084fc',
        cyan: '#22d3ee',
        white: '#f4f4f5',
      },
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      fontSize: 13,
      cursorBlink: true,
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => fitAddon.fit());
    });
    resizeObserver.observe(terminalRef.current);

    // Boot WebContainer and connect PTY
    (async () => {
      try {
        term.writeln('\x1b[38;5;14mBooting WebContainer environment...\x1b[0m');
        const webcontainer = await getWebContainer();
        
        const shellProcess = await webcontainer.spawn('jsh', {
          terminal: {
            cols: term.cols,
            rows: term.rows,
          },
        });
        processRef.current = shellProcess;

        // Pipe from WebContainer to Xterm
        shellProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              term.write(data);
            },
          })
        );

        // Pipe from Xterm to WebContainer
        const input = shellProcess.input.getWriter();
        writerRef.current = input;
        term.onData((data) => {
          input.write(data);
        });

        term.onResize((size) => {
          shellProcess.resize({
            cols: size.cols,
            rows: size.rows,
          });
        });

        setIsBooting(false);
      } catch (err) {
        term.writeln(`\r\n\x1b[31mFailed to boot WebContainer: ${err}\x1b[0m`);
        setIsBooting(false);
      }
    })();

    return () => {
      resizeObserver.disconnect();
      term.dispose();
      xtermRef.current = null;
    };
  }, []);

  useImperativeHandle(ref, () => ({
    runCode: async (language: string, code: string) => {
      const term = xtermRef.current;
      if (!term) return;
      term.writeln('');
      
      const lang = language.toLowerCase();
      
      if (lang === 'python' || lang === 'py') {
        term.writeln('\x1b[36m▶ Loading Python (Pyodide)...\x1b[0m');
        const r = await executePython(code);
        if (r.stdout) term.writeln(r.stdout.replace(/\\n/g, '\r\n'));
        if (r.stderr) term.writeln(`\x1b[31m${r.stderr}\x1b[0m`.replace(/\\n/g, '\r\n'));
        if (!r.stdout && !r.stderr) term.writeln('\x1b[32m(no output)\x1b[0m');
        term.writeln('');
      } else if (lang === 'c' || lang === 'cpp') {
        term.writeln('\x1b[36m▶ Compiling with GCC...\x1b[0m');
        try {
          const r = await executeCompiled(lang as 'c' | 'cpp', code);
          if (r.stdout) term.writeln(r.stdout.replace(/\\n/g, '\r\n'));
          if (r.stderr) term.writeln(`\x1b[31m${r.stderr}\x1b[0m`.replace(/\\n/g, '\r\n'));
          if (r.exitCode !== 0) term.writeln(`\x1b[31mProcess exited with code ${r.exitCode}\x1b[0m`);
          else if (!r.stdout && !r.stderr) term.writeln('\x1b[32m(no output)\x1b[0m');
        } catch {
          term.writeln('\x1b[31mServer unavailable.\x1b[0m');
        }
        term.writeln('');
      } else {
        // Node or JavaScript: Use WebContainer
        if (processRef.current && writerRef.current) {
           const webcontainer = await getWebContainer();
           await webcontainer.fs.writeFile('temp.js', code);
           term.writeln('\x1b[36m▶ Running node temp.js...\x1b[0m');
           writerRef.current.write('node temp.js\r');
        } else {
           term.writeln('\x1b[31mWebContainer not ready.\x1b[0m');
        }
      }
    },
    execute: (cmd: string) => {
      const term = xtermRef.current;
      const writer = writerRef.current;
      if (term && writer) {
        if (cmd.trim().toLowerCase() === 'help') {
          term.writeln('');
          term.writeln('\x1b[36m================ HELP MENU ================\x1b[0m');
          term.writeln('\x1b[33mnpm run dev\x1b[0m    : Starts the development server (Vite, React, etc.)');
          term.writeln('\x1b[33mnpm run build\x1b[0m  : Builds the project for production');
          term.writeln('\x1b[33mnode <file>\x1b[0m    : Runs a Javascript file (e.g. node index.js)');
          term.writeln('\x1b[33mls\x1b[0m             : Lists files in the current directory');
          term.writeln('\x1b[33mpwd\x1b[0m            : Shows the current directory path');
          term.writeln('\x1b[33mclear\x1b[0m          : Clears the terminal screen');
          term.writeln('\x1b[36m===========================================\x1b[0m');
          term.writeln('');
          return;
        }
        writer.write(cmd + '\r');
      }
    },
  }));

  const handleClear = () => {
    xtermRef.current?.clear();
  };

  return (
    <div className="flex flex-col h-full font-code bg-editor-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-3 flex-shrink-0 bg-editor-panel border-b border-editor-border" style={{ height: 32 }}>
        <div className="flex items-center gap-2">
          <TerminalSquare className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs font-medium text-slate-400">Terminal</span>
          {isBooting && <span className="text-xs text-yellow-500 animate-pulse">Booting container...</span>}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Quick Action Buttons */}
          <div className="flex items-center bg-editor-bg border border-editor-border rounded p-0.5">
            <button
              onClick={() => writerRef.current?.write('npm run dev\r')}
              className="flex items-center gap-1 px-2 py-0.5 text-[10px] text-green-400 hover:bg-green-500/10 rounded transition-colors"
              title="Run 'npm run dev'"
            >
              <Play className="w-3 h-3" /> Dev
            </button>
            <div className="w-px h-3 bg-editor-border mx-0.5" />
            <button
              onClick={() => writerRef.current?.write('npm run build\r')}
              className="flex items-center gap-1 px-2 py-0.5 text-[10px] text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
              title="Run 'npm run build'"
            >
              <Code2 className="w-3 h-3" /> Build
            </button>
            <div className="w-px h-3 bg-editor-border mx-0.5" />
            <button
              onClick={() => writerRef.current?.write('help\r')}
              className="flex items-center gap-1 px-2 py-0.5 text-[10px] text-purple-400 hover:bg-purple-500/10 rounded transition-colors"
              title="Help Menu"
            >
              <HelpCircle className="w-3 h-3" /> Help
            </button>
          </div>

          <div className="w-px h-4 bg-editor-border mx-1" />

          <button onClick={handleClear} className="p-1 rounded transition-fast text-slate-500 hover:text-slate-300" title="Clear">
            <Trash2 className="w-3 h-3" />
          </button>
          {onClose && (
            <button onClick={onClose} className="p-1 rounded transition-fast text-slate-500 hover:text-slate-300" title="Close">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Terminal Output */}
      <div className="flex-1 overflow-hidden p-2" ref={terminalRef} />
    </div>
  );
});

Terminal.displayName = 'Terminal';