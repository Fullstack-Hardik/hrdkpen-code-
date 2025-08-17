import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Cpu, 
  HardDrive, 
  Clock, 
  Battery, 
  Wifi, 
  Settings,
  Search,
  ExternalLink
} from 'lucide-react';

export const SystemHeader = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [systemInfo, setSystemInfo] = useState({
    cpu: '45%',
    memory: '67%',
    battery: '89%',
    connected: true
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Simulate system metrics updates
    const metricsTimer = setInterval(() => {
      setSystemInfo({
        cpu: `${Math.floor(Math.random() * 60 + 20)}%`,
        memory: `${Math.floor(Math.random() * 40 + 50)}%`,
        battery: `${Math.floor(Math.random() * 20 + 80)}%`,
        connected: Math.random() > 0.1
      });
    }, 5000);

    return () => {
      clearInterval(timer);
      clearInterval(metricsTimer);
    };
  }, []);

  const openExternalLink = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <header className="editor-header border-b border-border px-4 py-2 flex items-center justify-between">
      {/* Left Section - App Title */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <i className="fas fa-code text-editor-accent text-lg" />
          <h1 className="text-lg font-bold text-editor-text">Smart Code Editor</h1>
        </div>
        
        <div className="hidden md:flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => openExternalLink('https://developer.mozilla.org')}
            className="text-editor-text-muted hover:text-editor-text"
          >
            <i className="fab fa-html5 mr-1" />
            MDN Docs
            <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => openExternalLink('https://excalidraw.com')}
            className="text-editor-text-muted hover:text-editor-text"
          >
            <i className="fas fa-draw-polygon mr-1" />
            Excalidraw
            <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => openExternalLink('https://google.com')}
            className="text-editor-text-muted hover:text-editor-text"
          >
            <Search className="w-3 h-3 mr-1" />
            Search
          </Button>
        </div>
      </div>

      {/* Center Section - System Info */}
      <div className="hidden lg:flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-editor-accent" />
          <Badge variant="secondary" className="text-xs">
            CPU: {systemInfo.cpu}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-editor-success" />
          <Badge variant="secondary" className="text-xs">
            RAM: {systemInfo.memory}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Battery className="w-4 h-4 text-editor-warning" />
          <Badge variant="secondary" className="text-xs">
            {systemInfo.battery}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Wifi className={`w-4 h-4 ${systemInfo.connected ? 'text-editor-success' : 'text-editor-error'}`} />
          <Badge variant={systemInfo.connected ? "secondary" : "destructive"} className="text-xs">
            {systemInfo.connected ? 'Online' : 'Offline'}
          </Badge>
        </div>
      </div>

      {/* Right Section - Time and Settings */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2">
          <Clock className="w-4 h-4 text-editor-text-muted" />
          <span className="text-sm font-mono text-editor-text">
            {currentTime.toLocaleTimeString()}
          </span>
        </div>
        
        <Button variant="ghost" size="sm" className="text-editor-text-muted hover:text-editor-text">
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
};