import type { Language } from '@/types';

// Supported languages config
export const SUPPORTED_LANGUAGES = ['html', 'css', 'javascript', 'python', 'c', 'markdown'] as const;

// Extension → Monaco language mapping
export function getLanguageFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    html: 'html',
    htm: 'html',
    css: 'css',
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    c: 'c',
    h: 'c',
    cpp: 'cpp',
    cc: 'cpp',
    cxx: 'cpp',
    hpp: 'cpp',
    md: 'markdown',
    json: 'json',
    txt: 'plaintext',
  };
  return map[ext] ?? 'plaintext';
}

// Languages that can be run in the terminal
export const RUNNABLE_LANGUAGES = new Set(['javascript', 'typescript', 'python', 'c', 'cpp']);

// Languages with live preview (HTML/CSS/JS combination)
export const PREVIEW_LANGUAGES = new Set(['html', 'css', 'javascript']);

// Starter template for each language
export const LANGUAGE_TEMPLATES: Record<string, string> = {
  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My Page</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <h1>Hello, World!</h1>
  <script src="script.js"></script>
</body>
</html>`,

  css: `/* Styles */
body {
  margin: 0;
  padding: 1rem;
  font-family: sans-serif;
}`,

  javascript: `// JavaScript
console.log('Hello, World!');`,

  python: `# Python
print("Hello, World!")`,

  c: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`,

  markdown: `# My Notes

Write your markdown here...

## Features
- **Bold**, *italic*
- \`inline code\`

\`\`\`js
console.log("code block");
\`\`\`
`,
};

// Human-readable language labels
export const LANGUAGE_LABELS: Record<string, string> = {
  html: 'HTML',
  css: 'CSS',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  c: 'C',
  cpp: 'C++',
  markdown: 'Markdown',
  json: 'JSON',
  plaintext: 'Plain Text',
};
