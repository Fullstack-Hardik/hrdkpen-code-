import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Clock, RotateCcw, FileText, X } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface TimelineEntry {
  id: string;
  timestamp: Date;
  content: string;
  type: 'edit' | 'create' | 'rename';
  description: string;
}

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  language?: string;
  children?: FileNode[];
}

interface FileTimelineProps {
  file: FileNode;
  onRestore?: (content: string) => void;
  onClose: () => void;
}

export const FileTimeline = ({ file, onRestore, onClose }: FileTimelineProps) => {
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);

  useEffect(() => {
    const savedTimeline = localStorage.getItem(`timeline_${file.id}`);
    if (savedTimeline) {
      const parsed = JSON.parse(savedTimeline);
      setTimeline(parsed.map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp)
      })));
    }
  }, [file.id]);

  const handleRestore = (entry: TimelineEntry) => {
    if (onRestore) {
      onRestore(entry.content);
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-background via-background/95 to-background/90 backdrop-blur-sm border-t border-border shadow-2xl z-50 animate-slide-up">
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/50">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">Timeline: {file.name}</h3>
            <Badge variant="secondary" className="text-xs">
              {timeline.length} changes
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4">
          {timeline.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Clock className="w-12 h-12 mb-2 opacity-20" />
              <p className="text-sm">No timeline history yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {timeline.map((entry, index) => (
                <Card key={entry.id} className="p-3 hover:shadow-lg transition-all border-l-4 border-l-primary">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">
                          {entry.timestamp.toLocaleString()}
                        </span>
                        <Badge variant={entry.type === 'edit' ? 'default' : 'secondary'} className="text-xs px-1.5 py-0">
                          {entry.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground">{entry.description}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(entry)}
                      className="h-7 text-xs shrink-0"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Restore
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};