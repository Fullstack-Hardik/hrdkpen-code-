import React from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';

interface IframePanelProps {
  title: string;
  url: string;
  icon: React.ReactNode;
}

export const IframePanel = ({ title, url, icon }: IframePanelProps) => {
  const handleRefresh = () => {
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
          <button
            onClick={handleRefresh}
            className="p-1.5 text-editor-text-muted hover:text-editor-text hover:bg-editor-active-tab rounded transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
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
      <div className="flex-1 bg-white relative">
        {/* We use bg-white to ensure third-party iframes render correctly if they don't have a background set */}
        <iframe
          id={`iframe-${title}`}
          src={url}
          className="w-full h-full border-none absolute inset-0"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads"
        />
      </div>
    </div>
  );
};
