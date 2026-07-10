import JSZip from 'jszip';
import type { FileNode } from '@/types';

function addFilesToZip(zip: JSZip, nodes: FileNode[], currentPath: string = '') {
  for (const node of nodes) {
    if (node.type === 'file') {
      zip.file(`${currentPath}${node.name}`, node.content || '');
    } else if (node.type === 'folder' && node.children) {
      const folder = zip.folder(`${currentPath}${node.name}`);
      if (folder) {
        addFilesToZip(folder, node.children, '');
      }
    }
  }
}

export async function downloadProject(files: FileNode[], projectName: string = 'hrdk-pen-project') {
  const zip = new JSZip();
  addFilesToZip(zip, files);
  
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${projectName}.zip`;
  a.click();
  
  URL.revokeObjectURL(url);
}

export async function publishProject(files: FileNode[], details?: any): Promise<string> {
  // In a real app, we would send the zipped blob or file tree to a backend
  // For now, we simulate a network delay and return a mock URL.
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`https://hrdkpen.vercel.app/p/${Math.random().toString(36).substring(7)}`);
    }, 1500);
  });
}
