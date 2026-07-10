import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  RefreshCw, ExternalLink, Download, Monitor,
  Smartphone, Tablet, Laptop, Bug
} from 'lucide-react';

interface LivePreviewProps {
  htmlContent: string;
  cssContent: string;
  jsContent: string;
  activeFileName?: string;
  /** Called whenever the iframe sends console messages */
  onConsoleMessage?: (type: 'log' | 'warn' | 'error' | 'info', args: string[]) => void;
  serverUrl?: string | null;
}

function buildDocument(html: string, css: string, js: string, injectEruda = false): string {
  const erudaScript = injectEruda ? `<script src="https://cdn.jsdelivr.net/npm/eruda"></script><script>eruda.init();</script>` : '';
  
  // Inject console capture + postMessage bridge into preview
  const bridge = `
<script>
(function() {
  function send(type, args) {
    window.parent.postMessage({ __hrdkpen_preview: true, type, args }, '*');
  }
  const _c = console;
  ['log','warn','error','info'].forEach(m => {
    console[m] = (...a) => {
      send(m, a.map(v => {
        try { return typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v); }
        catch { return String(v); }
      }));
      _c[m](...a);
    };
  });
  window.onerror = (msg, src, line) => {
    send('error', [msg + (line ? ' (line ' + line + ')' : '')]);
    return false;
  };
  window.addEventListener('unhandledrejection', e => {
    send('error', ['Unhandled Promise: ' + String(e.reason?.message || e.reason)]);
  });

  // Bypass COEP block for images
  const fixImg = (img) => {
    if (img.src && !img.src.startsWith('data:') && !img.src.includes('corsproxy.io') && !img.src.startsWith('blob:')) {
      img.crossOrigin = 'anonymous';
      img.src = 'https://corsproxy.io/?url=' + encodeURIComponent(img.src);
    }
  };
  const observer = new MutationObserver(mutations => {
    mutations.forEach(m => {
      if (m.attributeName === 'src') fixImg(m.target);
      m.addedNodes.forEach(node => {
        if (node.tagName === 'IMG') fixImg(node);
        else if (node.querySelectorAll) node.querySelectorAll('img').forEach(fixImg);
      });
    });
  });
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
  window.addEventListener('DOMContentLoaded', () => document.querySelectorAll('img').forEach(fixImg));
})();
<\/script>`;

  // If user wrote full HTML document, inject bridge + CSS
  if (/<!doctype\s+html/i.test(html)) {
    return html
      .replace(/<head([^>]*)>/i, `<head$1><style>${css}</style>${bridge}${erudaScript}`)
      .replace(/<\/body>/i, `<script>\ntry { ${js} } catch(e) { console.error(e.message); }\n<\/script></body>`);
  }

  // Otherwise compose a document
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview</title>
  ${bridge}
  ${erudaScript}
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; padding: 16px; font-family: system-ui, sans-serif; color: #1a1a1a; background: #fff; }
    ${css}
  </style>
</head>
<body>
  ${html}
  <script>
    try { ${js} } catch(e) { console.error(e.message + (e.stack ? '\\n' + e.stack.split('\\n').slice(1,3).join('\\n') : '')); }
  <\/script>
</body>
</html>`;
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

const DEVICE_SIZES: Record<DeviceMode, { w: string; h: string }> = {
  desktop: { w: '100%',  h: '100%'  },
  tablet:  { w: '768px', h: '90%'   },
  mobile:  { w: '375px', h: '667px' },
};

export const LivePreview = ({
  htmlContent,
  cssContent,
  jsContent,
  activeFileName,
  onConsoleMessage,
  serverUrl,
}: LivePreviewProps) => {
  const [device, setDevice]       = useState<DeviceMode>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [inspectEnabled, setInspectEnabled] = useState(false);

  // Debounced auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setTimeout(() => setRefreshKey(k => k + 1), 600);
    return () => clearTimeout(id);
  }, [htmlContent, cssContent, jsContent, autoRefresh]);

  // Listen to postMessages from the preview iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!e.data?.__hrdkpen_preview) return;
      onConsoleMessage?.(e.data.type, e.data.args);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onConsoleMessage]);

  const openInNewTab = useCallback(() => {
    const doc = buildDocument(htmlContent, cssContent, jsContent);
    const win = window.open('', '_blank');
    if (win) { win.document.write(doc); win.document.close(); }
  }, [htmlContent, cssContent, jsContent]);

  const download = useCallback(() => {
    const doc = buildDocument(htmlContent, cssContent, jsContent);
    const blob = new Blob([doc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = activeFileName ?? 'preview.html';
    a.click(); URL.revokeObjectURL(url);
  }, [htmlContent, cssContent, jsContent, activeFileName]);

  const hasContent = !!(htmlContent.trim() || cssContent.trim() || jsContent.trim());
  const dim = DEVICE_SIZES[device];

  return (
    <div className="flex flex-col h-full bg-editor-bg">
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-3 flex-shrink-0"
        style={{
          height: 36,
          borderBottom: '1px solid hsl(var(--surface1))',
          background: 'hsl(var(--mantle))',
        }}
      >
        <div className="flex flex-1 items-center gap-2 mr-4 min-w-0">
          <Monitor className="w-3.5 h-3.5 text-editor-text-muted flex-shrink-0" />
          <span className="text-xs text-editor-text-muted font-medium flex-shrink-0">Preview</span>
          <div className="flex items-center bg-editor-panel border border-editor-border rounded px-2 h-6 flex-1 max-w-[300px] min-w-[100px]">
            <span className="text-[10px] text-editor-text-dim truncate select-all">
              {serverUrl || 'https://hrdkpen.vercel.app/'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Device selector */}
          <div className="flex items-center border border-editor-border rounded overflow-hidden">
            {([
              ['desktop', <Laptop className="w-3 h-3" />, 'Desktop'],
              ['tablet',  <Tablet className="w-3 h-3" />, 'Tablet'],
              ['mobile',  <Smartphone className="w-3 h-3" />, 'Mobile (375px)'],
            ] as const).map(([mode, icon, label]) => (
              <button
                key={mode}
                onClick={() => setDevice(mode as DeviceMode)}
                title={label}
                className="px-2 py-1 transition-fast"
                style={{
                  background: device === mode ? 'hsl(var(--surface0))' : 'transparent',
                  color: device === mode ? 'hsl(var(--text))' : 'hsl(var(--overlay1))',
                }}
              >
                {icon}
              </button>
            ))}
          </div>

          <button
            onClick={() => setInspectEnabled(v => !v)}
            title="Toggle Inspect (Eruda DevTools)"
            className="px-2 py-1 text-xs rounded transition-fast flex items-center gap-1"
            style={{
              background: inspectEnabled ? 'hsl(var(--blue) / 0.15)' : 'transparent',
              color: inspectEnabled ? 'hsl(var(--blue))' : 'hsl(var(--overlay1))',
            }}
          >
            <Bug className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setAutoRefresh(v => !v)}
            title={autoRefresh ? 'Auto-refresh ON — click to disable' : 'Auto-refresh OFF — click to enable'}
            className="px-2 py-1 text-xs rounded transition-fast"
            style={{
              background: autoRefresh ? 'hsl(var(--green) / 0.15)' : 'transparent',
              color: autoRefresh ? 'hsl(var(--green))' : 'hsl(var(--overlay1))',
            }}
          >
            Auto
          </button>

          <button
            onClick={() => setRefreshKey(k => k + 1)}
            title="Refresh preview"
            className="p-1 rounded hover:bg-editor-active-tab transition-fast text-editor-text-muted hover:text-editor-text"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={download}
            title="Download as HTML"
            className="p-1 rounded hover:bg-editor-active-tab transition-fast text-editor-text-muted hover:text-editor-text"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={openInNewTab}
            title="Open in new tab"
            className="p-1 rounded hover:bg-editor-active-tab transition-fast text-editor-text-muted hover:text-editor-text"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-3 bg-[hsl(var(--crust))]">
        {hasContent ? (
          <div
            className="overflow-hidden rounded border border-editor-border shadow-lg bg-white relative"
            style={{
              width: dim.w,
              height: dim.h === '100%' ? 'calc(100% - 0px)' : dim.h,
              minHeight: dim.h === '100%' ? '100%' : dim.h,
              transition: 'width 0.2s ease, height 0.2s ease',
            }}
          >
            {serverUrl ? (
              <iframe
                key={refreshKey}
                src={serverUrl}
                className="w-full h-full border-0"
                title="Live Server Preview"
                allow="cross-origin-isolated"
              />
            ) : (
              <iframe
                key={refreshKey}
                srcDoc={buildDocument(htmlContent, cssContent, jsContent, inspectEnabled)}
                className="w-full h-full border-0"
                title="Live Preview"
                sandbox="allow-scripts allow-forms allow-popups allow-modals allow-same-origin"
                loading="lazy"
                {...{ credentialless: "true" }}
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center select-none">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center"
              style={{ background: 'hsl(var(--surface0))' }}
            >
              <Monitor className="w-7 h-7 text-editor-text-muted" />
            </div>
            <div>
              <p className="text-sm font-medium text-editor-text mb-1">No content yet</p>
              <p className="text-xs text-editor-text-muted">
                Write HTML, CSS, or JS — preview updates automatically
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};