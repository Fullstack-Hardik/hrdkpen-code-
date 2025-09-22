import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Code, Lightbulb, Zap, FileText } from 'lucide-react';

interface Suggestion {
  id: string;
  text: string;
  description: string;
  type: 'function' | 'variable' | 'keyword' | 'snippet';
  insertText: string;
}

interface AutoCompleteProps {
  code: string;
  cursorPosition: number;
  onSuggestionSelect: (suggestion: Suggestion) => void;
  isEnabled: boolean;
  language: string;
}

export const AutoComplete = ({ 
  code, 
  cursorPosition, 
  onSuggestionSelect, 
  isEnabled,
  language 
}: AutoCompleteProps) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // JavaScript/TypeScript suggestions
  const getJavaScriptSuggestions = (context: string): Suggestion[] => {
    const suggestions: Suggestion[] = [];

    // Common patterns and completions
    if (context.includes('console.')) {
      suggestions.push({
        id: 'console-log',
        text: 'log()',
        description: 'Log message to console',
        type: 'function',
        insertText: 'log(${1:message})'
      });
    }

    if (context.includes('document.')) {
      suggestions.push(
        {
          id: 'doc-getelementbyid',
          text: 'getElementById()',
          description: 'Get element by ID',
          type: 'function',
          insertText: 'getElementById(${1:id})'
        },
        {
          id: 'doc-queryselector',
          text: 'querySelector()',
          description: 'Query selector',
          type: 'function',
          insertText: 'querySelector(${1:selector})'
        }
      );
    }

    // React patterns
    if (context.includes('useState') || context.includes('React')) {
      suggestions.push(
        {
          id: 'usestate',
          text: 'useState()',
          description: 'React state hook',
          type: 'function',
          insertText: 'useState(${1:initialValue})'
        },
        {
          id: 'useeffect',
          text: 'useEffect()',
          description: 'React effect hook',
          type: 'function',
          insertText: 'useEffect(() => {\n  ${1:// effect}\n}, [${2:dependencies}])'
        }
      );
    }

    // Common snippets
    if (context.includes('function') || context.includes('const')) {
      suggestions.push({
        id: 'arrow-function',
        text: 'Arrow Function',
        description: 'Create arrow function',
        type: 'snippet',
        insertText: 'const ${1:functionName} = (${2:params}) => {\n  ${3:// function body}\n}'
      });
    }

    return suggestions;
  };

  // Python suggestions
  const getPythonSuggestions = (context: string): Suggestion[] => {
    const suggestions: Suggestion[] = [];

    if (context.includes('import')) {
      suggestions.push(
        {
          id: 'import-numpy',
          text: 'import numpy as np',
          description: 'Import NumPy library',
          type: 'keyword',
          insertText: 'import numpy as np'
        },
        {
          id: 'import-pandas',
          text: 'import pandas as pd',
          description: 'Import Pandas library',
          type: 'keyword',
          insertText: 'import pandas as pd'
        }
      );
    }

    if (context.includes('def ')) {
      suggestions.push({
        id: 'python-function',
        text: 'Function Definition',
        description: 'Define a Python function',
        type: 'snippet',
        insertText: 'def ${1:function_name}(${2:parameters}):\n    """${3:docstring}"""\n    ${4:pass}'
      });
    }

    if (context.includes('class ')) {
      suggestions.push({
        id: 'python-class',
        text: 'Class Definition',
        description: 'Define a Python class',
        type: 'snippet',
        insertText: 'class ${1:ClassName}:\n    def __init__(self${2:, parameters}):\n        ${3:pass}'
      });
    }

    return suggestions;
  };

  // HTML suggestions
  const getHTMLSuggestions = (context: string): Suggestion[] => {
    const suggestions: Suggestion[] = [];

    if (context.includes('<')) {
      suggestions.push(
        {
          id: 'html-div',
          text: '<div>',
          description: 'HTML div element',
          type: 'snippet',
          insertText: '<div className="${1:class}">\n  ${2:content}\n</div>'
        },
        {
          id: 'html-button',
          text: '<button>',
          description: 'HTML button element',
          type: 'snippet',
          insertText: '<button onClick={${1:handleClick}}>\n  ${2:Button Text}\n</button>'
        }
      );
    }

    return suggestions;
  };

  // Get suggestions based on language and context
  const getSuggestions = (code: string, language: string): Suggestion[] => {
    const lines = code.split('\n');
    const currentLine = lines[lines.length - 1] || '';
    const context = code.slice(Math.max(0, cursorPosition - 100), cursorPosition);

    switch (language.toLowerCase()) {
      case 'javascript':
      case 'typescript':
      case 'jsx':
      case 'tsx':
        return getJavaScriptSuggestions(context);
      case 'python':
        return getPythonSuggestions(context);
      case 'html':
        return getHTMLSuggestions(context);
      default:
        return [];
    }
  };

  // Update suggestions when code changes
  useEffect(() => {
    if (!isEnabled) {
      setShowSuggestions(false);
      return;
    }

    setLastActivity(Date.now());

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for 4 seconds
    timeoutRef.current = setTimeout(() => {
      const newSuggestions = getSuggestions(code, language);
      
      if (newSuggestions.length > 0) {
        setSuggestions(newSuggestions);
        setShowSuggestions(true);
        setSelectedIndex(0);
      } else {
        setShowSuggestions(false);
      }
    }, 4000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [code, language, isEnabled, cursorPosition]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showSuggestions) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Tab':
        case 'Enter':
          e.preventDefault();
          if (suggestions[selectedIndex]) {
            onSuggestionSelect(suggestions[selectedIndex]);
            setShowSuggestions(false);
          }
          break;
        case 'Escape':
          setShowSuggestions(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSuggestions, selectedIndex, suggestions, onSuggestionSelect]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'function':
        return <Zap className="w-3 h-3 text-blue-500" />;
      case 'variable':
        return <Code className="w-3 h-3 text-green-500" />;
      case 'keyword':
        return <FileText className="w-3 h-3 text-purple-500" />;
      case 'snippet':
        return <Lightbulb className="w-3 h-3 text-yellow-500" />;
      default:
        return <Code className="w-3 h-3 text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'function':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'variable':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'keyword':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'snippet':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (!showSuggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="absolute top-full left-0 z-50 w-80 max-h-60 overflow-y-auto bg-editor-sidebar border-editor-border shadow-lg">
      <div className="p-2">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-editor-text">Code Suggestions</h4>
          <Badge variant="outline" className="text-xs">
            Press Tab to apply
          </Badge>
        </div>
        <div className="space-y-1">
          {suggestions.map((suggestion, index) => (
            <Button
              key={suggestion.id}
              variant="ghost"
              onClick={() => {
                onSuggestionSelect(suggestion);
                setShowSuggestions(false);
              }}
              className={`w-full justify-start p-2 h-auto transition-colors ${
                index === selectedIndex 
                  ? 'bg-editor-accent/20 border border-editor-accent' 
                  : 'hover:bg-editor-panel'
              }`}
            >
              <div className="flex items-start gap-2 w-full">
                <div className="mt-0.5">
                  {getTypeIcon(suggestion.type)}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-editor-text truncate">
                      {suggestion.text}
                    </span>
                    <Badge className={`text-xs ${getTypeColor(suggestion.type)}`}>
                      {suggestion.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-editor-text-muted mt-1">
                    {suggestion.description}
                  </p>
                </div>
              </div>
            </Button>
          ))}
        </div>
        <div className="mt-2 pt-2 border-t border-editor-border">
          <p className="text-xs text-editor-text-muted">
            Use ↑↓ to navigate, Tab/Enter to apply, Esc to close
          </p>
        </div>
      </div>
    </Card>
  );
};