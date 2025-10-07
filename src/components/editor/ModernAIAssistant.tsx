import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  ChevronDown,
  Zap,
  Terminal,
  Bug,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [suggestedCode, setSuggestedCode] = useState<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const savedApiKey = localStorage.getItem('ai_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    } else {
      setShowApiKeyInput(true);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const saveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('ai_api_key', apiKey);
      setShowApiKeyInput(false);
      toast({
        title: 'API Key Saved',
        description: 'Your API key has been saved locally',
      });
    }
  };

  const handleSend = async (customPrompt?: string) => {
    const messageText = customPrompt || input;
    if (!messageText.trim() || isLoading) return;

    if (!apiKey) {
      toast({
        title: 'API Key Required',
        description: 'Please add your API key first',
        variant: 'destructive',
      });
      setShowApiKeyInput(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: attachedFile 
        ? `${messageText}\n\nAttached File: ${attachedFile.name}\n\`\`\`\n${attachedFile.content}\n\`\`\``
        : messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setShowQuickActions(false);

    try {
      // Simulate AI response with code suggestion
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const codeExample = `// Suggested improvement\nfunction optimizedCode() {\n  // Better implementation\n  return true;\n}`;
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: attachedFile
          ? `I've analyzed your file "${attachedFile.name}". Here's what I suggest:\n\n1. Code looks good overall\n2. Consider these optimizations:\n\n\`\`\`javascript\n${codeExample}\n\`\`\`\n\nClick "Accept Changes" below to apply this code.`
          : `I'll help you with that. Here's what I suggest:\n\n1. Review the code structure\n2. Check for common issues\n3. Apply best practices\n\nWould you like me to generate a code example?`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setSuggestedCode(codeExample);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to get AI response',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const acceptChanges = () => {
    if (suggestedCode && onCodeInsert) {
      onCodeInsert(suggestedCode);
      toast({
        title: 'Changes Applied',
        description: 'Code has been updated',
      });
      setSuggestedCode('');
    }
  };

  const clearChat = () => {
    setMessages([]);
    setShowQuickActions(true);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900">
      {/* Compact Header */}
      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">AI Assistant</h3>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
              className="h-7 px-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              <Settings className="w-3 h-3" />
            </Button>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                className="h-7 px-2 text-xs hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* API Key Input */}
      {showApiKeyInput && (
        <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <p className="text-xs font-medium mb-2">API Key Configuration</p>
          <div className="flex gap-2">
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your AI API key"
              className="flex-1 text-sm h-8"
            />
            <Button
              onClick={saveApiKey}
              size="sm"
              className="h-8 px-3"
            >
              Save
            </Button>
          </div>
        </div>
      )}

      {/* Attached File Indicator */}
      {attachedFile && (
        <div className="px-4 py-2 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-200 dark:border-purple-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-medium text-purple-900 dark:text-purple-100">
              Attached: {attachedFile.name}
            </span>
          </div>
          {onFileDetach && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onFileDetach}
              className="h-6 px-2 text-xs hover:bg-purple-100 dark:hover:bg-purple-900/40"
            >
              Remove
            </Button>
          )}
        </div>
      )}

      {/* Messages Area */}
      <ScrollArea ref={scrollRef} className="flex-1 px-4 py-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4 animate-pulse">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              AI Coding Assistant
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-xs">
              Ask me anything about your code. I can help debug, explain, optimize, and refactor.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Quick Actions */}
      {showQuickActions && messages.length === 0 && (
        <div className="px-4 pb-2">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Quick Actions</p>
          <div className="grid grid-cols-2 gap-1.5">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSend(action.prompt)}
                className="h-auto py-2 px-2 text-xs justify-start hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700 transition-all"
              >
                <action.icon className="w-3 h-3 mr-1.5 text-blue-600 dark:text-blue-400" />
                <span className="truncate">{action.label}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm space-y-2">
        {suggestedCode && (
          <Button
            onClick={acceptChanges}
            size="sm"
            className="w-full h-8 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
          >
            <Sparkles className="w-3 h-3 mr-2" />
            Accept Changes
          </Button>
        )}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask AI for help..."
            className="flex-1 text-sm h-9 bg-white dark:bg-gray-900"
            disabled={isLoading}
          />
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="h-9 px-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
