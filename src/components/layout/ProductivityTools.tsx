import { useState, useEffect, useRef } from 'react';
import { Clock, Play, Square, Timer, X } from 'lucide-react';

export const ProductivityTools = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  
  // Stopwatch state
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  
  const stopwatchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Session timer (always running)
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Stopwatch timer
  useEffect(() => {
    if (stopwatchRunning) {
      stopwatchTimerRef.current = setInterval(() => {
        setStopwatchSeconds(s => s + 1);
      }, 1000);
    } else if (stopwatchTimerRef.current) {
      clearInterval(stopwatchTimerRef.current);
    }
    return () => {
      if (stopwatchTimerRef.current) clearInterval(stopwatchTimerRef.current);
    };
  }, [stopwatchRunning]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatStopwatch = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors text-xs font-mono
          ${isOpen ? 'bg-editor-active-tab text-editor-text' : 'text-editor-text-muted hover:text-editor-text hover:bg-editor-active-tab'}`}
        title="Productivity Tools"
      >
        <Clock className="w-3.5 h-3.5" />
        {formatTime(sessionSeconds)}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-editor-panel border border-editor-border rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between p-3 border-b border-editor-border bg-editor-sidebar">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-editor-text">Productivity</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 rounded-md text-editor-text-muted hover:text-editor-text hover:bg-editor-active-tab transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Session Timer */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-editor-text">Session Duration</span>
                <span className="text-[10px] text-editor-text-muted">Time spent coding today</span>
              </div>
              <span className="text-sm font-mono text-blue-400 font-bold bg-blue-500/10 px-2 py-1 rounded">
                {formatTime(sessionSeconds)}
              </span>
            </div>

            <div className="w-full h-px bg-editor-border" />

            {/* Stopwatch */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-editor-text">Task Stopwatch</span>
                <span className="text-lg font-mono text-emerald-400 font-bold tabular-nums">
                  {formatStopwatch(stopwatchSeconds)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStopwatchRunning(!stopwatchRunning)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-medium transition-colors ${
                    stopwatchRunning 
                      ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' 
                      : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                  }`}
                >
                  {stopwatchRunning ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {stopwatchRunning ? 'Stop' : 'Start'}
                </button>
                <button
                  onClick={() => {
                    setStopwatchRunning(false);
                    setStopwatchSeconds(0);
                  }}
                  disabled={stopwatchSeconds === 0 && !stopwatchRunning}
                  className="px-3 py-1.5 bg-editor-active-tab hover:bg-editor-border text-xs rounded text-editor-text transition-colors disabled:opacity-50"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
