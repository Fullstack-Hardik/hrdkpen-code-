import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  KeyRound, 
  Sparkles, 
  Copy, 
  RotateCcw, 
  Check, 
  Settings,
  Youtube,
  Trash2,
  Plus
} from 'lucide-react';

interface SimpleChatPanelProps {
  getActiveContext: () => { fileName?: string; code?: string };
  onYouTubePlay?: (url: string) => void;
  onOpenSettings?: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const SimpleChatPanel = ({ getActiveContext, onYouTubePlay, onOpenSettings }: SimpleChatPanelProps) => {
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('gemini_api_key') || '');
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('chat_messages');
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
  const [loading, setLoading] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('gemini_api_key', apiKey);
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem('chat_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const clearChat = () => {
    setMessages([]);
  };

  const copyMessage = (content: string) => {
    const codeBlocks = content.match(/```[\s\S]*?```/g);
    if (codeBlocks && codeBlocks.length > 0) {
      const codeContent = codeBlocks.map(block => 
        block.replace(/```\w*\n?/, '').replace(/```$/, '')
      ).join('\n\n');
      navigator.clipboard.writeText(codeContent);
    } else {
      navigator.clipboard.writeText(content);
    }
  };

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    
    const ctx = getActiveContext();
    const userMsg: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: text,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    if (!apiKey) {
      const fallback: Message = { 
        id: Date.now() + '-a', 
        role: 'assistant', 
        content: 'Please add your Gemini API key in the settings to use AI assistance.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, fallback]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: `You are a helpful coding assistant. Active file: ${ctx.fileName || 'N/A'}.\n\nCode:\n${ctx.code || ''}\n\nUser request: ${text}` }] }
          ]
        })
      });
      
      if (!res.ok) {
        throw new Error(`API Error: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'API returned an error');
      }
      const content = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received.';
      const assistantMsg: Message = { 
        id: Date.now() + '-b', 
        role: 'assistant', 
        content,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e) {
      const errorMsg: Message = { 
        id: Date.now() + '-e', 
        role: 'assistant', 
        content: 'Error connecting to Gemini API. Please check your API key.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
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
    return content.split(/```(\w+)?\n([\s\S]*?)```/).map((part, index) => {
      if (index % 3 === 2) {
        return (
          <div key={index} className="relative group mt-2 mb-2">
            <pre className="bg-gray-900 text-green-400 p-3 rounded overflow-auto text-sm">
              <code>{part}</code>
            </pre>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigator.clipboard.writeText(part)}
                className="h-6 px-2 bg-gray-800 hover:bg-gray-700"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
        );
      } else if (index % 3 === 1) {
        return null;
      } else {
        return <span key={index}>{part}</span>;
      }
    });
  };

  return (
    <div className="flex flex-col h-full bg-editor-panel">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-editor-sidebar">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-editor-text">AI Assistant</h3>
            <p className="text-xs text-editor-text-muted">Powered by Gemini</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearChat}
            className="h-7 px-2"
            title="Clear Chat"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowYoutubeInput(!showYoutubeInput)}
            className="h-7 px-2"
            title="YouTube Player"
          >
            <Youtube className="w-3 h-3" />
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

      {/* API Key Input */}
      <div className="p-2 border-b border-border bg-editor-sidebar/50">
        <div className="flex items-center gap-2">
          <KeyRound className="w-3 h-3 text-editor-accent" />
          <input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter Gemini API Key"
            className="flex-1 h-6 rounded bg-editor-panel border border-editor-border px-2 text-xs text-editor-text placeholder:text-editor-text-muted"
            type="password"
          />
        </div>
      </div>

      {/* YouTube Input */}
      {showYoutubeInput && (
        <div className="p-2 border-b border-border bg-editor-sidebar/50">
          <div className="flex gap-2">
            <input
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="Enter YouTube URL..."
              className="flex-1 h-6 rounded bg-editor-panel border border-editor-border px-2 text-xs text-editor-text"
              onKeyDown={(e) => e.key === 'Enter' && handleYouTubeSubmit()}
            />
            <Button size="sm" onClick={handleYouTubeSubmit} disabled={!youtubeUrl.trim()} className="h-6 px-2">
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-3">
        {messages.length === 0 && (
          <div className="text-center text-editor-text-muted py-8">
            <div className="mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-3 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-editor-text mb-2">AI Assistant Ready</h3>
              <p className="text-sm">Ask me about your code, get suggestions, or request help!</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInput("Fix bug: ")}
                className="h-8 justify-start"
              >
                Fix bug
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInput("Create component: ")}
                className="h-8 justify-start"
              >
                Create component
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInput("What is ")}
                className="h-8 justify-start"
              >
                What is...
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInput("Optimize this code")}
                className="h-8 justify-start"
              >
                Optimize code
              </Button>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg ${
                m.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-editor-active-tab text-editor-text border border-editor-border'
              }`}>
                <div className="px-3 py-2">
                  <div className="whitespace-pre-wrap text-sm">
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
                      onClick={() => {
                        setInput(`Please elaborate on: ${m.content.slice(0, 50)}...`);
                        inputRef.current?.focus();
                      }}
                      className="h-6 px-2 text-xs"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Edit
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

      {/* Input */}
      <div className="border-t border-border bg-editor-sidebar p-3">
        <div className="flex gap-2">
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
            className="flex-1 bg-editor-panel border-editor-border text-editor-text placeholder:text-editor-text-muted min-h-[60px] max-h-[120px] resize-none"
            disabled={loading}
          />
          <Button 
            onClick={send} 
            disabled={loading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4"
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
  );
};