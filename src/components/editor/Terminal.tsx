import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { TerminalSquare, Trash2, X } from 'lucide-react';
import { Play, HelpCircle, Code2, Bug } from 'lucide-react';
import { getWebContainer } from '@/lib/webcontainer';
import { executeJavaScript, executePython, executeCompiled } from '@/lib/execution';
import '@xterm/xterm/css/xterm.css';

import { processManager } from '@/lib/processManager';

export interface TerminalHandle {
  runCode: (language: string, code: string) => void;
  execute: (cmd: string) => void;
  clear: () => void;
}

interface TerminalProps {
  onClose?: () => void;
  managedProcessId?: string;
}

export const Terminal = forwardRef<TerminalHandle, TerminalProps>(({ onClose, managedProcessId }, ref) => {
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

    if (managedProcessId) {
      // Connect to existing managed process
      setIsBooting(false);
      term.writeln(`\x1b[38;5;14mAttached to managed process: ${managedProcessId}\x1b[0m`);
      
      const unsubscribe = processManager.subscribe((processes) => {
         const p = processes.find(p => p.id === managedProcessId);
         if (p) {
            // Write new output (this is naive, a real impl might track cursor but for now we write the last lines if they change)
            // Actually, we should hook into the process stream directly if possible, or just dump the output array.
            // Since processManager stores the array, let's clear and dump, or just rely on a dedicated stream event.
            // For simplicity, let's just clear and write the full output when it changes if we are managed.
            term.clear();
            p.output.forEach(chunk => term.write(chunk));
         }
      });
      return () => {
        unsubscribe();
        resizeObserver.disconnect();
        term.dispose();
        xtermRef.current = null;
      };
    }

    // Boot WebContainer and connect PTY for interactive jsh
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
    clear: () => {
      xtermRef.current?.clear();
    }
  }));

  return (
    <div className="flex flex-col h-full font-code bg-editor-bg">
      {/* Terminal Output */}
      <div className="flex-1 overflow-hidden relative">
        {isBooting && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-editor-bg/80 backdrop-blur-sm animate-fade-in">
             <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-3" />
             <span className="text-xs font-medium text-blue-400 animate-pulse">Booting container...</span>
          </div>
        )}
        <div className="absolute inset-0 p-2" ref={terminalRef} />
      </div>
    </div>
  );
});

Terminal.displayName = 'Terminal';