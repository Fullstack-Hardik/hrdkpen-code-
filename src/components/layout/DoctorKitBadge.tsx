import { useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import type { HealthStatus, RepairLog } from '@/hooks/useDoctorKit';

interface DoctorKitBadgeProps {
  status: HealthStatus;
  logs: RepairLog[];
  lastScan: Date;
  onScan: () => void;
}

export const DoctorKitBadge = ({ status, logs, lastScan, onScan }: DoctorKitBadgeProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // If there are repair logs, show a warning badge, otherwise subtle green
  const hasRepairs = logs.some(l => l.type === 'repair' || l.type === 'error');

  const badgeColor = 
    status === 'scanning' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' :
    status === 'error' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
    hasRepairs ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' :
    'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';

  const Icon = 
    status === 'scanning' ? Activity :
    status === 'error' ? AlertTriangle :
    hasRepairs ? ShieldCheck :
    CheckCircle2;

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 right-4 z-50 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105 ${badgeColor}`}
        title="Doctor Kit (System Health)"
      >
        <Icon className={`w-3.5 h-3.5 ${status === 'scanning' ? 'animate-pulse' : ''}`} />
        <span className="text-[10px] font-bold tracking-wider uppercase">
          {status === 'scanning' ? 'Scanning' : 'Doctor Kit'}
        </span>
        {logs.length > 0 && !isOpen && (
           <span className="ml-1 px-1.5 py-0.5 rounded-full bg-editor-panel text-[9px]">
             {logs.length}
           </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-14 right-4 z-50 w-80 max-h-[400px] flex flex-col bg-editor-panel border border-editor-border rounded-xl shadow-2xl overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between p-3 border-b border-editor-border bg-editor-sidebar">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-semibold text-editor-text">Doctor Kit Logs</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 rounded-md text-editor-text-muted hover:text-editor-text hover:bg-editor-active-tab transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-3 bg-editor-bg border-b border-editor-border flex-shrink-0 flex items-center justify-between">
             <span className="text-xs text-editor-text-muted">
                Last scan: {lastScan.toLocaleTimeString()}
             </span>
             <button
               onClick={onScan}
               disabled={status === 'scanning'}
               className="px-2 py-1 bg-editor-active-tab hover:bg-editor-border text-xs rounded text-editor-text transition-colors disabled:opacity-50"
             >
               Scan Now
             </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {logs.length === 0 ? (
              <div className="p-4 text-center text-xs text-editor-text-muted">
                No logs yet. System is healthy.
              </div>
            ) : (
              logs.map(log => (
                <div key={log.id} className="flex gap-2 p-2 rounded hover:bg-editor-active-tab transition-colors">
                  <div className="flex-shrink-0 mt-0.5">
                    {log.type === 'repair' ? <ShieldCheck className="w-3.5 h-3.5 text-yellow-400" /> :
                     log.type === 'error' ? <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> :
                     <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs text-editor-text leading-relaxed break-words">{log.message}</span>
                    <span className="text-[9px] text-editor-text-dim mt-0.5">{log.timestamp.toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
};
