import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Send, 
  MessageSquare, 
  Users, 
  Wifi, 
  WifiOff,
  Settings,
  Bell,
  Clock
} from 'lucide-react';

interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  message: string;
  message_type: 'text' | 'file' | 'notification';
  created_at: string;
}

interface Notification {
  id: string;
  room_id: string;
  user_id: string;
  notification_type: 'joined' | 'left' | 'connected' | 'disconnected';
  message: string;
  created_at: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  display_name: string;
  role: 'host' | 'guest';
  is_online: boolean;
}

interface TeamChatProps {
  messages: ChatMessage[];
  notifications: Notification[];
  teamMembers: TeamMember[];
  currentUserId?: string;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  onSendMessage: (message: string) => void;
  onOpenSettings?: () => void;
}

export const TeamChat = ({
  messages,
  notifications,
  teamMembers,
  currentUserId,
  connectionStatus,
  onSendMessage,
  onOpenSettings
}: TeamChatProps) => {
  const [input, setInput] = useState('');
  const [showNotifications, setShowNotifications] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, notifications]);

  const handleSend = () => {
    const message = input.trim();
    if (!message) return;

    onSendMessage(message);
    setInput('');
  };

  const getMemberName = (userId: string) => {
    const member = teamMembers.find(m => m.user_id === userId);
    return member?.display_name || 'Unknown User';
  };

  const getMemberRole = (userId: string) => {
    const member = teamMembers.find(m => m.user_id === userId);
    return member?.role || 'guest';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'connecting':
        return <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return `Connected • ${teamMembers.filter(m => m.is_online).length} online`;
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
    }
  };

  const combinedItems = [
    ...messages.map(m => ({ ...m, type: 'message' as const })),
    ...(showNotifications ? notifications.map(n => ({ ...n, type: 'notification' as const })) : [])
  ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  return (
    <div className="flex flex-col h-full bg-editor-panel">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-editor-sidebar">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-editor-text">Team Chat</h3>
            <div className="flex items-center gap-1 text-xs text-editor-text-muted">
              {getConnectionIcon()}
              <span>{getStatusText()}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNotifications(!showNotifications)}
            className="h-7 px-2"
            title={showNotifications ? "Hide Notifications" : "Show Notifications"}
          >
            <Bell className={`w-3 h-3 ${showNotifications ? 'text-blue-500' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenSettings}
            className="h-7 px-2"
            title="Settings"
          >
            <Settings className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Team Members */}
      <div className="p-2 border-b border-border bg-editor-sidebar/30">
        <div className="flex items-center gap-1 mb-2">
          <Users className="w-3 h-3 text-editor-text-muted" />
          <span className="text-xs text-editor-text-muted">
            {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {teamMembers.map((member) => (
            <div key={member.id} className="flex items-center gap-1">
              <div className="relative">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-xs bg-editor-active-tab">
                    {getInitials(member.display_name)}
                  </AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-editor-panel ${
                  member.is_online ? 'bg-green-500' : 'bg-gray-400'
                }`} />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-editor-text">{member.display_name}</span>
                {member.role === 'host' && (
                  <Badge variant="secondary" className="text-xs px-1 py-0">Host</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3">
        {combinedItems.length === 0 && (
          <div className="text-center text-editor-text-muted py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full mx-auto mb-3 flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-editor-text mb-2">Team Chat</h3>
            <p className="text-sm">Start collaborating with your team!</p>
          </div>
        )}
        
        <div className="space-y-3">
          {combinedItems.map((item) => {
            if (item.type === 'notification') {
              return (
                <div key={item.id} className="flex justify-center">
                  <div className="bg-editor-active-tab border border-editor-border rounded-full px-3 py-1">
                    <div className="flex items-center gap-2 text-xs text-editor-text-muted">
                      <Clock className="w-3 h-3" />
                      <span>{item.message}</span>
                      <span>{formatTime(item.created_at)}</span>
                    </div>
                  </div>
                </div>
              );
            }

            const isOwnMessage = item.user_id === currentUserId;
            return (
              <div key={item.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] ${
                  isOwnMessage 
                    ? 'bg-blue-600 text-white rounded-lg rounded-br-sm' 
                    : 'bg-editor-active-tab text-editor-text border border-editor-border rounded-lg rounded-bl-sm'
                }`}>
                  {!isOwnMessage && (
                    <div className="px-3 pt-2 pb-1 border-b border-editor-border/50">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-5 h-5">
                          <AvatarFallback className="text-xs">
                            {getInitials(getMemberName(item.user_id))}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium">{getMemberName(item.user_id)}</span>
                        {getMemberRole(item.user_id) === 'host' && (
                          <Badge variant="secondary" className="text-xs px-1 py-0">Host</Badge>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="px-3 py-2">
                    <div className="text-sm whitespace-pre-wrap">{item.message}</div>
                    <div className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-editor-text-muted'}`}>
                      {formatTime(item.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border bg-editor-sidebar p-3">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={connectionStatus === 'connected' ? "Type a message..." : "Connect to chat"}
            className="flex-1 bg-editor-panel border-editor-border text-editor-text placeholder:text-editor-text-muted"
            disabled={connectionStatus !== 'connected'}
          />
          <Button 
            onClick={handleSend} 
            disabled={connectionStatus !== 'connected' || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};