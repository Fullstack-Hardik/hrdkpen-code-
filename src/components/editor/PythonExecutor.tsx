import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Square, RotateCcw } from 'lucide-react';

interface PythonExecutorProps {
  code: string;
  onOutput: (output: string, type: 'output' | 'error') => void;
  onExecutionStart?: () => void;
  onExecutionEnd?: () => void;
}

export const PythonExecutor = ({ code, onOutput, onExecutionStart, onExecutionEnd }: PythonExecutorProps) => {
  const [pyodide, setPyodide] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    const initPyodide = async () => {
      if (pyodide) return;
      
      try {
        setIsLoading(true);
        onOutput('Initializing Python environment...', 'output');
        
        const { loadPyodide } = await import('pyodide');
        const pyodideInstance = await loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
        });
        
        // Install common packages
        await pyodideInstance.loadPackage(['numpy', 'matplotlib', 'pandas']);
        
        setPyodide(pyodideInstance);
        onOutput('✅ Python environment ready! NumPy, Matplotlib, and Pandas are available.', 'output');
      } catch (error) {
        onOutput(`❌ Failed to initialize Python: ${error}`, 'error');
      } finally {
        setIsLoading(false);
      }
    };

    initPyodide();
  }, []);

  const executeCode = async () => {
    if (!pyodide || !code.trim()) return;

    try {
      setIsExecuting(true);
      onExecutionStart?.();

      // Capture stdout and stderr
      pyodide.runPython(`
import sys
from io import StringIO
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt

# Capture output
sys.stdout = StringIO()
sys.stderr = StringIO()
      `);

      // Execute the user's code
      const startTime = performance.now();
      const result = pyodide.runPython(code);
      const endTime = performance.now();

      // Get captured output
      const stdout = pyodide.runPython('sys.stdout.getvalue()');
      const stderr = pyodide.runPython('sys.stderr.getvalue()');

      // Display output
      if (stdout) {
        onOutput(stdout, 'output');
      }
      if (stderr) {
        onOutput(stderr, 'error');
      }
      if (result !== undefined && result !== null) {
        onOutput(`→ ${result}`, 'output');
      }

      const executionTime = (endTime - startTime).toFixed(2);
      onOutput(`✅ Execution completed in ${executionTime}ms`, 'output');

    } catch (error) {
      onOutput(`❌ Python Error: ${error}`, 'error');
    } finally {
      setIsExecuting(false);
      onExecutionEnd?.();
    }
  };

  const stopExecution = () => {
    // Note: Pyodide doesn't support stopping execution directly
    // This would require a web worker implementation
    setIsExecuting(false);
    onOutput('⚠️ Execution stopped (restart environment to clear state)', 'output');
  };

  const restartEnvironment = async () => {
    setPyodide(null);
    onOutput('🔄 Restarting Python environment...', 'output');
  };

  return (
    <div className="flex items-center gap-2 p-2 border-t border-border bg-editor-sidebar">
      <Button
        onClick={executeCode}
        disabled={isLoading || isExecuting || !code.trim()}
        className="bg-green-600 hover:bg-green-700 text-white"
        size="sm"
      >
        <Play className="w-3 h-3 mr-1" />
        {isLoading ? 'Loading...' : isExecuting ? 'Running...' : 'Run Python'}
      </Button>

      {isExecuting && (
        <Button
          onClick={stopExecution}
          variant="destructive"
          size="sm"
        >
          <Square className="w-3 h-3 mr-1" />
          Stop
        </Button>
      )}

      <Button
        onClick={restartEnvironment}
        variant="outline"
        size="sm"
        title="Restart Python Environment"
      >
        <RotateCcw className="w-3 h-3" />
      </Button>

      <div className="text-xs text-editor-text-muted ml-auto">
        {isLoading ? 'Initializing...' : 
         isExecuting ? '🐍 Running...' : 
         pyodide ? '🐍 Ready' : '⚠️ Not ready'}
      </div>
    </div>
  );
};