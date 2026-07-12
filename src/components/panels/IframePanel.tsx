import React, { useState, useEffect } from 'react';
import { ExternalLink, RefreshCw, AlertCircle, Maximize2 } from 'lucide-react';

interface IframePanelProps {
  title: string;
  url: string;
  icon: React.ReactNode;
}

export const IframePanel = ({ title, url, icon }: IframePanelProps) => {
  const [isBlocked, setIsBlocked] = useState(false);

  // Some sites are known to block iframes via X-Frame-Options or CSP frame-ancestors.
  // Since we cannot read HTTP headers from the frontend (CORS), we use a known list,
  // or provide a manual fallback if it fails.
  useEffect(() => {
    if (url.includes('excalidraw.com') || url.includes('github.com')) {
      setIsBlocked(true);
    } else {
      setIsBlocked(false);
    }
  }, [url]);

  const handleRefresh = () => {
    if (isBlocked) return;
    const iframe = document.getElementById(`iframe-${title}`) as HTMLIFrameElement;
    if (iframe) iframe.src = iframe.src;
  };

  return (
    <div className="flex flex-col h-full bg-editor-bg">
      <div className="flex items-center justify-between px-4 py-2 border-b border-editor-border bg-editor-sidebar flex-shrink-0">
        <div className="flex items-center gap-2 text-editor-text font-medium text-sm">
          {icon}
          {title}
        </div>
        <div className="flex items-center gap-1">
          {!isBlocked && (
            <button
              onClick={handleRefresh}
              className="p-1.5 text-editor-text-muted hover:text-editor-text hover:bg-editor-active-tab rounded transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-editor-text-muted hover:text-editor-text hover:bg-editor-active-tab rounded transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
      <div className="flex-1 relative flex items-center justify-center bg-editor-bg">
        {isBlocked ? (
          <div className="flex flex-col items-center justify-center text-center max-w-sm p-6 rounded-2xl border border-editor-border bg-editor-panel shadow-2xl animate-fade-in">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 border border-blue-500/20">
              <Maximize2 className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-editor-text mb-2">Open in New Tab</h3>
            <p className="text-sm text-editor-text-muted mb-6 leading-relaxed">
              For security reasons, {title} cannot be embedded directly inside the IDE. 
              It must be opened in a separate browser tab to function correctly.
            </p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              Open {title}
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <div className="absolute inset-0 bg-white">
            <iframe
              id={`iframe-${title}`}
              src={url}
              className="w-full h-full border-none absolute inset-0"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads"
            />
          </div>
        )}
      </div>
    </div>
  );
};
