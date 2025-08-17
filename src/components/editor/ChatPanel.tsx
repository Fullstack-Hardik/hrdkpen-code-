import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, KeyRound } from 'lucide-react';

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
    <div className="flex flex-col h-full editor-panel">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
        <KeyRound className="w-4 h-4 text-editor-accent" />
        <input
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Gemini API Key (stored locally)"
          className="flex-1 h-8 rounded bg-editor-panel border border-editor-border px-2 text-sm"
        />
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <div className={`inline-block px-3 py-2 rounded-md ${m.role === 'user' ? 'bg-primary/20' : 'bg-editor-active-tab'}`}>
              <pre className="whitespace-pre-wrap text-sm">{m.content}</pre>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 p-3 border-t border-border">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Ask AI (e.g., explain this function, optimize code)"
          className="flex-1"
        />
        <Button onClick={send} disabled={loading}>
          {loading ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
};
