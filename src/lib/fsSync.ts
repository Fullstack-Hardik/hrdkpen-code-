import { getWebContainer, readWebContainerFS } from './webcontainer';
import type { FileNode } from '@/types';

type SyncListener = (files: FileNode[]) => void;

class FSSyncService {
  private listener: SyncListener | null = null;
  private getCurrentFiles: (() => FileNode[]) | null = null;
  private isWatching = false;
  private watchDebounceTimer: any = null;

  async startWatching() {
    if (this.isWatching) return;
    try {
      const wc = await getWebContainer();
      
      if (typeof wc.fs.watch === 'function') {
         try {
           const watcher = wc.fs.watch('/', { recursive: true }, (event, filename) => {
              if (filename && (filename.includes('node_modules') || filename.includes('.git'))) {
                 return;
              }
              this.scheduleSync();
           });
           this.isWatching = true;
         } catch (e) {
           console.warn('Recursive fs.watch failed, falling back to polling.', e);
           this.startPolling();
         }
      } else {
        this.startPolling();
      }
    } catch (e) {
      console.error('Failed to start FSSyncService:', e);
    }
  }

  private startPolling() {
    this.isWatching = true;
    setInterval(() => {
      this.scheduleSync();
    }, 3000); // Poll every 3 seconds
  }

  private scheduleSync() {
    if (this.watchDebounceTimer) clearTimeout(this.watchDebounceTimer);
    this.watchDebounceTimer = setTimeout(async () => {
      await this.forceSync();
    }, 500); // 500ms debounce
  }

  async forceSync() {
    try {
      const existing = this.getCurrentFiles ? this.getCurrentFiles() : [];
      const nodes = await readWebContainerFS(existing);
      if (this.listener) this.listener(nodes);
    } catch (e) {
      console.error('FSSyncService forceSync failed:', e);
    }
  }

  subscribe(listener: SyncListener, getCurrentFiles: () => FileNode[]) {
    this.listener = listener;
    this.getCurrentFiles = getCurrentFiles;
    // Trigger initial sync
    this.forceSync();
    return () => {
      this.listener = null;
      this.getCurrentFiles = null;
    };
  }
}

export const fsSyncService = new FSSyncService();
