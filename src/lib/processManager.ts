import { getWebContainer } from './webcontainer';
import type { WebContainerProcess } from '@webcontainer/api';

export type ProcessStatus = 'idle' | 'installing' | 'running' | 'error' | 'stopped';

export interface ManagedProcess {
  id: string;
  projectId: string;
  command: string;
  status: ProcessStatus;
  process?: WebContainerProcess;
  port?: number;
  url?: string;
  output: string[];
}

type Listener = (processes: ManagedProcess[]) => void;

class ProcessManager {
  private processes: Map<string, ManagedProcess> = new Map();
  private listeners: Set<Listener> = new Set();
  private serverReadyListenerAdded = false;

  constructor() {
    this.setupServerReady();
  }

  private async setupServerReady() {
    if (this.serverReadyListenerAdded) return;
    try {
      const wc = await getWebContainer();
      wc.on('server-ready', (port, url) => {
        // Find the active 'dev' process and assign port/url
        for (const [id, proc] of this.processes.entries()) {
          if (proc.status === 'running' || proc.command.includes('dev') || proc.command.includes('start')) {
            this.processes.set(id, { ...proc, port, url, status: 'running' });
            this.notify();
          }
        }
      });
      this.serverReadyListenerAdded = true;
    } catch (e) {
      console.error('ProcessManager failed to setup server-ready:', e);
    }
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    listener(this.getAll());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const list = this.getAll();
    for (const listener of this.listeners) {
      listener(list);
    }
  }

  getAll(): ManagedProcess[] {
    return Array.from(this.processes.values());
  }

  get(id: string): ManagedProcess | undefined {
    return this.processes.get(id);
  }

  getByProject(projectId: string): ManagedProcess[] {
    return this.getAll().filter(p => p.projectId === projectId);
  }

  async spawn(projectId: string, cmd: string, args: string[] = []): Promise<{ id: string; exit: Promise<number> }> {
    const wc = await getWebContainer();
    const id = `${projectId}-${cmd}-${Date.now()}`;
    
    // Determine initial status based on command
    let initialStatus: ProcessStatus = 'running';
    if (cmd === 'npm' && args[0] === 'install') initialStatus = 'installing';
    
    const newProc: ManagedProcess = {
      id,
      projectId,
      command: `${cmd} ${args.join(' ')}`.trim(),
      status: initialStatus,
      output: []
    };
    this.processes.set(id, newProc);
    this.notify();

    try {
      const process = await wc.spawn(cmd, args);
      newProc.process = process;
      this.notify();

      process.output.pipeTo(
        new WritableStream({
          write: (data) => {
            const p = this.processes.get(id);
            if (p) {
              p.output.push(data);
              // Keep only last 1000 lines for memory
              if (p.output.length > 1000) p.output.shift();
              this.notify();
            }
          }
        })
      );

      const exitPromise = process.exit.then((code) => {
        const p = this.processes.get(id);
        if (p) {
          p.status = code === 0 ? 'stopped' : 'error';
          p.process = undefined;
          this.notify();
        }
        return code;
      });

      return { id, exit: exitPromise };
    } catch (err) {
      newProc.status = 'error';
      newProc.output.push(`\x1b[31mFailed to spawn: ${String(err)}\x1b[0m`);
      this.notify();
      return { id, exit: Promise.resolve(1) };
    }
  }

  async kill(id: string) {
    const proc = this.processes.get(id);
    if (proc?.process) {
      proc.process.kill();
      proc.status = 'stopped';
      proc.process = undefined;
      this.notify();
    }
  }

  async killAll(projectId: string) {
    const procs = this.getByProject(projectId);
    for (const p of procs) {
      if (p.process) {
        p.process.kill();
      }
      this.processes.delete(p.id);
    }
    this.notify();
  }
}

export const processManager = new ProcessManager();
