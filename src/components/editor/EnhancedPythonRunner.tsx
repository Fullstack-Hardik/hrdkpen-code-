import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Square, RotateCcw, Terminal } from 'lucide-react';

interface PythonRunnerProps {
  code: string;
  onOutput: (output: string, type: 'output' | 'error') => void;
  onExecutionStart?: () => void;
  onExecutionEnd?: () => void;
}

export const EnhancedPythonRunner = ({ 
  code, 
  onOutput, 
  onExecutionStart, 
  onExecutionEnd 
}: PythonRunnerProps) => {
  const [pyodide, setPyodide] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const executionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializePython();
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
      if (executionTimeoutRef.current) {
        clearTimeout(executionTimeoutRef.current);
      }
    };
  }, []);

  const initializePython = async () => {
    if (pyodide) return;
    
    setIsLoading(true);
    onOutput('🐍 Initializing Python environment...', 'output');
    
    try {
      // Try multiple CDN sources for better reliability
      let pyodideInstance;
      const cdnSources = [
        'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/',
        'https://unpkg.com/pyodide@0.25.0/dist/',
        'https://cdn.pyodide.org/v0.25.0/full/'
      ];

      for (const indexURL of cdnSources) {
        try {
          onOutput(`📡 Trying to load from: ${indexURL}`, 'output');
          const { loadPyodide } = await import('pyodide');
          pyodideInstance = await loadPyodide({
            indexURL,
            stdout: (text: string) => onOutput(text, 'output'),
            stderr: (text: string) => onOutput(text, 'error'),
          });
          onOutput(`✅ Successfully loaded from: ${indexURL}`, 'output');
          break;
        } catch (err) {
          onOutput(`❌ Failed to load from ${indexURL}: ${err}`, 'error');
          if (indexURL === cdnSources[cdnSources.length - 1]) {
            throw err;
          }
        }
      }

      if (!pyodideInstance) {
        throw new Error('Failed to load from all CDN sources');
      }

      // Install common packages
      onOutput('📦 Installing Python packages...', 'output');
      try {
        await pyodideInstance.loadPackage(['numpy', 'matplotlib', 'pandas', 'sympy']);
        onOutput('✅ All packages installed successfully', 'output');
      } catch (err) {
        onOutput(`⚠️ Some packages failed to install: ${err}`, 'error');
        // Try to install essential packages only
        try {
          await pyodideInstance.loadPackage(['numpy']);
          onOutput('✅ Basic NumPy package installed', 'output');
        } catch (basicErr) {
          onOutput(`❌ Even basic packages failed: ${basicErr}`, 'error');
        }
      }
      
      // Setup environment
      pyodideInstance.runPython(`
import sys
import io
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

# Redirect stdout and stderr
_stdout = sys.stdout
_stderr = sys.stderr
      `);
      
      setPyodide(pyodideInstance);
      setIsReady(true);
      onOutput('✅ Python environment ready!', 'output');
      onOutput('Available packages: numpy, matplotlib, pandas, sympy', 'output');
    } catch (error) {
      onOutput(`❌ Failed to initialize Python: ${error}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const executeCode = async () => {
    if (!pyodide || !code.trim() || isExecuting) return;

    setIsExecuting(true);
    onExecutionStart?.();
    
    // Set execution timeout (30 seconds)
    executionTimeoutRef.current = setTimeout(() => {
      if (isExecuting) {
        setIsExecuting(false);
        onExecutionEnd?.();
        onOutput('⏰ Execution timed out (30s limit)', 'error');
      }
    }, 30000);

    try {
      // Clear previous output
      pyodide.runPython(`
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
plt.clf()  # Clear any previous plots
      `);

      onOutput(`🚀 Running Python code...`, 'output');
      
      // Execute the code
      const result = pyodide.runPython(code);
      
      // Get stdout and stderr
      const stdout = pyodide.runPython('sys.stdout.getvalue()');
      const stderr = pyodide.runPython('sys.stderr.getvalue()');
      
      // Check for matplotlib plots
      const hasPlot = pyodide.runPython(`
import matplotlib.pyplot as plt
len(plt.get_fignums()) > 0
      `);
      
      if (hasPlot) {
        // Save plot as base64 image
        const plotData = pyodide.runPython(`
import base64
from io import BytesIO
buf = BytesIO()
plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
buf.seek(0)
plot_data = base64.b64encode(buf.read()).decode()
plot_data
        `);
        onOutput(`📊 Plot generated:`, 'output');
        onOutput(`<img src="data:image/png;base64,${plotData}" style="max-width: 100%; height: auto;" />`, 'output');
      }
      
      if (stdout) {
        onOutput(stdout, 'output');
      }
      
      if (stderr) {
        onOutput(stderr, 'error');
      }
      
      if (result !== undefined && result !== null && !stdout && !stderr) {
        const resultStr = typeof result === 'object' 
          ? JSON.stringify(result, null, 2) 
          : String(result);
        onOutput(`→ ${resultStr}`, 'output');
      }
      
      onOutput('✅ Execution completed successfully', 'output');
      
    } catch (error: any) {
      // Enhanced error reporting
      let errorMsg = error.message || 'Unknown error';
      
      // Parse Python stack trace for better error reporting
      if (errorMsg.includes('Traceback')) {
        const lines = errorMsg.split('\n');
        const errorLine = lines.find(line => line.includes('line '));
        if (errorLine) {
          const lineNum = errorLine.match(/line (\d+)/)?.[1];
          if (lineNum) {
            onOutput(`❌ Error on line ${lineNum}:`, 'error');
          }
        }
      }
      
      onOutput(`❌ Python Error: ${errorMsg}`, 'error');
    } finally {
      if (executionTimeoutRef.current) {
        clearTimeout(executionTimeoutRef.current);
        executionTimeoutRef.current = null;
      }
      setIsExecuting(false);
      onExecutionEnd?.();
    }
  };

  const stopExecution = () => {
    if (executionTimeoutRef.current) {
      clearTimeout(executionTimeoutRef.current);
      executionTimeoutRef.current = null;
    }
    setIsExecuting(false);
    onExecutionEnd?.();
    onOutput('🛑 Execution stopped by user', 'output');
  };

  const restartEnvironment = async () => {
    if (pyodide) {
      setPyodide(null);
      setIsReady(false);
      onOutput('🔄 Restarting Python environment...', 'output');
      await initializePython();
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 border-b border-border bg-editor-sidebar">
      <div className="flex items-center gap-2">
        <Terminal className="w-4 h-4 text-blue-500" />
        <span className="text-sm font-medium">Python</span>
        
        <Badge 
          variant={isReady ? 'default' : isLoading ? 'secondary' : 'destructive'} 
          className="text-xs"
        >
          {isLoading ? 'Loading...' : isReady ? 'Ready' : 'Error'}
        </Badge>
      </div>
      
      <div className="flex items-center gap-1 ml-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={executeCode}
          disabled={!isReady || isExecuting || !code.trim()}
          className="h-7 px-2"
          title="Run Python Code (Ctrl+Enter)"
        >
          <Play className="w-3 h-3 mr-1" />
          {isExecuting ? 'Running...' : 'Run'}
        </Button>
        
        {isExecuting && (
          <Button
            variant="ghost"
            size="sm"
            onClick={stopExecution}
            className="h-7 px-2 text-red-500 hover:text-red-600"
            title="Stop Execution"
          >
            <Square className="w-3 h-3 mr-1" />
            Stop
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={restartEnvironment}
          disabled={isLoading}
          className="h-7 px-2"
          title="Restart Python Environment"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Restart
        </Button>
      </div>
    </div>
  );
};