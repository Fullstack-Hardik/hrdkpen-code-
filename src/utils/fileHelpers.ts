export const detectLanguageFromExtension = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'html': 'html',
    'css': 'css',
    'json': 'json',
    'xml': 'xml',
    'md': 'markdown',
  };
  
  return languageMap[ext || ''] || 'plaintext';
};

export const saveFileTimeline = (fileId: string, content: string, description: string, type: 'edit' | 'create' | 'rename') => {
  const timeline = JSON.parse(localStorage.getItem(`timeline_${fileId}`) || '[]');
  
  timeline.push({
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    content,
    type,
    description
  });
  
  // Keep only last 50 entries
  if (timeline.length > 50) {
    timeline.shift();
  }
  
  localStorage.setItem(`timeline_${fileId}`, JSON.stringify(timeline));
};
