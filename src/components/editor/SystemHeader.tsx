import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { SettingsModal } from './SettingsModal';
import { TeamCodeSettings } from './TeamCodeSettings';
import { 
  Clock, 
  Search,
  ExternalLink,
  Download,
  Globe,
  Terminal as TerminalIcon,
  FileDown,
  Users
} from 'lucide-react';

interface SystemHeaderProps {
  onExport?: () => void;
  onPublish?: () => void;
  onToggleTerminal?: () => void;
  onDownloadCurrent?: () => void;
}

export const SystemHeader = ({ 
  onExport, 
  onPublish, 
  onToggleTerminal,
  onDownloadCurrent
}: SystemHeaderProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showTeamModal, setShowTeamModal] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const openExternalLink = (url: string) => {
    window.open(url, '_blank');
  };

  const handlePublish = () => {
    window.open('https://getlivenow.lovable.app', '_blank');
  };

  return (
    <header className="editor-header border-b border-border px-4 py-2 flex items-center justify-between bg-gradient-to-r from-editor-sidebar to-editor-panel">
      {/* Left Section - App Title */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <i className="fas fa-code text-white text-sm" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            HRDKPEN
          </h1>
        </div>
        
        <div className="hidden md:flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => openExternalLink('https://developer.mozilla.org')}
            className="text-editor-text-muted hover:text-editor-text hover:bg-editor-panel/50"
          >
            <i className="fab fa-html5 mr-1" />
            MDN Docs
            <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => openExternalLink('https://excalidraw.com')}
            className="text-editor-text-muted hover:text-editor-text hover:bg-editor-panel/50"
          >
            <i className="fas fa-draw-polygon mr-1" />
            Excalidraw
            <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </div>

      {/* Center Section - Team Collaboration */}
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowTeamModal(true)}
          className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30 hover:from-blue-500/20 hover:to-purple-500/20 text-editor-text hover:border-blue-400/50 transition-all duration-200"
        >
          <Users className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Team</span>
        </Button>
      </div>

      {/* Right Section - Actions and Time */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onDownloadCurrent}
            className="text-editor-text-muted hover:text-editor-text hover:bg-editor-panel/50"
            title="Download Current File"
          >
            <FileDown className="w-4 h-4" />
          </Button>

          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handlePublish}
            className="text-editor-text-muted hover:text-editor-text hover:bg-editor-panel/50"
            title="Publish to getlivenow.lovable.app"
          >
            <Globe className="w-4 h-4" />
          </Button>

          <Button 
            variant="ghost" 
            size="sm"
            onClick={onToggleTerminal}
            className="text-editor-text-muted hover:text-editor-text hover:bg-editor-panel/50"
            title="Terminal"
          >
            <TerminalIcon className="w-4 h-4" />
          </Button>
          
          <div className="flex items-center gap-2 px-2">
            <Clock className="w-4 h-4 text-editor-text-muted" />
            <span className="text-sm font-mono text-editor-text">
              {currentTime.toLocaleTimeString()}
            </span>
          </div>
        </div>
        
        <SettingsModal />
      </div>
      
      {/* Team Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowTeamModal(false)}>
          <div className="bg-editor-panel border border-border rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <TeamCodeSettings />
            <Button 
              variant="outline" 
              onClick={() => setShowTeamModal(false)}
              className="w-full mt-6"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};