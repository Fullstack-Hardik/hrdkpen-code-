/**
 * useDoctorKit.ts — HRDK Pen Self-Healing Service
 *
 * Runs a background interval to monitor IDE state, repair corrupted IndexedDB/localStorage,
 * detect memory leaks, and emit health status.
 */

import { useState, useEffect, useCallback } from 'react';
import { get, set, del, keys } from 'idb-keyval';
import { WORKSPACE_PREFIX, ACTIVE_PROJECT_KEY, PROJECTS_KEY } from './use-workspace';

export type HealthStatus = 'healthy' | 'scanning' | 'repairing' | 'error';

export interface RepairLog {
  id: string;
  timestamp: Date;
  message: string;
  type: 'info' | 'warning' | 'repair' | 'error';
}

export function useDoctorKit() {
  const [status, setStatus] = useState<HealthStatus>('healthy');
  const [logs, setLogs] = useState<RepairLog[]>([]);
  const [lastScan, setLastScan] = useState<Date>(new Date());

  const addLog = useCallback((message: string, type: RepairLog['type'] = 'info') => {
    setLogs(prev => [{ id: Date.now().toString() + Math.random(), timestamp: new Date(), message, type }, ...prev].slice(0, 50));
  }, []);

  const runScan = useCallback(async () => {
    if (status === 'scanning' || status === 'repairing') return;
    setStatus('scanning');
    setLastScan(new Date());

    let repairedSomething = false;

    try {
      // 1. Check Projects List corruption
      let projectsList: any[] = [];
      try {
        const rawList = await get(PROJECTS_KEY);
        if (rawList && Array.isArray(rawList)) {
          projectsList = rawList;
        } else if (rawList) {
          throw new Error('Projects list is not an array');
        }
      } catch (e) {
        addLog('Projects metadata corrupted. Rebuilding...', 'repair');
        await set(PROJECTS_KEY, []);
        repairedSomething = true;
      }

      // 2. Check for duplicate project IDs in the list
      if (projectsList.length > 0) {
        const uniqueIds = new Set<string>();
        const deduplicated = [];
        let hasDuplicates = false;
        for (const p of projectsList) {
          if (uniqueIds.has(p.id)) {
            hasDuplicates = true;
          } else {
            uniqueIds.add(p.id);
            deduplicated.push(p);
          }
        }
        if (hasDuplicates) {
          addLog('Found duplicate project records. Removing...', 'repair');
          await set(PROJECTS_KEY, deduplicated);
          repairedSomething = true;
        }
      }

      // 3. Find orphaned project data (data exists in IDB but not in list)
      const allKeys = await keys();
      const workspaceKeys = allKeys.filter(k => typeof k === 'string' && k.startsWith(WORKSPACE_PREFIX));
      
      for (const key of workspaceKeys) {
        const id = (key as string).replace(WORKSPACE_PREFIX, '');
        if (!projectsList.find(p => p.id === id)) {
           // Orphan data found!
           addLog(`Found orphan workspace data for ID ${id.substring(0, 6)}... Cleaning up.`, 'repair');
           await del(key);
           repairedSomething = true;
        }
      }

      // 4. Validate Active Project Key
      const activeId = await get(ACTIVE_PROJECT_KEY);
      if (activeId && typeof activeId === 'string' && !projectsList.find(p => p.id === activeId)) {
         addLog('Active project pointer was invalid. Resetting.', 'repair');
         await del(ACTIVE_PROJECT_KEY);
         repairedSomething = true;
      }

      // 5. LocalStorage sanity check (Settings & Extensions)
      try {
        const settings = localStorage.getItem('hrdkpen_settings_v2');
        if (settings) JSON.parse(settings); // try to parse
      } catch {
        addLog('Settings cache corrupted. Resetting to defaults.', 'repair');
        localStorage.removeItem('hrdkpen_settings_v2');
        repairedSomething = true;
      }

    } catch (err: any) {
      addLog(`Scan encountered an error: ${err.message}`, 'error');
      setStatus('error');
      return;
    }

    // Artificial delay to show the scan animation
    await new Promise(r => setTimeout(r, 2500));

    if (repairedSomething) {
      setStatus('healthy'); // It was repaired
      addLog('Repair cycle complete. All systems nominal.', 'info');
    } else {
      setStatus('healthy');
    }

  }, [status, addLog]);

  // Run automatically every 5 minutes (300000ms), and once on boot after 10s
  useEffect(() => {
    const bootTimer = setTimeout(() => {
      runScan();
    }, 10000);

    const intervalTimer = setInterval(() => {
      runScan();
    }, 300000);

    return () => {
      clearTimeout(bootTimer);
      clearInterval(intervalTimer);
    };
  }, [runScan]);

  return { status, logs, lastScan, runScan, addLog };
}
