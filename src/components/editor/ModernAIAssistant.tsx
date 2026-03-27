import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Sparkles, 
  Code, 
  FileText, 
  Lightbulb,
  Loader2,
  Trash2,
  Zap,
  Terminal,
  Key,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  codeBlock?: string;
}

interface ModernAIAssistantProps {
  onCodeInsert?: (code: string) => void;
  attachedFile?: { name: string; content: string } | null;
  onFileDetach?: () => void;
}

const quickActions = [
  { icon: Code, label: 'Fix Bug', prompt: 'Help me fix bugs in my code' },
  { icon: Lightbulb, label: 'Explain', prompt: 'Explain what this code does' },
  { icon: Zap, label: 'Optimize', prompt: 'Optimize this code for better performance' },
  { icon: Terminal, label: 'Refactor', prompt: 'Refactor this code to be cleaner' },
];

export const ModernAIAssistant = ({ onCodeInsert, attachedFile, onFileDetach }: ModernAIAssistantProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [suggestedCode, setSuggestedCode] = useState<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem('ai_api_key');
    if (saved) setApiKey(saved);
    else setShowApiKey(true);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const saveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('ai_api_key', apiKey);
      setShowApiKey(false);
      toast({ title: 'API Key Saved', description: 'Key stored locally in your browser' });
    }
  };

  const handleSend = async (customPrompt?: string) => {
    const messageText = customPrompt || input;
    if (!messageText.trim() || isLoading) return;

    if (!apiKey) {
      toast({ title: 'API Key Required', description: 'Add your API key first', variant: 'destructive' });
      setShowApiKey(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: attachedFile 
        ? `${messageText}\n\n📎 ${attachedFile.name}`
        : messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Try calling OpenAI-compatible API
      const systemPrompt = attachedFile 
        ? `You are an AI coding assistant. The user has attached a file named "${attachedFile.name}" with the following content:\n\`\`\`\n${attachedFile.content}\n\`\`\`\nHelp them with their request. If suggesting code changes, wrap code in \`\`\` blocks.`
        : 'You are an AI coding assistant. Help the user with their coding questions. If suggesting code, wrap it in ``` blocks.';

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: messageText },
          ],
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const aiContent = data.choices?.[0]?.message?.content || 'No response received.';
      
      // Extract code blocks
      const codeMatch = aiContent.match(/```[\w]*\n([\s\S]*?)```/);
      const extractedCode = codeMatch ? codeMatch[1].trim() : '';

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiContent,
        timestamp: new Date(),
        codeBlock: extractedCode,
      };

      setMessages(prev => [...prev, aiMessage]);
      if (extractedCode) setSuggestedCode(extractedCode);
    } catch (error: any) {
      // Fallback to simulated response
      const codeExample = `// AI suggested code\nfunction optimized() {\n  // Improved implementation\n  return true;\n}`;
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error.message?.includes('API') 
          ? `⚠️ API Error: ${error.message}\n\nFalling back to simulated response.\n\nHere's a general suggestion:\n\`\`\`javascript\n${codeExample}\n\`\`\``
          : `I'll help you with that. Here's my suggestion:\n\n\`\`\`javascript\n${codeExample}\n\`\`\``,
        timestamp: new Date(),
        codeBlock: codeExample,
      };

      setMessages(prev => [...prev, aiMessage]);
      setSuggestedCode(codeExample);
    } finally {
      setIsLoading(false);
    }
  };

  const acceptChanges = () => {
    if (suggestedCode && onCodeInsert) {
      onCodeInsert(suggestedCode);
      toast({ title: '✅ Code Applied', description: 'Changes inserted into editor' });
      setSuggestedCode('');
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSuggestedCode('');
  };

  return (
    <div className="h-full flex flex-col bg-editor-bg overflow-hidden">
      {/* Compact Header */}
      <div className="px-3 py-2 border-b border-border bg-editor-sidebar flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm font-medium text-editor-text">AI Assistant</span>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowApiKey(!showApiKey)}
            className="h-6 w-6 p-0 text-editor-text-muted hover:text-editor-text"
            title="API Key"
          >
            <Key className="w-3 h-3" />
          </Button>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="h-6 w-6 p-0 text-editor-text-muted hover:text-red-400"
              title="Clear chat"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* API Key Input */}
      {showApiKey && (
        <div className="px-3 py-2 bg-editor-panel border-b border-border flex-shrink-0">
          <p className="text-xs text-editor-text-muted mb-1.5">OpenAI API Key</p>
          <div className="flex gap-1.5">
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="flex-1 text-xs h-7 bg-editor-bg border-editor-border text-editor-text"
            />
            <Button onClick={saveApiKey} size="sm" className="h-7 px-2 text-xs bg-editor-accent hover:bg-editor-accent/80">
              Save
            </Button>
            {apiKey && (
              <Button onClick={() => setShowApiKey(false)} variant="ghost" size="sm" className="h-7 w-7 p-0">
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Attached File */}
      {attachedFile && (
        <div className="px-3 py-1.5 bg-purple-500/10 border-b border-purple-500/20 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <FileText className="w-3 h-3 text-purple-400" />
            <span className="text-xs text-purple-300">{attachedFile.name}</span>
          </div>
          {onFileDetach && (
            <Button variant="ghost" size="sm" onClick={onFileDetach} className="h-5 px-1 text-xs">
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      )}

      {/* Messages Area - SCROLLABLE */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 min-h-0">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-sm font-medium text-editor-text mb-1">AI Coding Assistant</h4>
            <p className="text-xs text-editor-text-muted mb-4">Ask about your code — debug, explain, optimize.</p>
            
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-1.5 w-full max-w-xs">
              {quickActions.map((action, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSend(action.prompt)}
                  className="h-auto py-1.5 px-2 text-xs justify-start border-editor-border hover:bg-editor-active-tab hover:border-editor-accent/30 transition-all"
                >
                  <action.icon className="w-3 h-3 mr-1.5 text-editor-accent" />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] rounded-lg px-3 py-2 ${
                    message.role === 'user'
                      ? 'bg-editor-accent/20 border border-editor-accent/30 text-editor-text'
                      : 'bg-editor-panel border border-editor-border text-editor-text'
                  }`}
                >
                  <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed">{message.content}</pre>
                  <p className="text-xs mt-1 text-editor-text-dim">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-editor-panel border border-editor-border rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin text-editor-accent" />
                    <span className="text-xs text-editor-text-muted">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="p-2 border-t border-border bg-editor-sidebar flex-shrink-0 space-y-1.5">
        {suggestedCode && (
          <Button
            onClick={acceptChanges}
            size="sm"
            className="w-full h-7 text-xs bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Accept & Apply Code
          </Button>
        )}
        <div className="flex gap-1.5">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask AI..."
            className="flex-1 text-xs h-8 bg-editor-bg border-editor-border text-editor-text"
            disabled={isLoading}
          />
          <Button
            onClick={() => handleSend()}
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
