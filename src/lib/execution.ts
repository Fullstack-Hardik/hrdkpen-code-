import { runInSandbox } from '@/lib/sandbox';
import type { SandboxResult } from '@/lib/sandbox';
import type { ExecutionResult } from '@/types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

/**
 * Execute JavaScript using a secure iframe sandbox.
 * alert/prompt/confirm are captured as messages, not affecting the IDE.
 */
export async function executeJavaScript(code: string): Promise<ExecutionResult & { sandboxResult: SandboxResult }> {
  const result = await runInSandbox(code, 8000);

  const stdoutLines: string[] = [];
  const stderrLines: string[] = [];

  for (const log of result.logs) {
    const prefix = log.type === 'error' ? '[error] ' : log.type === 'warn' ? '[warn] ' : '';
    const line = prefix + log.args.join(' ');
    if (log.type === 'error') stderrLines.push(line);
    else stdoutLines.push(line);
  }

  for (const alert of result.alerts) {
    stdoutLines.push(`[${alert.kind}] ${alert.message}`);
  }

  return {
    stdout: stdoutLines.join('\n'),
    stderr: [...stderrLines, ...result.errors].join('\n'),
    exitCode: result.errors.length > 0 ? 1 : 0,
    sandboxResult: result,
  };
}

/**
 * Execute Python via Pyodide (lazy-loaded from CDN).
 */
let pyodideInstance: any = null;
let pyodideLoading: Promise<any> | null = null;

export async function executePython(code: string): Promise<ExecutionResult> {
  if (!pyodideInstance) {
    if (!pyodideLoading) {
      pyodideLoading = (async () => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.27.6/full/pyodide.js';
        document.head.appendChild(script);
        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Pyodide'));
        });
        // @ts-expect-error global
        pyodideInstance = await window.loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.6/full/',
          stdin: () => {
            const res = window.prompt('Python Input:');
            return res !== null ? res + '\n' : '\n';
          }
        });
      })();
    }
    try {
      await pyodideLoading;
    } catch {
      return { stdout: '', stderr: 'Failed to load Python environment. Check internet connection.', exitCode: 1 };
    }
  }

  try {
    pyodideInstance.runPython(`
import sys, io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
`);
    let result: unknown;
    let exitCode = 0;
    try {
      result = pyodideInstance.runPython(code);
    } catch (e: unknown) {
      exitCode = 1;
      const stderr: string = pyodideInstance.runPython('sys.stderr.getvalue()');
      const stdout: string = pyodideInstance.runPython('sys.stdout.getvalue()');
      return { stdout, stderr: stderr || String(e), exitCode };
    }

    const stdout: string = pyodideInstance.runPython('sys.stdout.getvalue()');
    const tail = result !== undefined && result !== null ? `\n→ ${String(result)}` : '';
    return { stdout: stdout + tail, stderr: '', exitCode };
  } catch (e: unknown) {
    return { stdout: '', stderr: String(e), exitCode: 1 };
  }
}

/**
 * Execute C/C++ via Piston API (proxied through Express server).
 */
export async function executeCompiled(language: 'c' | 'cpp', code: string): Promise<ExecutionResult> {
  const res = await fetch(`${API_BASE}/api/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language, code }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    return { stdout: '', stderr: `Server error: ${err}`, exitCode: 1 };
  }

  return res.json() as Promise<ExecutionResult>;
}
