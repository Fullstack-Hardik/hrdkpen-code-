import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  Link as LinkIcon,
  Copy,
  Users,
  UserMinus,
  X,
  Shield,
  MessageSquare,
  Activity,
  Crown,
  UserX
} from 'lucide-react';
import { FileNode } from './ModernFileExplorer';

interface TeamMember {
  id: string;
  name: string;
  role: 'host' | 'guest';
  isActive: boolean;
}

interface TeamShareLinkProps {
  isHost: boolean;
  shareLink?: string;
  members: TeamMember[];
  onKick?: (memberId: string) => void;
  onLeave?: () => void;
  onClose: () => void;
}

export const TeamShareLink = ({
  isHost,
  shareLink,
  members,
  onKick,
  onLeave,
  onClose
}: TeamShareLinkProps) => {
  const { toast } = useToast();
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ user: string; message: string; time: string }>>([]);

  const copyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      toast({
        title: 'Link Copied',
        description: 'Share this link with your team',
      });
    }
  };

  const handleKick = (memberId: string) => {
    if (onKick) {
      onKick(memberId);
      toast({
        title: 'Member Removed',
        description: 'User has been removed from the session',
      });
    }
  };

  const sendMessage = () => {
    if (chatMessage.trim()) {
      const newMessage = {
        user: isHost ? 'Host' : 'Guest',
        message: chatMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, newMessage]);
      setChatMessage('');
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-gradient-to-b from-background via-background/98 to-background border-l border-border shadow-2xl z-50 flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Team Session</h3>
              <p className="text-xs text-muted-foreground">
                {isHost ? 'Host' : 'Guest'} Mode
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Share Link */}
        {isHost && shareLink && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Share Link</p>
            <div className="flex gap-2">
              <Input
                value={shareLink}
                readOnly
                className="flex-1 text-xs h-8 bg-muted"
              />
              <Button
                onClick={copyLink}
                size="sm"
                variant="outline"
                className="h-8 px-2"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Tab Buttons */}
      <div className="flex border-b border-border bg-card/30">
        <Button
          variant={!showChat ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setShowChat(false)}
          className="flex-1 rounded-none h-9 text-xs"
        >
          <Users className="w-3 h-3 mr-1.5" />
          Members ({members.length})
        </Button>
        <Button
          variant={showChat ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setShowChat(true)}
          className="flex-1 rounded-none h-9 text-xs"
        >
          <MessageSquare className="w-3 h-3 mr-1.5" />
          Chat
        </Button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {!showChat ? (
          // Members List
          <ScrollArea className="h-full p-4">
            <div className="space-y-2">
              {members.map((member) => (
                <Card key={member.id} className="p-3 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        member.role === 'host' 
                          ? 'bg-gradient-to-br from-purple-500 to-pink-600' 
                          : 'bg-gradient-to-br from-blue-500 to-cyan-600'
                      }`}>
                        {member.role === 'host' ? (
                          <Crown className="w-5 h-5 text-white" />
                        ) : (
                          <Users className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{member.name}</p>
                          {member.isActive && (
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground capitalize">
                          {member.role}
                        </p>
                      </div>
                    </div>

                    {isHost && member.role === 'guest' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleKick(member.id)}
                        className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <UserX className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {/* Session Info */}
            <Card className="mt-4 p-3 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-medium text-blue-900 dark:text-blue-100">Session Protected</p>
                  <p className="text-blue-700 dark:text-blue-300">
                    • Guests can view and edit files
                  </p>
                  <p className="text-blue-700 dark:text-blue-300">
                    • Guests cannot delete files
                  </p>
                  <p className="text-blue-700 dark:text-blue-300">
                    • Host can undo all changes
                  </p>
                  <p className="text-blue-700 dark:text-blue-300">
                    • Session persists on reload
                  </p>
                </div>
              </div>
            </Card>
          </ScrollArea>
        ) : (
          // Chat Area
          <div className="h-full flex flex-col">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
                    <MessageSquare className="w-12 h-12 mb-2 opacity-20" />
                    <p className="text-sm">No messages yet</p>
                  </div>
                ) : (
                  chatMessages.map((msg, index) => (
                    <div key={index} className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-primary">{msg.user}</span>
                        <span className="text-xs text-muted-foreground">{msg.time}</span>
                      </div>
                      <Card className="p-2 bg-card/50">
                        <p className="text-sm">{msg.message}</p>
                      </Card>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            <div className="p-3 border-t border-border bg-card/30">
              <div className="flex gap-2">
                <Input
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 text-sm h-9"
                />
                <Button
                  onClick={sendMessage}
                  size="sm"
                  disabled={!chatMessage.trim()}
                  className="h-9 px-3"
                >
                  Send
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Leave Button */}
      {!isHost && onLeave && (
        <div className="p-3 border-t border-border bg-card/30">
          <Button
            variant="destructive"
            size="sm"
            onClick={onLeave}
            className="w-full h-9"
          >
            <UserMinus className="w-4 h-4 mr-2" />
            Leave Session
          </Button>
        </div>
      )}
    </div>
  );
};