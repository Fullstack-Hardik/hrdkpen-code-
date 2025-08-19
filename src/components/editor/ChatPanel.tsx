import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  KeyRound, 
  Sparkles, 
  Copy, 
  RotateCcw, 
  Check, 
  Paperclip, 
  Plus, 
  Trash2,
  MessageSquare,
  Youtube,
  X
} from 'lucide-react';

interface ChatPanelProps {
  getActiveContext: () => { fileName?: string; code?: string };
  onYouTubePlay?: (url: string) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  name: string;
  messages: Message[];
  createdAt: Date;
}

export const ChatPanel = ({ getActiveContext, onYouTubePlay }: ChatPanelProps) => {
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('gemini_api_key') || '');
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('chat_sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          messages: s.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }))
        }));
      } catch {
        return [];
      }
    }
    return [];
  });
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  useEffect(() => {
    localStorage.setItem('gemini_api_key', apiKey);
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem('chat_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (sessions.length === 0) {
      createNewSession();
    }
  }, []);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      name: `Chat ${sessions.length + 1}`,
      messages: [],
      createdAt: new Date()
    };
    setSessions(prev => [...prev, newSession]);
    setCurrentSessionId(newSession.id);
  };

  const deleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      const remaining = sessions.filter(s => s.id !== sessionId);
      setCurrentSessionId(remaining[0]?.id || '');
      if (remaining.length === 0) {
        createNewSession();
      }
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const applyCode = (content: string) => {
    // Extract code blocks and apply them
    const codeBlocks = content.match(/```[\s\S]*?```/g);
    if (codeBlocks) {
      console.log('Code blocks found:', codeBlocks);
      // In a real implementation, this would apply the code to the editor
    }
  };

  const send = async () => {
    const text = input.trim();
    if (!text || !currentSessionId) return;
    
    const ctx = getActiveContext();
    const userMsg: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: text,
      timestamp: new Date()
    };
    
    setSessions(prev => prev.map(session => 
      session.id === currentSessionId 
        ? { ...session, messages: [...session.messages, userMsg] }
        : session
    ));
    setInput('');

    if (!apiKey) {
      const fallback: Message = { 
        id: Date.now() + '-a', 
        role: 'assistant', 
        content: 'Add your Gemini API key to use AI.',
        timestamp: new Date()
      };
      setSessions(prev => prev.map(session => 
        session.id === currentSessionId 
          ? { ...session, messages: [...session.messages, fallback] }
          : session
      ));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: `You are helping with code. Active file: ${ctx.fileName || 'N/A'}.\n\nCode:\n${ctx.code || ''}\n\nTask: ${text}` }] }
          ]
        })
      });
      const data = await res.json();
      const content = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.';
      const assistantMsg: Message = { 
        id: Date.now() + '-b', 
        role: 'assistant', 
        content,
        timestamp: new Date()
      };
      setSessions(prev => prev.map(session => 
        session.id === currentSessionId 
          ? { ...session, messages: [...session.messages, assistantMsg] }
          : session
      ));
    } catch (e) {
      const errorMsg: Message = { 
        id: Date.now() + '-e', 
        role: 'assistant', 
        content: 'Error calling Gemini.',
        timestamp: new Date()
      };
      setSessions(prev => prev.map(session => 
        session.id === currentSessionId 
          ? { ...session, messages: [...session.messages, errorMsg] }
          : session
      ));
    } finally {
      setLoading(false);
    }
  };

  const handleYouTubeSubmit = () => {
    if (youtubeUrl.trim() && onYouTubePlay) {
      onYouTubePlay(youtubeUrl.trim());
      setYoutubeUrl('');
      setShowYoutubeInput(false);
    }
  };

  const renderMessage = (content: string) => {
    // Simple code block highlighting
    return content.split(/```(\w+)?\n([\s\S]*?)```/).map((part, index) => {
      if (index % 3 === 2) {
        // This is code content
        return (
          <pre key={index} className="bg-gray-900 text-green-400 p-3 rounded mt-2 mb-2 overflow-auto text-sm">
            <code>{part}</code>
          </pre>
        );
      } else if (index % 3 === 1) {
        // This is language identifier, skip
        return null;
      } else {
        // This is regular text
        return <span key={index}>{part}</span>;
      }
    });
  };

  return (
    <div className="flex flex-col h-full bg-editor-panel" style={{ userSelect: 'text' }}>
      {/* Header with API Key and Sessions */}
      <div className="border-b border-border bg-editor-sidebar">
        <div className="flex items-center gap-2 px-3 py-2">
          <KeyRound className="w-4 h-4 text-editor-accent" />
          <input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter Gemini API Key"
            className="flex-1 h-7 rounded bg-editor-panel border border-editor-border px-2 text-xs text-editor-text placeholder:text-editor-text-dim"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={createNewSession}
            className="h-7 px-2"
            title="New Chat"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
        
        {/* Session Tabs */}
        {sessions.length > 1 && (
          <div className="flex items-center gap-1 px-2 pb-2 overflow-x-auto">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center">
                <Button
                  variant={currentSessionId === session.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentSessionId(session.id)}
                  className="h-6 px-2 text-xs"
                >
                  <MessageSquare className="w-3 h-3 mr-1" />
                  {session.name}
                </Button>
                {sessions.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteSession(session.id)}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3">
        {messages.length === 0 && (
          <div className="text-center text-editor-text-muted py-8">
            <div className="mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-editor-accent to-editor-purple rounded-full mx-auto mb-3 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-editor-text mb-2">AI Assistant</h3>
              <p className="text-sm">Ask me about your code, get suggestions, or request optimizations!</p>
            </div>
            <div className="text-xs text-editor-text-dim space-y-1">
              <p>Try: "Explain this function"</p>
              <p>Try: "Optimize this code"</p>
              <p>Try: "Add error handling"</p>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg ${
                m.role === 'user' 
                  ? 'bg-editor-accent text-white' 
                  : 'bg-editor-active-tab text-editor-text border border-editor-border'
              }`}>
                <div className="px-3 py-2">
                  <div className="whitespace-pre-wrap text-sm font-sans">
                    {renderMessage(m.content)}
                  </div>
                  <div className="text-xs opacity-60 mt-1">
                    {m.timestamp.toLocaleTimeString()}
                  </div>
                </div>
                
                {m.role === 'assistant' && (
                  <div className="flex items-center gap-1 px-3 pb-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyMessage(m.content)}
                      className="h-6 px-2 text-xs"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => applyCode(m.content)}
                      className="h-6 px-2 text-xs"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Apply
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setInput(`Rewrite: ${m.content.slice(0, 50)}...`);
                        inputRef.current?.focus();
                      }}
                      className="h-6 px-2 text-xs"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Rewrite
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-editor-active-tab border border-editor-border px-3 py-2 rounded-lg">
                <div className="flex items-center gap-2 text-editor-text-muted">
                  <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  <span className="text-xs ml-1">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* YouTube Input */}
      {showYoutubeInput && (
        <div className="border-t border-border p-3 bg-editor-sidebar">
          <div className="flex gap-2">
            <Input
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="Enter YouTube URL..."
              className="flex-1 bg-editor-panel border-editor-border text-editor-text"
              onKeyDown={(e) => e.key === 'Enter' && handleYouTubeSubmit()}
            />
            <Button onClick={handleYouTubeSubmit} disabled={!youtubeUrl.trim()}>
              <Youtube className="w-4 h-4" />
            </Button>
            <Button variant="ghost" onClick={() => setShowYoutubeInput(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border bg-editor-sidebar">
        <div className="flex gap-2 p-3">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!loading) send();
              }
            }}
            placeholder="Ask AI about your code... (Shift+Enter for new line)"
            className="flex-1 bg-editor-panel border-editor-border text-editor-text placeholder:text-editor-text-dim min-h-[60px] max-h-[120px] resize-none"
            disabled={loading}
          />
          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowYoutubeInput(!showYoutubeInput)}
              className="h-8 px-2"
              title="YouTube Player"
            >
              <Youtube className="w-4 h-4" />
            </Button>
            <Button 
              onClick={send} 
              disabled={loading || !input.trim() || !currentSessionId}
              className="bg-editor-accent hover:bg-editor-accent/80 text-white h-8 px-3"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
