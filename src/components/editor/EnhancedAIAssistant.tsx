import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Sparkles, 
  Copy, 
  Settings,
  Trash2,
  Plus,
  FileText,
  FolderPlus,
  Download,
  Upload,
  Code,
  Search,
  Zap,
  Brain,
  FileCode,
  GitBranch,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EnhancedAIAssistantProps {
  getActiveContext: () => { fileName?: string; code?: string; allFiles?: Record<string, string> };
  onFileCreate?: (fileName: string, content: string) => void;
  onFileUpdate?: (fileName: string, content: string) => void;
  onFileDelete?: (fileName: string) => void;
  onFileRead?: (fileName: string) => string | undefined;
  onOpenSettings?: () => void;
  onLogFileChange?: (filePath: string, content: string, changeType: 'create' | 'update' | 'delete', description: string) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: FileAction[];
}

interface FileAction {
  type: 'create' | 'update' | 'delete' | 'read';
  fileName: string;
  content?: string;
  description: string;
}

const QUICK_ACTIONS = [
  { icon: FileCode, text: "Analyze current file", prompt: "Analyze this code and suggest improvements" },
  { icon: Plus, text: "Create component", prompt: "Create a new React component: " },
  { icon: Search, text: "Find bugs", prompt: "Find and fix potential bugs in this code" },
  { icon: Zap, text: "Optimize code", prompt: "Optimize this code for better performance" },
  { icon: GitBranch, text: "Refactor", prompt: "Refactor this code to be more maintainable" },
  { icon: Brain, text: "Explain code", prompt: "Explain how this code works step by step" }
];

export const EnhancedAIAssistant = ({ 
  getActiveContext, 
  onFileCreate, 
  onFileUpdate, 
  onFileDelete, 
  onFileRead,
  onOpenSettings,
  onLogFileChange 
}: EnhancedAIAssistantProps) => {
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('gemini_api_key') || '');
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('enhanced_chat_messages');
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
  const [showSettings, setShowSettings] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem('gemini_api_key', apiKey);
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem('enhanced_chat_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const clearChat = () => {
    setMessages([]);
    toast({
      title: "Chat Cleared",
      description: "All messages have been cleared"
    });
  };

  const executeFileAction = async (action: FileAction) => {
    try {
      switch (action.type) {
        case 'create':
          if (onFileCreate && action.content) {
            onFileCreate(action.fileName, action.content);
            onLogFileChange?.(action.fileName, action.content, 'create', action.description);
            toast({
              title: "File Created",
              description: `Created ${action.fileName}`
            });
          }
          break;
        case 'update':
          if (onFileUpdate && action.content) {
            onFileUpdate(action.fileName, action.content);
            onLogFileChange?.(action.fileName, action.content, 'update', action.description);
            toast({
              title: "File Updated",
              description: `Updated ${action.fileName}`
            });
          }
          break;
        case 'delete':
          if (onFileDelete) {
            onFileDelete(action.fileName);
            onLogFileChange?.(action.fileName, '', 'delete', action.description);
            toast({
              title: "File Deleted",
              description: `Deleted ${action.fileName}`
            });
          }
          break;
        case 'read':
          if (onFileRead) {
            const content = onFileRead(action.fileName);
            if (content) {
              toast({
                title: "File Read",
                description: `Read ${action.fileName}`
              });
            }
          }
          break;
      }
    } catch (error) {
      console.error('Error executing file action:', error);
      toast({
        title: "Error",
        description: `Failed to ${action.type} ${action.fileName}`,
        variant: "destructive"
      });
    }
  };

  const parseAIResponse = (content: string): { text: string; actions: FileAction[] } => {
    const actions: FileAction[] = [];
    let text = content;

    // Look for file action patterns in the AI response
    const fileActionPattern = /\[FILE_ACTION:(\w+):([^\]]+):([^\]]*)\]/g;
    let match;

    while ((match = fileActionPattern.exec(content)) !== null) {
      const [fullMatch, type, fileName, description] = match;
      
      // Extract content if it exists (usually in code blocks after the action)
      const contentPattern = new RegExp(`\\[FILE_ACTION:${type}:${fileName}:[^\\]]*\\]\\s*\`\`\`[\\w]*\\n([\\s\\S]*?)\`\`\``);
      const contentMatch = content.match(contentPattern);
      
      actions.push({
        type: type as FileAction['type'],
        fileName,
        content: contentMatch ? contentMatch[1] : undefined,
        description: description || `${type} ${fileName}`
      });

      // Remove the action marker from the text
      text = text.replace(fullMatch, '');
    }

    return { text: text.trim(), actions };
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
      // Prepare enhanced context with all files
      const allFilesContext = ctx.allFiles ? 
        Object.entries(ctx.allFiles).map(([path, content]) => `File: ${path}\n${content}`).join('\n\n---\n\n') : '';

      const systemPrompt = `You are an advanced AI coding assistant with file management capabilities. You can:

1. CREATE files using [FILE_ACTION:create:filename:description] followed by code in triple backticks
2. UPDATE files using [FILE_ACTION:update:filename:description] followed by code in triple backticks  
3. DELETE files using [FILE_ACTION:delete:filename:description]
4. READ files using [FILE_ACTION:read:filename:description]

Current context:
- Active file: ${ctx.fileName || 'N/A'}
- Current code: ${ctx.code || 'No code selected'}

All project files:
${allFilesContext}

When suggesting file operations, use the FILE_ACTION format. For example:
[FILE_ACTION:create:components/Button.tsx:Create a reusable button component]
\`\`\`tsx
export const Button = () => {
  return <button>Click me</button>;
};
\`\`\`

Be helpful, provide explanations, and suggest best practices.`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser request: ${text}` }] }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          }
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
      const { text: responseText, actions } = parseAIResponse(content);

      const assistantMsg: Message = { 
        id: Date.now() + '-b', 
        role: 'assistant', 
        content: responseText,
        timestamp: new Date(),
        actions
      };
      setMessages(prev => [...prev, assistantMsg]);

    } catch (e) {
      const errorMsg: Message = { 
        id: Date.now() + '-e', 
        role: 'assistant', 
        content: 'Error connecting to Gemini API. Please check your API key and try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
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
    toast({
      title: "Copied",
      description: "Content copied to clipboard"
    });
  };

  const renderMessage = (content: string) => {
    return content.split(/```(\w+)?\n([\s\S]*?)```/).map((part, index) => {
      if (index % 3 === 2) {
        return (
          <div key={index} className="relative group mt-2 mb-2">
            <pre className="bg-gray-900 text-green-400 p-3 rounded overflow-auto text-sm border">
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
        return <span key={index} className="whitespace-pre-wrap">{part}</span>;
      }
    });
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-purple-950/30 via-editor-panel to-blue-950/30">
      {/* Modern Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-purple-500/30 bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-7 h-7 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-lg flex items-center justify-center shadow-md shadow-purple-500/30">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-editor-panel animate-pulse"></div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              AI Copilot
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearChat}
            className="h-7 px-2 hover:bg-purple-500/20 text-purple-300 transition-colors"
            title="Clear Chat"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="h-7 px-2 hover:bg-blue-500/20 text-blue-300 transition-colors"
            title="Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* API Key Input */}
      {showSettings && (
        <div className="p-3 border-b border-purple-500/20 bg-purple-900/20">
          <div className="flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter Gemini API Key (Get from ai.google.dev)"
              className="flex-1 h-9 rounded-lg bg-editor-panel/50 border border-purple-500/30 px-3 text-sm text-editor-text placeholder:text-editor-text-muted focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              type="password"
            />
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="p-2 border-b border-border bg-editor-sidebar/30">
        <div className="grid grid-cols-2 gap-1">
          {QUICK_ACTIONS.map((action, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={() => setInput(action.prompt)}
              className="h-7 justify-start text-xs hover:bg-purple-500/10 transition-colors"
              title={action.text}
            >
              <action.icon className="w-3 h-3 mr-1.5" />
              <span className="truncate">{action.text}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3 overflow-y-auto max-h-[calc(100vh-400px)]">
        {messages.length === 0 && (
          <div className="text-center text-editor-text-muted py-8">
            <div className="mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full mx-auto mb-3 flex items-center justify-center">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-editor-text mb-2">Enhanced AI Assistant</h3>
              <p className="text-sm mb-3">I can create, read, update, and delete files like GitHub Copilot!</p>
              <div className="flex flex-wrap gap-1 justify-center">
                <Badge variant="secondary" className="text-xs">File Management</Badge>
                <Badge variant="secondary" className="text-xs">Code Analysis</Badge>
                <Badge variant="secondary" className="text-xs">Smart Suggestions</Badge>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg ${
                m.role === 'user' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-editor-active-tab text-editor-text border border-editor-border'
              }`}>
                <div className="px-3 py-2">
                  <div className="text-sm">
                    {renderMessage(m.content)}
                  </div>
                  <div className="text-xs opacity-60 mt-1">
                    {m.timestamp.toLocaleTimeString()}
                  </div>
                </div>

                {/* File Actions */}
                {m.actions && m.actions.length > 0 && (
                  <div className="px-3 pb-2 border-t border-editor-border/50 mt-2">
                    <p className="text-xs text-editor-text-muted mb-2">Suggested Actions:</p>
                    <div className="space-y-1">
                      {m.actions.map((action, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => executeFileAction(action)}
                          className="h-6 px-2 text-xs w-full justify-start"
                        >
                          {action.type === 'create' && <Plus className="w-3 h-3 mr-1" />}
                          {action.type === 'update' && <RefreshCw className="w-3 h-3 mr-1" />}
                          {action.type === 'delete' && <Trash2 className="w-3 h-3 mr-1" />}
                          {action.type === 'read' && <FileText className="w-3 h-3 mr-1" />}
                          {action.description}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                
                {m.role === 'assistant' && (
                  <div className="flex items-center gap-1 px-3 pb-2 border-t border-editor-border/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyMessage(m.content)}
                      className="h-6 px-2 text-xs"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
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
                  <span className="text-xs ml-1">AI is analyzing...</span>
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
            placeholder="Ask me to create, update, or analyze files... (Shift+Enter for new line)"
            className="flex-1 bg-editor-panel border-editor-border text-editor-text placeholder:text-editor-text-muted min-h-[60px] max-h-[120px] resize-none"
            disabled={loading}
          />
          <Button 
            onClick={send} 
            disabled={loading || !input.trim()}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4"
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