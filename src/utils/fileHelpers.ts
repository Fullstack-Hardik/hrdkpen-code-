export const getLanguageFromFileName = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  const languageMap: Record<string, string> = {
    // Web
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'less': 'less',
    
    // JavaScript/TypeScript
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'mjs': 'javascript',
    'cjs': 'javascript',
    
    // Programming Languages
    'py': 'python',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'cc': 'cpp',
    'cxx': 'cpp',
    'h': 'c',
    'hpp': 'cpp',
    'hh': 'cpp',
    'cs': 'csharp',
    'php': 'php',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'swift': 'swift',
    'kt': 'kotlin',
    'scala': 'scala',
    
    // Data & Config
    'json': 'json',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
    'toml': 'toml',
    'ini': 'ini',
    'env': 'plaintext',
    
    // Markup & Documentation
    'md': 'markdown',
    'mdx': 'markdown',
    'tex': 'latex',
    'txt': 'plaintext',
    
    // Shell & Scripts
    'sh': 'shell',
    'bash': 'shell',
    'zsh': 'shell',
    'fish': 'shell',
    'ps1': 'powershell',
    
    // Database
    'sql': 'sql',
    
    // Other
    'r': 'r',
    'dart': 'dart',
    'lua': 'lua',
    'perl': 'perl',
    'pl': 'perl',
  };
  
  return languageMap[ext || ''] || 'plaintext';
};

// Backward compatibility
export const detectLanguageFromExtension = getLanguageFromFileName;

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
