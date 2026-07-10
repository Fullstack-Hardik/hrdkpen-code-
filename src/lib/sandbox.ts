/**
 * Secure JavaScript sandbox using hidden iframe + postMessage.
 *
 * Replaces eval() in main thread. User code runs in a completely
 * isolated browsing context — alert/prompt/confirm are intercepted
 * and returned as messages, not affecting the main IDE window.
 *
 * Usage:
 *   const result = await runInSandbox(code, { timeout: 5000 });
 *   result.logs    → console output lines
 *   result.errors  → runtime errors
 *   result.alerts  → alert/confirm/prompt calls
 */

export interface SandboxLog {
  type: 'log' | 'warn' | 'error' | 'info';
  args: string[];
}

export interface SandboxAlert {
  kind: 'alert' | 'confirm' | 'prompt';
  message: string;
}

export interface SandboxResult {
  logs: SandboxLog[];
  errors: string[];
  alerts: SandboxAlert[];
  duration: number;
}

const IFRAME_BOILERPLATE = (code: string) => `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>
<script>
(function() {
  'use strict';

  // Intercept console
  const _log = [];
  function capture(type) {
    return function(...args) {
      const strs = args.map(a => {
        try { return typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a); }
        catch { return String(a); }
      });
      window.parent.postMessage({ __hrdkpen: true, type: 'console', level: type, args: strs }, '*');
    };
  }
  console.log   = capture('log');
  console.warn  = capture('warn');
  console.error = capture('error');
  console.info  = capture('info');

  // Intercept alert/confirm/prompt
  window.alert   = (msg) => window.parent.postMessage({ __hrdkpen: true, type: 'alert',   kind: 'alert',   message: String(msg ?? '') }, '*');
  window.confirm = (msg) => { window.parent.postMessage({ __hrdkpen: true, type: 'alert', kind: 'confirm', message: String(msg ?? '') }, '*'); return false; };
  window.prompt  = (msg) => { window.parent.postMessage({ __hrdkpen: true, type: 'alert', kind: 'prompt',  message: String(msg ?? '') }, '*'); return ''; };

  // Catch uncaught errors
  window.addEventListener('error', (e) => {
    window.parent.postMessage({ __hrdkpen: true, type: 'error', message: e.message + (e.lineno ? ' (line ' + e.lineno + ')' : '') }, '*');
  });

  window.addEventListener('unhandledrejection', (e) => {
    window.parent.postMessage({ __hrdkpen: true, type: 'error', message: 'Unhandled Promise: ' + String(e.reason?.message || e.reason) }, '*');
  });

  // Signal ready
  window.parent.postMessage({ __hrdkpen: true, type: 'ready' }, '*');
})();
</script>
<script>
// ---- USER CODE ----
try {
  ${code}
} catch (e) {
  window.parent.postMessage({ __hrdkpen: true, type: 'error', message: e.message + (e.stack ? '\\n' + e.stack.split('\\n').slice(1, 3).join('\\n') : '') }, '*');
}
window.parent.postMessage({ __hrdkpen: true, type: 'done' }, '*');
</script>
</body>
</html>`;

export function runInSandbox(code: string, timeout = 8000): Promise<SandboxResult> {
  return new Promise((resolve) => {
    const logs: SandboxLog[] = [];
    const errors: string[] = [];
    const alerts: SandboxAlert[] = [];
    const start = performance.now();

    // Create isolated iframe
    const iframe = document.createElement('iframe');
    iframe.setAttribute('sandbox', 'allow-scripts');
    iframe.style.cssText = 'position:fixed;width:0;height:0;opacity:0;pointer-events:none;border:0;top:-9999px';
    document.body.appendChild(iframe);

    let done = false;
    let timer: ReturnType<typeof setTimeout>;

    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      window.removeEventListener('message', handleMessage);
      try { document.body.removeChild(iframe); } catch { /* already removed */ }
      resolve({ logs, errors, alerts, duration: Math.round(performance.now() - start) });
    };

    const handleMessage = (event: MessageEvent) => {
      if (!event.data?.__hrdkpen) return;
      const msg = event.data;

      switch (msg.type) {
        case 'console':
          logs.push({ type: msg.level as SandboxLog['type'], args: msg.args });
          break;
        case 'error':
          errors.push(msg.message);
          break;
        case 'alert':
          alerts.push({ kind: msg.kind, message: msg.message });
          break;
        case 'done':
          finish();
          break;
      }
    };

    window.addEventListener('message', handleMessage);

    // Timeout safety
    timer = setTimeout(() => {
      errors.push(`Execution timed out after ${timeout / 1000}s`);
      finish();
    }, timeout);

    // Inject code
    const blob = new Blob([IFRAME_BOILERPLATE(code)], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    iframe.src = url;
    // Clean up blob URL after iframe loads
    iframe.onload = () => URL.revokeObjectURL(url);
  });
}
