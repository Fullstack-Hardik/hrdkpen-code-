import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { 
  Bot, Trash2, Settings, ChevronDown, Key, ExternalLink, X, 
  Send, Copy, Check, User, Loader2 
} from 'lucide-react';

export interface AIAssistantRef {
  submitPrompt: (prompt: string) => void;
}

const personas = {
  helpful: {
    system: "You are a professional, helpful, and polite artificial intelligence assistant. Answer questions clearly, accurately, and thoroughly with balanced insights.",
    desc: "A friendly, balanced, and smart assistant ready to respond to anything."
  },
  creative: {
    system: "You are an imaginative storyteller, a creative writer, and a playful brainstorming partner. Utilize rich metaphors, engaging words, and narrative formats when responding.",
    desc: "An imaginative, descriptive writer great at stories, analogies, and concepts."
  },
  tech: {
    system: "You are an expert software developer, technical architect, and logic tutor. Provide precise, clean code answers, best practices guidance, optimization strategies, and thorough comments.",
    desc: "Code assistant focused on exact solutions, documentation, and logic."
  },
  sarcastic: {
    system: "You are a humorous, slightly sarcastic, witty friend. Keep answers brief, slightly cheeky, or comical, but still fundamentally helpful beneath the snark.",
    desc: "A cheeky sidekick that uses humor, wit, and friendly banter."
  },
  academic: {
    system: "You are a scholarly research academic. Use formal vocabulary, objective structure, precise descriptions, and structured breakdowns (bullet points, clear headers) to outline complex theoretical ideas.",
    desc: "Objective researcher using structured, analytical vocabulary."
  }
};

interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
}

const parseMarkdown = (text: string) => {
  if (!text) return '';
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks
  html = html.replace(/```([\w-]*)\n([\s\S]*?)```/g, function(_, lang, code) {
    return `<div class="my-3 overflow-hidden rounded-xl border border-editor-border bg-[hsl(var(--crust))] text-editor-text">
        <div class="flex justify-between items-center px-4 py-1.5 bg-[hsl(var(--mantle))] text-xs text-editor-text-muted select-none">
            <span>${lang || 'code'}</span>
        </div>
        <pre class="p-4 overflow-x-auto text-xs font-mono leading-relaxed"><code>${code.trim()}</code></pre>
    </div>`;
  });

  // Inline Code
  html = html.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-[hsl(var(--surface0))] text-[hsl(var(--blue))] font-mono text-xs rounded-md">$1</code>');
  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Italic
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  // Unordered list items
  html = html.replace(/^\s*-\s+(.+)$/gm, '<li class="ml-4 list-disc">$1</li>');
  // Ordered list items
  html = html.replace(/^\s*\d+\.\s+(.+)$/gm, '<li class="ml-4 list-decimal">$1</li>');
  // Paragraphs & Linebreaks
  html = html.replace(/\n/g, '<br>');

  return html;
};

export const AIAssistant = forwardRef<AIAssistantRef, {}>((props, ref) => {
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<keyof typeof personas>('helpful');
  const [apiKey, setApiKey] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
      try { setChatHistory(JSON.parse(savedHistory)); } catch (e) {}
    }
    const savedApiKey = localStorage.getItem('gemini_api_key');
    if (savedApiKey) setApiKey(savedApiKey);
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isGenerating]);

  useImperativeHandle(ref, () => ({
    submitPrompt: (prompt: string) => {
      setUserInput(prompt);
      handleFormSubmit(new Event('submit') as any, prompt);
    }
  }));

  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 144)}px`;
    }
  };

  const handleKeydown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleFormSubmit(e);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent | Event, overridePrompt?: string) => {
    e.preventDefault();
    if (isGenerating) return;

    const text = overridePrompt || userInput.trim();
    if (!text) return;

    setIsGenerating(true);
    setUserInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '52px';
    }

    const newHistory = [...chatHistory, { role: 'user' as const, parts: [{ text }] }];
    setChatHistory(newHistory);

    try {
      const responseText = await callGeminiAPI(text, newHistory);
      const updatedHistory = [...newHistory, { role: 'model' as const, parts: [{ text: responseText }] }];
      setChatHistory(updatedHistory);
      localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: '**Error:** Failed to connect to Gemini API. Check your API key or network.' }] }]);
    } finally {
      setIsGenerating(false);
      textareaRef.current?.focus();
    }
  };

  const callGeminiAPI = async (prompt: string, history: Message[]) => {
    const key = apiKey.trim() || import.meta.env.VITE_GEMINI_API_KEY || '';
    if (!key) throw new Error("No API key");

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
    const payload = {
      contents: history,
      systemInstruction: { parts: [{ text: personas[selectedPersona].system }] }
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error("HTTP Error");
    const result = await response.json();
    return result.candidates?.[0]?.content?.parts?.[0]?.text || '';
  };

  return (
    <div className="flex flex-col h-full bg-editor-bg text-editor-text relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-editor-border bg-[hsl(var(--mantle))] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-[hsl(var(--blue)/0.2)] text-[hsl(var(--blue))] flex items-center justify-center">
            <Bot size={18} />
          </div>
          <div>
            <h1 className="font-semibold text-sm flex items-center gap-2">Nova AI</h1>
            <p className="text-[10px] text-editor-text-muted flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Ready to assist
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => { setChatHistory([]); localStorage.removeItem('chatHistory'); }} className="p-2 rounded text-red-400 hover:bg-red-400/10 transition-colors" title="Clear Chat">
            <Trash2 size={16} />
          </button>
          <button onClick={() => setShowSettings(!showSettings)} className="p-2 rounded text-editor-text-muted hover:bg-editor-active-tab transition-colors" title="Settings">
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatHistory.length === 0 && (
              <div className="flex items-start gap-3.5 max-w-2xl">
                <div className="h-8 w-8 rounded-lg bg-[hsl(var(--blue)/0.2)] text-[hsl(var(--blue))] flex items-center justify-center shrink-0">
                  <Bot size={16} />
                </div>
                <div className="bg-[hsl(var(--surface0))] rounded-2xl rounded-tl-none p-3 shadow-sm text-sm">
                  <p className="font-medium text-editor-text mb-1">Welcome back!</p>
                  <p className="text-editor-text-muted">I am your customizable Gemini companion. You can configure my persona in the settings, or start typing below!</p>
                </div>
              </div>
            )}
            
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex items-start gap-3.5 max-w-2xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-[hsl(var(--surface1))]' : 'bg-[hsl(var(--blue)/0.2)] text-[hsl(var(--blue))]'}`}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`rounded-2xl p-3 shadow-sm text-sm leading-relaxed overflow-hidden ${msg.role === 'user' ? 'bg-[hsl(var(--blue))] text-white rounded-tr-none' : 'bg-[hsl(var(--surface0))] text-editor-text rounded-tl-none'}`}
                     dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.parts[0].text) }} />
              </div>
            ))}
            
            {isGenerating && (
              <div className="flex items-start gap-3.5 max-w-2xl animate-pulse">
                <div className="h-8 w-8 rounded-lg bg-[hsl(var(--blue)/0.2)] text-[hsl(var(--blue))] flex items-center justify-center shrink-0">
                  <Bot size={16} />
                </div>
                <div className="bg-[hsl(var(--surface0))] rounded-2xl rounded-tl-none p-3 flex gap-1.5 items-center">
                  <div className="h-1.5 w-1.5 bg-editor-text-muted rounded-full animate-bounce"></div>
                  <div className="h-1.5 w-1.5 bg-editor-text-muted rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="h-1.5 w-1.5 bg-editor-text-muted rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-editor-border bg-[hsl(var(--mantle))]">
            <form onSubmit={handleFormSubmit} className="relative flex items-center bg-[hsl(var(--crust))] border border-editor-border rounded-xl focus-within:border-[hsl(var(--blue))] transition-colors">
              <textarea
                ref={textareaRef}
                value={userInput}
                onChange={e => { setUserInput(e.target.value); autoResizeTextarea(); }}
                onKeyDown={handleKeydown}
                placeholder="Ask me anything..."
                className="w-full bg-transparent pl-3 pr-10 py-3 text-xs resize-none focus:outline-none max-h-32 overflow-y-auto"
                style={{ height: '46px' }}
              />
              <button type="submit" disabled={isGenerating || !userInput.trim()} className="absolute right-2 bottom-2 h-7 w-7 rounded-lg bg-[hsl(var(--blue))] text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </form>
          </div>
        </div>

        {/* Settings Drawer */}
        {showSettings && (
          <div className="absolute inset-y-0 right-0 w-64 bg-[hsl(var(--mantle))] border-l border-editor-border p-4 flex flex-col gap-4 z-10 overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between border-b border-editor-border pb-2">
              <h3 className="font-semibold text-sm flex items-center gap-2"><Settings size={14} /> Settings</h3>
              <button onClick={() => setShowSettings(false)} className="text-editor-text-muted hover:text-editor-text"><X size={16} /></button>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold uppercase text-editor-text-muted">AI Persona</label>
              <select value={selectedPersona} onChange={e => setSelectedPersona(e.target.value as any)} className="w-full bg-[hsl(var(--crust))] border border-editor-border rounded px-2 py-1.5 text-xs focus:outline-none">
                <option value="helpful">Helpful Assistant</option>
                <option value="creative">Creative Storyteller</option>
                <option value="tech">Coding Companion</option>
                <option value="sarcastic">Sarcastic Buddy</option>
                <option value="academic">Academic Researcher</option>
              </select>
              <p className="text-[10px] text-editor-text-muted mt-1 italic">{personas[selectedPersona].desc}</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold uppercase text-editor-text-muted">API Key (Optional)</label>
              <input type="password" value={apiKey} onChange={e => { setApiKey(e.target.value); localStorage.setItem('gemini_api_key', e.target.value); }} placeholder="Using Default" className="w-full bg-[hsl(var(--crust))] border border-editor-border rounded px-2 py-1.5 text-xs focus:outline-none" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
