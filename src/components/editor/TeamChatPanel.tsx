import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Send, 
  Users, 
  Trash2,
  Settings,
  UserPlus
} from 'lucide-react';

interface Message {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
  type: 'message' | 'system';
}

interface TeamChatPanelProps {
  roomId?: string;
  currentUser?: { id: string; name: string };
  onInvite?: () => void;
}

export const TeamChatPanel = ({ 
  roomId,
  currentUser = { id: 'user-1', name: 'You' },
  onInvite
}: TeamChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(`team_chat_${roomId || 'default'}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
      } catch {
        return [];
      }
    }
    return [];
  });
  const [input, setInput] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<string[]>([currentUser.name]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(`team_chat_${roomId || 'default'}`, JSON.stringify(messages));
  }, [messages, roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      content: input.trim(),
      timestamp: new Date(),
      type: 'message'
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(`team_chat_${roomId || 'default'}`);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-950/30 via-editor-panel to-purple-950/30">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-blue-500/30 bg-gradient-to-r from-blue-900/50 to-purple-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/50">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-editor-panel"></div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Team Chat
            </h3>
            <p className="text-xs text-blue-300/70 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {onlineUsers.length} online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onInvite && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onInvite}
              className="h-7 px-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30"
              title="Invite Member"
            >
              <UserPlus className="w-3 h-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearChat}
            className="h-7 px-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30"
            title="Clear Chat"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Online Users */}
      <div className="px-3 py-2 border-b border-blue-500/20 bg-blue-900/20">
        <div className="flex items-center gap-2 flex-wrap">
          {onlineUsers.map((user, index) => (
            <Badge 
              key={index} 
              variant="secondary" 
              className="text-xs bg-blue-500/20 text-blue-300 border-blue-500/30"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></div>
              {user}
            </Badge>
          ))}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-3 shadow-lg shadow-blue-500/30">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-editor-text mb-2">Team Chat</h3>
            <p className="text-xs text-editor-text-muted">
              Start collaborating with your team
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.userId === currentUser.id ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${
                  msg.type === 'system' 
                    ? 'w-full text-center' 
                    : msg.userId === currentUser.id
                    ? ''
                    : ''
                }`}>
                  {msg.type === 'system' ? (
                    <div className="text-xs text-editor-text-muted italic py-1">
                      {msg.content}
                    </div>
                  ) : (
                    <div className={`rounded-lg px-3 py-2 ${
                      msg.userId === currentUser.id
                        ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white'
                        : 'bg-editor-active-tab text-editor-text border border-blue-500/30'
                    }`}>
                      <div className="text-xs opacity-70 mb-1">
                        {msg.userName} • {msg.timestamp.toLocaleTimeString()}
                      </div>
                      <div className="text-sm whitespace-pre-wrap break-words">
                        {msg.content}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-blue-500/30 bg-blue-900/20">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-editor-panel/50 border-blue-500/30 text-editor-text focus:border-blue-500"
          />
          <Button 
            onClick={sendMessage}
            disabled={!input.trim()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
