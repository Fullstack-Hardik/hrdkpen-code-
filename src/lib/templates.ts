import { FileNode } from '@/types';

// Simple unique ID generator
const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

function createNode(name: string, type: 'file' | 'folder', content?: string, children?: FileNode[]): FileNode {
  return {
    id: genId(),
    name,
    type,
    content,
    children,
    language: type === 'file' ? getLang(name) : undefined,
  };
}

function getLang(name: string) {
  if (name.endsWith('.ts') || name.endsWith('.tsx')) return 'typescript';
  if (name.endsWith('.js') || name.endsWith('.jsx')) return 'javascript';
  if (name.endsWith('.css')) return 'css';
  if (name.endsWith('.html')) return 'html';
  if (name.endsWith('.json')) return 'json';
  if (name.endsWith('.py')) return 'python';
  if (name.endsWith('.c')) return 'c';
  if (name.endsWith('.cpp')) return 'cpp';
  return 'plaintext';
}

export const TEMPLATES = {
  html: (): FileNode[] => [
    createNode('index.html', 'file', `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HTML Project</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="app">
    <h1>Hello World</h1>
    <p>This is a standard HTML/CSS/JS project.</p>
  </div>
  <script src="script.js"></script>
</body>
</html>`),
    createNode('style.css', 'file', `body {
  font-family: system-ui, sans-serif;
  background-color: #1a1b26;
  color: #a9b1d6;
  display: grid;
  place-items: center;
  height: 100vh;
  margin: 0;
}
h1 { color: #7aa2f7; }
`),
    createNode('script.js', 'file', `console.log('App loaded!');
document.querySelector('h1').addEventListener('click', () => {
  alert('Header clicked!');
});
`),
  ],

  node: (): FileNode[] => [
    createNode('package.json', 'file', `{
  "name": "node-project",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {}
}`),
    createNode('index.js', 'file', `console.log("Hello from Node.js!");

const os = require('os');
console.log('OS platform:', os.platform());
console.log('Arch:', os.arch());
`),
  ],

  express: (): FileNode[] => [
    createNode('package.json', 'file', `{
  "name": "express-project",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}`),
    createNode('index.js', 'file', `const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello from Express on WebContainers!');
});

app.listen(port, () => {
  console.log(\`Example app listening on port \${port}\`);
});
`),
  ],

  react: (): FileNode[] => [
    createNode('package.json', 'file', `{
  "name": "react-vite-project",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.3",
    "vite": "^4.4.5"
  }
}`),
    createNode('vite.config.js', 'file', `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
})`),
    createNode('index.html', 'file', `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + React</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`),
    createNode('src', 'folder', undefined, [
      createNode('main.jsx', 'file', `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`),
      createNode('App.jsx', 'file', `import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="card">
      <h1>Vite + React</h1>
      <button onClick={() => setCount((count) => count + 1)}>
        count is {count}
      </button>
      <p>
        Edit <code>src/App.jsx</code> and save to test HMR
      </p>
    </div>
  )
}

export default App
`),
      createNode('index.css', 'file', `body { font-family: system-ui, sans-serif; background: #1a1b26; color: #a9b1d6; }`),
      createNode('App.css', 'file', `.card { padding: 2em; text-align: center; } button { padding: 10px 20px; font-size: 1.2rem; cursor: pointer; }`),
    ]),
  ],

  python: (): FileNode[] => [
    createNode('main.py', 'file', `def main():
    print("Hello from Python!")
    name = input("What is your name? ")
    print(f"Welcome to HRDK Pen, {name}")

if __name__ == "__main__":
    main()
`),
  ],

  c: (): FileNode[] => [
    createNode('main.c', 'file', `#include <stdio.h>

int main() {
    printf("Hello from C!\\n");
    return 0;
}
`),
  ],

  cpp: (): FileNode[] => [
    createNode('main.cpp', 'file', `#include <iostream>

int main() {
    std::cout << "Hello from C++!" << std::endl;
    return 0;
}
`),
  ],

  empty: (): FileNode[] => [],
};
