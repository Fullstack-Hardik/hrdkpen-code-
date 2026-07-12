import { WebContainer } from '@webcontainer/api';
import { getLanguageFromFilename } from './languages';

/**
 * Singleton instance of the WebContainer.
 * We only want to boot this once per page load.
 * We store this on the window object to survive Vite HMR reloads.
 */
declare global {
  interface Window {
    __WEBCONTAINER_INSTANCE__?: WebContainer;
    __WEBCONTAINER_PROMISE__?: Promise<WebContainer>;
  }
}

export async function getWebContainer(): Promise<WebContainer> {
  if (window.__WEBCONTAINER_INSTANCE__) {
    return window.__WEBCONTAINER_INSTANCE__;
  }

  if (!window.__WEBCONTAINER_PROMISE__) {
    window.__WEBCONTAINER_PROMISE__ = (async () => {
      try {
        console.log('Booting WebContainer...');
        const instance = await WebContainer.boot();
        console.log('WebContainer booted successfully.');
        window.__WEBCONTAINER_INSTANCE__ = instance;
        return instance;
      } catch (error: any) {
        console.error('Failed to boot WebContainer:', error);
        // If it says it's already booted but we lost the instance, we can't easily recover
        // without a full page reload, but let's clear the promise to allow retry if possible.
        window.__WEBCONTAINER_PROMISE__ = undefined;
        if (error?.message?.includes('Only a single WebContainer instance can be booted')) {
           console.warn('Orphaned WebContainer instance detected during HMR. Reloading page to recover...');
           window.location.reload();
        }
        throw error;
      }
    })();
  }

  return window.__WEBCONTAINER_PROMISE__;
}

export async function clearWebContainerFS() {
  const wc = await getWebContainer();
  try {
    const entries = await wc.fs.readdir('/', { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name !== '.' && entry.name !== '..') {
        await wc.fs.rm('/' + entry.name, { recursive: true });
      }
    }
  } catch (err) {
    console.error('Failed to clear WebContainer FS:', err);
  }
}

export async function syncFileSystem(nodes: import('@/types').FileNode[]) {
  const wc = await getWebContainer();
  const tree = buildTree(nodes);
  await clearWebContainerFS();
  await wc.mount(tree);
}

function buildTree(nodes: import('@/types').FileNode[]): import('@webcontainer/api').FileSystemTree {
  const tree: import('@webcontainer/api').FileSystemTree = {};
  for (const node of nodes) {
    if (node.type === 'file') {
      tree[node.name] = {
        file: { contents: node.content || '' },
      };
    } else if (node.type === 'folder' && node.children) {
      tree[node.name] = {
        directory: buildTree(node.children),
      };
    }
  }
  return tree;
}

export async function readWebContainerFS(existingNodes: import('@/types').FileNode[] = []): Promise<import('@/types').FileNode[]> {
  const wc = await getWebContainer();
  const ignoreList = ['node_modules', '.git', 'dist', '.next', '.nuxt', 'build', '.static-server.js'];

  // Build a map of existing paths to IDs to preserve tab state
  const pathIdMap = new Map<string, string>();
  const buildPathMap = (nodes: import('@/types').FileNode[], currentPath = '') => {
    for (const node of nodes) {
      const fullPath = currentPath ? `${currentPath}/${node.name}` : `/${node.name}`;
      pathIdMap.set(fullPath, node.id);
      if (node.type === 'folder' && node.children) {
        buildPathMap(node.children, fullPath);
      }
    }
  };
  buildPathMap(existingNodes);

  async function readDirRecursive(path: string): Promise<import('@/types').FileNode[]> {
    try {
      const entries = await wc.fs.readdir(path, { withFileTypes: true });
      const nodes: import('@/types').FileNode[] = [];

      for (const entry of entries) {
        if (ignoreList.includes(entry.name)) continue;

        const fullPath = path === '/' ? `/${entry.name}` : `${path}/${entry.name}`;
        const existingId = pathIdMap.get(fullPath) || crypto.randomUUID();

        if (entry.isDirectory()) {
          const children = await readDirRecursive(fullPath);
          nodes.push({
            id: existingId,
            name: entry.name,
            type: 'folder',
            children,
          });
        } else {
          const contents = await wc.fs.readFile(fullPath, 'utf-8');
          nodes.push({
            id: existingId,
            name: entry.name,
            type: 'file',
            content: contents,
            language: getLanguageFromFilename(entry.name),
          });
        }
      }
      return nodes;
    } catch (err) {
      console.warn('Failed to read dir:', path, err);
      return [];
    }
  }

  return await readDirRecursive('/');
}
