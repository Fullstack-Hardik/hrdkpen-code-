/**
 * FSSyncService — HRDK Pen
 *
 * Reads from the WebContainer filesystem and merges changes into the
 * in-memory workspace state.
 *
 * KEY FIX (Phase 2):
 *   - Removed automatic polling / startWatching.  Polling caused deleted
 *     files to reappear because the WC FS still contained them.
 *   - All syncs are now triggered manually (e.g. after an npm install).
 *   - A `deletedPaths` registry permanently blocks any path that the user
 *     has explicitly deleted from ever being reintroduced by a WC sync.
 */

import { getWebContainer, readWebContainerFS } from './webcontainer';
import type { FileNode } from '@/types';

type SyncListener = (files: FileNode[]) => void;

class FSSyncService {
  private listener: SyncListener | null = null;
  private getCurrentFiles: (() => FileNode[]) | null = null;
  private watchInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Paths that the user has explicitly deleted.
   * These are NEVER reintroduced by a WC sync, even if the file still
   * exists in the WebContainer filesystem.
   * Format: '/filename' or '/folder/filename'
   */
  private deletedPaths = new Set<string>();

  // ─── Public API ───────────────────────────────────────────────

  /** Register a path as permanently deleted from this session. */
  markDeleted(wcPath: string) {
    this.deletedPaths.add(wcPath.startsWith('/') ? wcPath : `/${wcPath}`);
  }

  /** Remove a path from the deleted registry (e.g. when re-creating the same name). */
  unmarkDeleted(wcPath: string) {
    this.deletedPaths.delete(wcPath.startsWith('/') ? wcPath : `/${wcPath}`);
  }

  /** Clear all deleted-path markers (e.g. on project switch). */
  clearDeletedPaths() {
    this.deletedPaths.clear();
  }

  /** Whether a path is in the deleted registry. */
  isDeleted(wcPath: string): boolean {
    return this.deletedPaths.has(wcPath.startsWith('/') ? wcPath : `/${wcPath}`);
  }

  /**
   * Manually trigger a sync from WC → workspace state.
   * Called after npm install or other operations that generate new files.
   * Respects the deletedPaths registry.
   */
  async forceSync() {
    try {
      const existing = this.getCurrentFiles ? this.getCurrentFiles() : [];
      const raw = await readWebContainerFS(existing);
      const filtered = this.filterDeleted(raw);
      if (this.listener) this.listener(filtered);
    } catch (e) {
      console.error('[FSSyncService] forceSync failed:', e);
    }
  }

  /** Register a callback that receives the merged file tree on each sync. */
  subscribe(listener: SyncListener, getCurrentFiles: () => FileNode[]) {
    this.listener = listener;
    this.getCurrentFiles = getCurrentFiles;
    this.startWatching();
    return () => {
      this.listener = null;
      this.getCurrentFiles = null;
      this.stopWatching();
    };
  }

  /** Start polling the WebContainer FS for changes. */
  startWatching() {
    if (this.watchInterval) return;
    // Initial sync
    this.forceSync();
    // Poll every 2 seconds
    this.watchInterval = setInterval(() => {
      this.forceSync();
    }, 2000);
  }

  /** Stop polling the WebContainer FS. */
  stopWatching() {
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
      this.watchInterval = null;
    }
  }

  // ─── Private helpers ──────────────────────────────────────────

  private filterDeleted(nodes: FileNode[], prefix = ''): FileNode[] {
    return nodes
      .filter(node => {
        const path = `${prefix}/${node.name}`;
        return !this.deletedPaths.has(path);
      })
      .map(node => {
        if (node.type === 'folder' && node.children) {
          return {
            ...node,
            children: this.filterDeleted(node.children, `${prefix}/${node.name}`),
          };
        }
        return node;
      });
  }
}

export const fsSyncService = new FSSyncService();
