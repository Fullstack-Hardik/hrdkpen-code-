import { useState, useCallback, useEffect } from 'react';
import { get, set } from 'idb-keyval';
import type { FileNode } from '@/types';
import { getLanguageFromFilename } from '@/lib/languages';
import { TEMPLATES } from '@/lib/templates';

const STORAGE_KEY = 'hrdkpen_workspace';

/** Recursively find a node by id */
function findNode(nodes: FileNode[], id: string): FileNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNode(node.children, id);
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
  const [files, setFiles] = useState<FileNode[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    get(STORAGE_KEY).then(val => {
      setFiles(val || []);
      setIsReady(true);
    }).catch(err => {
      console.error('Failed to load workspace from IndexedDB', err);
      setFiles([]);
      setIsReady(true);
    });
  }, []);

  const saveWorkspace = useCallback((updated: FileNode[]) => {
    set(STORAGE_KEY, updated).catch(err => console.error('Failed to save to IndexedDB', err));
  }, []);

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

  const importFolder = useCallback((items: { path: string; content: string }[]) => {
    setFiles(prev => {
      const root = [...prev];

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

      saveWorkspace(root);
      return root;
    });
  }, [saveWorkspace]);

  const findFile = useCallback((id: string) => findNode(files, id), [files]);

  const loadTemplate = useCallback(async (type: keyof typeof TEMPLATES) => {
    const nodes = TEMPLATES[type]();
    let updatedFiles: FileNode[] = [];
    let returnedFolderName = '';
    
    // We must use a Promise to wait for state update before returning
    await new Promise<void>(resolve => {
      setFiles(prev => {
        const templateName = `${type}-project`;
        let folderName = templateName;
        let counter = 1;
        
        const checkExists = (n: FileNode[], name: string): boolean => 
          n.some(f => f.name === name);
        
        while (checkExists(prev, folderName)) {
          folderName = `${templateName}-${counter++}`;
        }
        
        returnedFolderName = folderName;

        const newFolder: FileNode = {
          id: generateId('folder'),
          name: folderName,
          type: 'folder',
          children: nodes,
          isOpen: true,
        };

        updatedFiles = [...prev, newFolder];
        saveWorkspace(updatedFiles);
        resolve();
        return updatedFiles;
      });
    });
    
    return returnedFolderName;
  }, [saveWorkspace]);

  return {
    isReady,
    files,
    findFile,
    createFile,
    updateFileContent,
    renameFile,
    deleteFile,
    moveNode,
    importFolder,
    loadTemplate,
    setWorkspaceFiles: (newFiles: FileNode[]) => {
      setFiles(newFiles);
      saveWorkspace(newFiles);
    },
  };
}
