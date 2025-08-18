import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, KeyRound, Sparkles } from 'lucide-react';

interface ChatPanelProps {
  getActiveContext: () => { fileName?: string; code?: string };
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export const ChatPanel = ({ getActiveContext }: ChatPanelProps) => {
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('gemini_api_key') || '');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('gemini_api_key', apiKey);
  }, [apiKey]);

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    const ctx = getActiveContext();
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    setMessages((m) => [...m, userMsg]);
    setInput('');

    if (!apiKey) {
      const fallback: Message = { id: Date.now() + '-a', role: 'assistant', content: 'Add your Gemini API key to use AI.' };
      setMessages((m) => [...m, fallback]);
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
      setMessages((m) => [...m, { id: Date.now() + '-b', role: 'assistant', content }]);
    } catch (e) {
      setMessages((m) => [...m, { id: Date.now() + '-e', role: 'assistant', content: 'Error calling Gemini.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-editor-panel">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-editor-sidebar">
        <KeyRound className="w-4 h-4 text-editor-accent" />
        <input
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter Gemini API Key"
          className="flex-1 h-7 rounded bg-editor-panel border border-editor-border px-2 text-xs text-editor-text placeholder:text-editor-text-dim"
        />
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-3">
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
        
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-3 py-2 rounded-lg ${
              m.role === 'user' 
                ? 'bg-editor-accent text-white' 
                : 'bg-editor-active-tab text-editor-text border border-editor-border'
            }`}>
              <pre className="whitespace-pre-wrap text-sm font-sans">{m.content}</pre>
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

      <div className="flex gap-2 p-3 border-t border-border bg-editor-sidebar">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !loading && send()}
          placeholder="Ask AI about your code..."
          className="flex-1 bg-editor-panel border-editor-border text-editor-text placeholder:text-editor-text-dim"
          disabled={loading}
        />
        <Button 
          onClick={send} 
          disabled={loading || !input.trim()}
          className="bg-editor-accent hover:bg-editor-accent/80 text-white"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
};
