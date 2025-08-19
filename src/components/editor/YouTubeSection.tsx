import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Youtube, 
  Play, 
  X, 
  History,
  Trash2
} from 'lucide-react';

interface YouTubeSectionProps {
  onPlayVideo: (url: string) => void;
}

interface VideoHistory {
  id: string;
  url: string;
  title: string;
  timestamp: Date;
}

export const YouTubeSection = ({ onPlayVideo }: YouTubeSectionProps) => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [history, setHistory] = useState<VideoHistory[]>(() => {
    const saved = localStorage.getItem('youtube_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
      } catch {
        return [];
      }
    }
    return [];
  });

  const getVideoTitle = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)?.[1];
    return videoId ? `Video ${videoId.slice(0, 8)}...` : 'Unknown Video';
  };

  const handlePlay = () => {
    if (youtubeUrl.trim()) {
      const videoItem: VideoHistory = {
        id: Date.now().toString(),
        url: youtubeUrl.trim(),
        title: getVideoTitle(youtubeUrl.trim()),
        timestamp: new Date()
      };
      
      const updatedHistory = [videoItem, ...history.filter(h => h.url !== youtubeUrl.trim())].slice(0, 20);
      setHistory(updatedHistory);
      localStorage.setItem('youtube_history', JSON.stringify(updatedHistory));
      
      onPlayVideo(youtubeUrl.trim());
      setYoutubeUrl('');
    }
  };

  const playFromHistory = (url: string) => {
    onPlayVideo(url);
  };

  const removeFromHistory = (id: string) => {
    const updatedHistory = history.filter(h => h.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('youtube_history', JSON.stringify(updatedHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('youtube_history');
  };

  return (
    <div className="flex flex-col h-full bg-editor-panel">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-editor-sidebar">
        <Youtube className="w-4 h-4 text-red-500" />
        <span className="text-sm font-medium text-editor-text">YouTube Player</span>
      </div>

      {/* Input Section */}
      <div className="p-3 border-b border-border">
        <div className="flex gap-2">
          <Input
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="Enter YouTube URL..."
            className="flex-1 bg-editor-panel border-editor-border text-editor-text"
            onKeyDown={(e) => e.key === 'Enter' && handlePlay()}
          />
          <Button 
            onClick={handlePlay} 
            disabled={!youtubeUrl.trim()}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            <Play className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* History Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-editor-text-muted" />
            <span className="text-xs font-medium text-editor-text">Recent Videos</span>
          </div>
          {history.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              className="h-6 px-2 text-xs text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1">
          {history.length === 0 ? (
            <div className="p-4 text-center text-editor-text-muted">
              <Youtube className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No videos played yet</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {history.map((item) => (
                <div 
                  key={item.id}
                  className="flex items-center gap-2 p-2 rounded hover:bg-editor-active-tab group"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => playFromHistory(item.url)}
                    className="flex-1 justify-start h-auto p-1 text-left"
                  >
                    <div>
                      <div className="text-xs font-medium text-editor-text truncate">
                        {item.title}
                      </div>
                      <div className="text-xs text-editor-text-muted">
                        {item.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromHistory(item.id)}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};