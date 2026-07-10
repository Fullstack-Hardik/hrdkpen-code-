import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  Send, Sparkles, Code, Lightbulb, Zap, WrapText,
  Loader2, Trash2, Key, X, Copy, Check,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { AIMessage } from '@/types';

interface AIAssistantProps {
  onCodeInsert?: (code: string) => void;
  activeFile?: { name: string; content: string } | null;
}

const QUICK_ACTIONS = [
  { icon: Code,      label: 'Fix Bug',    prompt: 'Find and fix bugs in this code.' },
  { icon: Lightbulb, label: 'Explain',   prompt: 'Explain what this code does step by step.' },
  { icon: Zap,       label: 'Optimize',  prompt: 'Optimize this code for performance and readability.' },
  { icon: WrapText,  label: 'Refactor',  prompt: 'Refactor this code following best practices.' },
];

// Extract the first ```...``` code block from a string
function extractCode(text: string): string | null {
  const match = text.match(/```(?:\w+)?\n([\s\S]*?)```/);
  return match ? match[1].trim() : null;
}

// Simple markdown-to-jsx: renders code blocks and bold
function renderContent(text: string) {
  const parts = text.split(/(```(?:\w+)?\n[\s\S]*?```)/g);
  return parts.map((part, i) => {
    const codeMatch = part.match(/```(\w+)?\n([\s\S]*?)```/);
    if (codeMatch) {
      return (
        <pre
          key={i}
          className="bg-editor-bg rounded border border-border p-3 my-2 text-xs overflow-x-auto whitespace-pre font-mono text-editor-text"
        >
          {codeMatch[2]}
        </pre>
      );
    }
    // Inline bold **text**
    const segments = part.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={i}>
        {segments.map((seg, j) =>
          seg.startsWith('**') && seg.endsWith('**')
            ? <strong key={j} className="font-semibold text-editor-text">{seg.slice(2, -2)}</strong>
            : seg
        )}
      </span>
    );
  });
}

export const AIAssistant = ({ onCodeInsert, activeFile }: AIAssistantProps) => {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('AETHER_SANDBOX_KEY') ?? '');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [keyDraft, setKeyDraft] = useState('');
  const [lastCode, setLastCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!apiKey) setShowKeyInput(true);
  }, [apiKey]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const saveKey = () => {
    const k = keyDraft.trim();
    if (!k) return;
    localStorage.setItem('AETHER_SANDBOX_KEY', k);
    setApiKey(k);
    setShowKeyInput(false);
    setKeyDraft('');
    toast({ title: 'API key saved', description: 'Stored locally in your browser.' });
  };

  const sendMessage = useCallback(async (prompt?: string) => {
    const text = (prompt ?? input).trim();
    if (!text || isLoading) return;

    if (!apiKey) {
      setShowKeyInput(true);
      toast({ title: 'API key required', variant: 'destructive' });
      return;
    }

    const userMsg: AIMessage = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Build system prompt with file context
    const systemPrompt = activeFile
      ? `You are an expert coding assistant in HRDK Pen IDE. The user has the file "${activeFile.name}" open:\n\`\`\`\n${activeFile.content.slice(0, 4000)}\n\`\`\`\nBe concise. Wrap code in \`\`\`lang code\`\`\` blocks.`
      : 'You are an expert coding assistant in HRDK Pen IDE. Help the user write clean, correct code. Be concise. Wrap code in ```lang code``` blocks.';

    // Use client-side Gemini AI
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const chat = model.startChat({
        history: [...newMessages.slice(0, -1)].map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }))
      });
      
      const result = await chat.sendMessage(`System: ${systemPrompt}\n\nUser: ${text}`);
      const responseText = result.response.text();
      const code = extractCode(responseText);

      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: responseText || 'No response',
          timestamp: new Date(),
        },
      ]);
      if (code) setLastCode(code);
    } catch (error: any) {
      console.error('AI Error:', error);
      const message = error.message || 'Unknown error';
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `⚠️ Error: ${message}\n\nMake sure your Gemini API Key is valid.`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, apiKey, messages, activeFile, isLoading, toast]);

  useEffect(() => {
    const handleAIChat = (e: any) => {
      if (e.detail) {
        sendMessage(e.detail);
      }
    };
    window.addEventListener('ai-chat', handleAIChat);
    return () => window.removeEventListener('ai-chat', handleAIChat);
  }, [sendMessage]);

  const handleCopyCode = () => {
    if (!lastCode) return;
    navigator.clipboard.writeText(lastCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col h-full bg-editor-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-editor-sidebar flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          <span className="text-xs font-semibold text-editor-text">AI Assistant</span>
          {activeFile && (
            <span className="text-xs text-editor-text-muted truncate max-w-24">• {activeFile.name}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost" size="sm"
            onClick={() => { setShowKeyInput(v => !v); setKeyDraft(apiKey); }}
            className="h-6 w-6 p-0 text-editor-text-muted hover:text-editor-text"
            title="Configure API key"
          >
            <Key className="w-3 h-3" />
          </Button>
          {messages.length > 0 && (
            <Button
              variant="ghost" size="sm"
              onClick={() => { setMessages([]); setLastCode(null); }}
              className="h-6 w-6 p-0 text-editor-text-muted hover:text-red-400"
              title="Clear chat"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* API Key Input */}
      {showKeyInput && (
        <div className="px-3 py-2 border-b border-border bg-editor-panel flex-shrink-0 space-y-1.5">
          <h3 className="text-sm font-semibold mb-2">Gemini API Key Required</h3>
          <p className="text-xs text-editor-text-muted mb-4">
            Get a free access token from Google AI Studio to use the AI assistant.
            Your key is stored locally in your browser.
          </p>
          <div className="flex gap-1.5">
            <input
              type="password"
              value={keyDraft}
              onChange={e => setKeyDraft(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveKey()}
              placeholder="AIza..."
              className="flex-1 h-7 px-2 text-xs bg-editor-bg border border-border rounded text-editor-text outline-none focus:border-editor-accent"
            />
            <Button onClick={saveKey} size="sm" className="h-7 px-3 text-xs bg-editor-accent hover:bg-editor-accent/80">
              Save
            </Button>
            {apiKey && (
              <Button onClick={() => setShowKeyInput(false)} variant="ghost" size="sm" className="h-7 w-7 p-0">
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0 p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <p className="text-xs font-medium text-editor-text mb-1">AI Coding Assistant</p>
            <p className="text-xs text-editor-text-muted mb-4">
              Ask about your code — debug, explain, optimize
            </p>
            <div className="grid grid-cols-2 gap-1.5 w-full">
              {QUICK_ACTIONS.map(action => (
                <button
                  key={action.label}
                  onClick={() => sendMessage(action.prompt)}
                  className="flex items-center gap-1.5 px-2 py-1.5 text-xs rounded border border-border bg-editor-sidebar hover:border-editor-accent/40 hover:bg-editor-active-tab text-editor-text-muted hover:text-editor-text transition-colors text-left"
                >
                  <action.icon className="w-3 h-3 text-editor-accent flex-shrink-0" />
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[90%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-editor-accent/20 border border-editor-accent/30 text-editor-text'
                    : 'bg-editor-panel border border-border text-editor-text'
                }`}
              >
                {msg.role === 'assistant'
                  ? <div>{renderContent(msg.content)}</div>
                  : <p className="whitespace-pre-wrap">{msg.content}</p>
                }
                <p className="text-editor-text-dim mt-1 text-right">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-editor-panel border border-border rounded-lg px-3 py-2 flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin text-editor-accent" />
              <span className="text-xs text-editor-text-muted">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div className="px-3 py-2 border-t border-border bg-editor-sidebar flex-shrink-0 space-y-1.5">
        {lastCode && (
          <div className="flex gap-1.5">
            <Button
              size="sm"
              onClick={() => { onCodeInsert?.(lastCode!); setLastCode(null); }}
              className="flex-1 h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
            >
              Apply Code to Editor
            </Button>
            <Button
              variant="ghost" size="sm"
              onClick={handleCopyCode}
              className="h-7 w-7 p-0 text-editor-text-muted"
              title="Copy code"
            >
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
            </Button>
          </div>
        )}
        <div className="flex gap-1.5">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Ask AI..."
            disabled={isLoading}
            className="flex-1 h-8 px-2 text-xs bg-editor-bg border border-border rounded text-editor-text outline-none focus:border-editor-accent placeholder:text-editor-text-dim"
          />
          <Button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="h-8 w-8 p-0 bg-editor-accent hover:bg-editor-accent/80"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>
    </div>
  );
};
