import { useEffect, useState } from 'react';

interface PythonRunnerProps {
  code: string;
  onOutput: (output: string, type: 'output' | 'error') => void;
}

export const PythonRunner = ({ code, onOutput }: PythonRunnerProps) => {
  const [pyodide, setPyodide] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initPyodide = async () => {
      try {
        setLoading(true);
        const { loadPyodide } = await import('pyodide');
        const pyodideInstance = await loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
        });
        setPyodide(pyodideInstance);
        onOutput('Python environment ready!', 'output');
      } catch (error) {
        onOutput(`Failed to load Python: ${error}`, 'error');
      } finally {
        setLoading(false);
      }
    };

    if (!pyodide) {
      initPyodide();
    }
  }, [pyodide, onOutput]);

  const runCode = async () => {
    if (!pyodide || !code.trim()) return;

    try {
      // Capture stdout and stderr
      pyodide.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = StringIO()
      `);

      // Run the user's code
      const result = pyodide.runPython(code);

      // Get captured output
      const stdout = pyodide.runPython('sys.stdout.getvalue()');
      const stderr = pyodide.runPython('sys.stderr.getvalue()');

      if (stdout) {
        onOutput(stdout, 'output');
      }
      if (stderr) {
        onOutput(stderr, 'error');
      }
      if (result !== undefined && result !== null) {
        onOutput(`→ ${result}`, 'output');
      }
    } catch (error) {
      onOutput(`Python Error: ${error}`, 'error');
    }
  };

  useEffect(() => {
    if (pyodide && code) {
      runCode();
    }
  }, [code, pyodide]);

  if (loading) {
    return <div>Loading Python environment...</div>;
  }

  return null;
};