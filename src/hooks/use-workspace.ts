import { useState, useCallback, useEffect, useRef } from 'react';
import { get, set } from 'idb-keyval';
import type { FileNode } from '@/types';
import { getLanguageFromFilename } from '@/lib/languages';
import { TEMPLATES } from '@/lib/templates';

const PROJECTS_KEY = 'hrdkpen_projects';
const ACTIVE_PROJECT_KEY = 'hrdkpen_active_project';
const WORKSPACE_PREFIX = 'hrdkpen_workspace_';
const LEGACY_STORAGE_KEY = 'hrdkpen_workspace';

export interface ProjectMeta {
  id: string;
  name: string;
  lastOpened: number;
}

/** Recursively find a node by id */
export function findNode(nodes: FileNode[], id: string): FileNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

/** Recursively find a node path by id */
export function findNodePath(nodes: FileNode[], id: string, currentPath = ''): string | null {
  for (const node of nodes) {
    const fullPath = currentPath ? `${currentPath}/${node.name}` : node.name;
    if (node.id === id) return fullPath;
    if (node.children) {
      const found = findNodePath(node.children, id, fullPath);
      if (found) return found;
    }
  }
  return null;
}

/** Recursively update content of a file node */
function updateContent(nodes: FileNode[], id: string, content: string): FileNode[] {
  return nodes.map(node => {
    if (node.id === id) return { ...node, content };
    if (node.children) return { ...node, children: updateContent(node.children, id, content) };
    return node;
  });
}

/** Recursively rename a node */
function renameNode(nodes: FileNode[], id: string, newName: string): FileNode[] {
  return nodes.map(node => {
    if (node.id === id) {
      return {
        ...node,
        name: newName,
        language: node.type === 'file' ? getLanguageFromFilename(newName) : node.language,
      };
    }
    if (node.children) return { ...node, children: renameNode(node.children, id, newName) };
    return node;
  });
}

/** Recursively delete a node */
function deleteNode(nodes: FileNode[], id: string): FileNode[] {
  return nodes
    .filter(node => node.id !== id)
    .map(node =>
      node.children ? { ...node, children: deleteNode(node.children, id) } : node
    );
}

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function useWorkspace() {
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [files, setFiles] = useState<FileNode[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let unmounted = false;
    async function load() {
      try {
        let projs = await get<ProjectMeta[]>(PROJECTS_KEY);
        let activeId = await get<string>(ACTIVE_PROJECT_KEY);

        // Migration from legacy single project
        const legacyWorkspace = await get<FileNode[]>(LEGACY_STORAGE_KEY);
        if (legacyWorkspace && (!projs || projs.length === 0)) {
          const id = generateId('proj');
          projs = [{ id, name: 'Legacy Project', lastOpened: Date.now() }];
          await set(WORKSPACE_PREFIX + id, legacyWorkspace);
          await set(PROJECTS_KEY, projs);
          activeId = id;
          await set(ACTIVE_PROJECT_KEY, id);
        }

        if (unmounted) return;
        setProjects(projs || []);

        if (activeId && projs?.find(p => p.id === activeId)) {
          setActiveProjectId(activeId);
          const val = await get<FileNode[]>(WORKSPACE_PREFIX + activeId);
          setFiles(val || []);
        } else if (projs && projs.length > 0) {
          // Open the most recently opened
          const sorted = [...projs].sort((a, b) => b.lastOpened - a.lastOpened);
          setActiveProjectId(sorted[0].id);
          const val = await get<FileNode[]>(WORKSPACE_PREFIX + sorted[0].id);
          setFiles(val || []);
        }
        setIsReady(true);
      } catch (err) {
        console.error('Failed to load workspace', err);
        if (!unmounted) setIsReady(true);
      }
    }
    load();
    return () => { unmounted = true; };
  }, []);

  const saveTimeoutRef = useRef<any>(null);
  const saveWorkspace = useCallback((updated: FileNode[], pid = activeProjectId) => {
    if (!pid) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      set(WORKSPACE_PREFIX + pid, updated).catch(err => console.error('Failed to save to IndexedDB', err));
    }, 1000);
  }, [activeProjectId]);

  const switchProject = useCallback(async (id: string) => {
    setIsReady(false);
    setActiveProjectId(id);
    await set(ACTIVE_PROJECT_KEY, id);
    const val = await get<FileNode[]>(WORKSPACE_PREFIX + id);
    setFiles(val || []);
    
    setProjects(prev => {
      const next = prev.map(p => p.id === id ? { ...p, lastOpened: Date.now() } : p);
      set(PROJECTS_KEY, next).catch(console.error);
      return next;
    });
    
    setIsReady(true);
  }, []);

  const renameProject = useCallback(async (id: string, newName: string) => {
    setProjects(prev => {
      const next = prev.map(p => p.id === id ? { ...p, name: newName } : p);
      set(PROJECTS_KEY, next).catch(console.error);
      return next;
    });
  }, []);

  const copyProject = useCallback(async (id: string) => {
    const projToCopy = projects.find(p => p.id === id);
    if (!projToCopy) return;

    const sourceFiles = await get<FileNode[]>(WORKSPACE_PREFIX + id);
    const newId = generateId('proj');
    const newName = `${projToCopy.name} - Copy`;

    await set(WORKSPACE_PREFIX + newId, sourceFiles || []);
    setProjects(prev => {
      const next = [...prev, { id: newId, name: newName, lastOpened: Date.now() }];
      set(PROJECTS_KEY, next).catch(console.error);
      return next;
    });
    
    // Switch to the newly copied project
    await switchProject(newId);
  }, [projects, switchProject]);

  const createProject = useCallback(async (name: string, nodes: FileNode[]) => {
    const id = generateId('proj');
    const newProj: ProjectMeta = { id, name, lastOpened: Date.now() };
    
    setProjects(prev => {
      const next = [...prev, newProj];
      set(PROJECTS_KEY, next).catch(console.error);
      return next;
    });
    
    await set(WORKSPACE_PREFIX + id, nodes);
    await switchProject(id);
    return id;
  }, [switchProject]);

  const deleteProject = useCallback(async (id: string) => {
    setProjects(prev => {
      const next = prev.filter(p => p.id !== id);
      set(PROJECTS_KEY, next).catch(console.error);
      return next;
    });
    if (activeProjectId === id) {
      setActiveProjectId(null);
      await set(ACTIVE_PROJECT_KEY, null);
      setFiles([]);
    }
  }, [activeProjectId]);

  const createFile = useCallback((
    name: string,
    type: 'file' | 'folder',
    parentId?: string
  ) => {
    const node: FileNode = {
      id: generateId(type),
      name,
      type,
      content: type === 'file' ? '' : undefined,
      language: type === 'file' ? getLanguageFromFilename(name) : undefined,
      children: type === 'folder' ? [] : undefined,
    };

    setFiles(prev => {
      let updated: FileNode[];
      if (!parentId) {
        updated = [...prev, node];
      } else {
        const insertInto = (nodes: FileNode[]): FileNode[] =>
          nodes.map(n =>
            n.id === parentId && n.type === 'folder'
              ? { ...n, children: [...(n.children ?? []), node], isOpen: true }
              : n.children
              ? { ...n, children: insertInto(n.children) }
              : n
          );
        updated = insertInto(prev);
      }
      saveWorkspace(updated);
      return updated;
    });

    return node;
  }, [saveWorkspace]);

  const updateFileContent = useCallback((id: string, content: string) => {
    setFiles(prev => {
      const updated = updateContent(prev, id, content);
      saveWorkspace(updated);
      return updated;
    });
  }, [saveWorkspace]);

  const renameFile = useCallback((id: string, newName: string) => {
    setFiles(prev => {
      const updated = renameNode(prev, id, newName);
      saveWorkspace(updated);
      return updated;
    });
  }, [saveWorkspace]);

  const deleteFile = useCallback((id: string) => {
    setFiles(prev => {
      const updated = deleteNode(prev, id);
      saveWorkspace(updated);
      return updated;
    });
  }, [saveWorkspace]);

  const moveNode = useCallback((dragId: string, targetFolderId: string | null) => {
    setFiles(prev => {
      let dragged: FileNode | null = null;

      const remove = (nodes: FileNode[]): FileNode[] =>
        nodes
          .filter(n => {
            if (n.id === dragId) { dragged = n; return false; }
            return true;
          })
          .map(n => n.children ? { ...n, children: remove(n.children) } : n);

      const removed = remove([...prev]);
      if (!dragged) return prev;

      const insert = (nodes: FileNode[]): FileNode[] => {
        if (targetFolderId === null) return [...nodes, dragged!];
        return nodes.map(n => {
          if (n.id === targetFolderId && n.type === 'folder') {
            return { ...n, children: [...(n.children ?? []), dragged!] };
          }
          if (n.children) return { ...n, children: insert(n.children) };
          return n;
        });
      };

      const updated = insert(removed);
      saveWorkspace(updated);
      return updated;
    });
  }, [saveWorkspace]);

  const importFolder = useCallback(async (items: { path: string; content: string }[], projectName = 'Imported Project') => {
    const root: FileNode[] = [];
    const ensureFolder = (segments: string[], nodes: FileNode[]): FileNode[] => {
      if (!segments.length) return nodes;
      const [head, ...tail] = segments;
      let folder = nodes.find(n => n.type === 'folder' && n.name === head);
      if (!folder) {
        folder = { id: generateId('folder'), name: head, type: 'folder', children: [], isOpen: true };
        nodes.push(folder);
      }
      folder.children = ensureFolder(tail, folder.children ?? []);
      return nodes;
    };

    for (const { path, content } of items) {
      const parts = path.split('/').filter(Boolean);
      const fileName = parts.pop()!;
      ensureFolder(parts, root);
      let nodes = root;
      for (const seg of parts) {
        const next = nodes.find(n => n.type === 'folder' && n.name === seg) as FileNode;
        nodes = next.children!;
      }
      nodes.push({
        id: generateId('file'),
        name: fileName,
        type: 'file',
        content,
        language: getLanguageFromFilename(fileName),
      });
    }

    await createProject(projectName, root);
  }, [createProject]);

  const findFile = useCallback((id: string) => findNode(files, id), [files]);
  const findFilePath = useCallback((id: string) => findNodePath(files, id), [files]);

  const loadTemplate = useCallback(async (type: keyof typeof TEMPLATES | 'empty') => {
    let nodes: FileNode[] = [];
    let needsInstall = false;

    // For Node/React/Express, we want to create an empty project and run real commands
    if (type === 'react' || type === 'node' || type === 'express') {
      nodes = []; // Empty project, will be scaffolded by processManager
      needsInstall = true;
    } else if (type !== 'empty') {
      nodes = TEMPLATES[type]();
    }

    const templateName = type === 'empty' ? 'Empty Project' : `${type}-project`;
    
    // Find unique name across all projects
    let projName = templateName;
    let counter = 1;
    while (projects.some(p => p.name === projName)) {
      projName = `${templateName}-${counter++}`;
    }
    
    const id = await createProject(projName, nodes);
    return { id, projName, type, needsInstall };
  }, [createProject, projects]);

  return {
    isReady,
    projects,
    activeProjectId,
    files,
    findFile,
    findFilePath,
    createFile,
    updateFileContent,
    renameFile,
    deleteFile,
    moveNode,
    importFolder,
    loadTemplate,
    switchProject,
    deleteProject,
    createProject,
    renameProject,
    copyProject,
    setWorkspaceFiles: useCallback((newFiles: FileNode[]) => {
      setFiles(newFiles);
      saveWorkspace(newFiles);
    }, [saveWorkspace]),
  };
}
