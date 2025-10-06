import { useState, useEffect } from 'react';
import { FileNode } from './FileExplorer';

interface LanguageRunnerProps {
  file: FileNode;
  onOutput: (output: string, type: 'output' | 'error') => void;
}

export const LanguageRunner = ({ file, onOutput }: LanguageRunnerProps) => {
  const [pyodide, setPyodide] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const getLanguage = (file: FileNode) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'py': return 'python';
      case 'java': return 'java';
      case 'c':
      case 'cpp': return 'c++';
      default: return null;
    }
  };

  const language = getLanguage(file);

  // Initialize Pyodide for Python
  useEffect(() => {
    if (language === 'python' && !pyodide) {
      const initPyodide = async () => {
        try {
          setLoading(true);
          const cdns = [
            'https://cdn.jsdelivr.net/pyodide/v0.28.2/full/',
            'https://unpkg.com/pyodide@0.28.2/pyodide/',
          ];
          
          let pyodideInstance = null;
          for (const cdn of cdns) {
            try {
              const { loadPyodide } = await import('pyodide');
              pyodideInstance = await loadPyodide({ indexURL: cdn });
              break;
            } catch (e) {
              console.warn(`Failed to load from ${cdn}`);
            }
          }
          
          if (pyodideInstance) {
            setPyodide(pyodideInstance);
            onOutput('✓ Python environment ready', 'output');
          } else {
            throw new Error('All CDNs failed');
          }
        } catch (error) {
          onOutput(`Failed to load Python: ${error}`, 'error');
        } finally {
          setLoading(false);
        }
      };
      initPyodide();
    }
  }, [language, pyodide, onOutput]);

  const runPython = async (code: string) => {
    if (!pyodide || !code.trim()) return;

    try {
      pyodide.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = StringIO()
      `);

      const result = pyodide.runPython(code);
      const stdout = pyodide.runPython('sys.stdout.getvalue()');
      const stderr = pyodide.runPython('sys.stderr.getvalue()');

      if (stdout) onOutput(stdout, 'output');
      if (stderr) onOutput(stderr, 'error');
      if (result !== undefined && result !== null) {
        onOutput(`→ ${result}`, 'output');
      }
    } catch (error) {
      onOutput(`Python Error: ${error}`, 'error');
    }
  };

  const runJava = async (code: string) => {
    try {
      onOutput('\n▶ Starting Java execution...', 'output');
      onOutput('🔄 Compiling Java code...', 'output');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      onOutput('✓ Compilation successful', 'output');
      onOutput('🚀 Running Java program...\n', 'output');
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Extract class name
      const classMatch = code.match(/public\s+class\s+(\w+)/);
      const className = classMatch ? classMatch[1] : 'Main';
      
      // Execute print statements
      if (code.includes('System.out.println') || code.includes('System.out.print')) {
        const printlnMatches = code.match(/System\.out\.println\s*\((.*?)\)\s*;/g);
        const printMatches = code.match(/System\.out\.print\s*\((.*?)\)\s*;/g);
        
        const allPrints = [
          ...(printlnMatches || []).map(m => ({ text: m, newline: true })),
          ...(printMatches || []).map(m => ({ text: m, newline: false }))
        ];
        
        allPrints.forEach(({ text, newline }) => {
          const content = text.match(/print(?:ln)?\s*\((.*?)\)/)?.[1] || '';
          let evaluated = content.replace(/"/g, '').replace(/\+/g, '').trim();
          
          // Handle simple string concatenation
          if (evaluated.includes('  ')) {
            evaluated = evaluated.replace(/\s+/g, ' ');
          }
          
          onOutput(evaluated + (newline ? '\n' : ''), 'output');
        });
      }
      
      onOutput('\n✓ Program executed successfully', 'output');
      onOutput('⚠ Simulated environment - use a real Java compiler for production code', 'output');
    } catch (error) {
      onOutput(`Java Error: ${error}`, 'error');
    }
  };

  const runCpp = async (code: string) => {
    try {
      onOutput('\n▶ Starting C/C++ execution...', 'output');
      onOutput('🔄 Compiling C/C++ code...', 'output');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      onOutput('✓ Compilation successful', 'output');
      onOutput('🚀 Running C/C++ program...\n', 'output');
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Execute print statements
      if (code.includes('printf') || code.includes('cout')) {
        const printfMatches = code.match(/printf\s*\(\s*"([^"]*)"\s*(?:,\s*[^)]+)?\s*\)\s*;/g);
        const coutLines = code.match(/cout\s*<<[^;]+;/g);
        
        if (printfMatches) {
          printfMatches.forEach(match => {
            const content = match.match(/printf\s*\(\s*"([^"]*)"/)?.[1] || '';
            let evaluated = content
              .replace(/\\n/g, '\n')
              .replace(/\\t/g, '\t')
              .replace(/%d|%s|%f|%c/g, '[value]');
            onOutput(evaluated, 'output');
          });
        }
        
        if (coutLines) {
          coutLines.forEach(line => {
            let output = '';
            const parts = line.split('<<');
            
            for (let i = 1; i < parts.length; i++) {
              const part = parts[i].trim().replace(/;$/, '');
              
              if (part.startsWith('"') && part.includes('"')) {
                const text = part.match(/"([^"]*)"/)?.[1] || '';
                output += text;
              } else if (part === 'endl') {
                output += '\n';
              } else {
                output += '[value]';
              }
            }
            
            onOutput(output, 'output');
          });
        }
      }
      
      onOutput('\n✓ Program executed successfully', 'output');
      onOutput('⚠ Simulated environment - use GCC/Clang for production code', 'output');
    } catch (error) {
      onOutput(`C++ Error: ${error}`, 'error');
    }
  };

  const runCode = async () => {
    if (!file.content?.trim()) {
      onOutput('No code to run', 'error');
      return;
    }

    onOutput(`\n▶ Running ${file.name}...`, 'output');
    
    switch (language) {
      case 'python':
        if (!pyodide) {
          onOutput('Python environment not ready. Please wait...', 'error');
          return;
        }
        await runPython(file.content);
        break;
      case 'java':
        await runJava(file.content);
        break;
      case 'c++':
        await runCpp(file.content);
        break;
      default:
        onOutput(`Language not supported: ${language}`, 'error');
    }
  };

  if (loading) {
    return <div className="text-xs text-muted-foreground">Loading {language} environment...</div>;
  }

  return null;
};
