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
      onOutput('⚠ Java execution requires Judge0 API or server-side execution', 'error');
      onOutput('Visit: https://judge0.com for Java code execution', 'output');
    } catch (error) {
      onOutput(`Java Error: ${error}`, 'error');
    }
  };

  const runCpp = async (code: string) => {
    try {
      onOutput('⚠ C++ execution requires WebAssembly compilation or Judge0 API', 'error');
      onOutput('Visit: https://judge0.com for C++ code execution', 'output');
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

  useEffect(() => {
    if (language === 'python' && pyodide && file.content) {
      runCode();
    }
  }, [file.content, pyodide, language]);

  if (loading) {
    return <div className="text-xs text-muted-foreground">Loading {language} environment...</div>;
  }

  return null;
};
