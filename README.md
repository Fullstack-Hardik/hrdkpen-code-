# HRDK Pen IDE

A powerful, high-performance, in-browser Code Editor and IDE platform built with React, Vite, and WebContainers. This project allows users to write, preview, and execute code dynamically completely within the browser.

## Key Features
- **In-Browser Execution**: Powered by `@webcontainer/api` to run native Node.js environments directly in the browser.
- **Smart Code Editor**: Highly optimized Monaco Editor integration with minimal latency and syntax highlighting.
- **Dynamic Previews**: Instant live previews for static web files (HTML/CSS/JS) and live Node.js/Vite server ports.
- **Intelligent Package Restoration**: Automatically parses `package.json` and runs `npm install` gracefully when restoring saved projects to prevent "module not found" errors.
- **File System Sync**: Persistent local workspace utilizing IndexedDB to preserve file nodes across sessions.
- **Vercel Optimized**: Configured with strict bundle splitting (`manualChunks`) and forced `.npmrc` peer-dependency resolutions to guarantee smooth production deployments on edge networks.

## Technology Stack
- **Framework:** React 18
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS & shadcn/ui
- **Core Engine:** WebContainers, Monaco Editor, xterm.js

## Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/Fullstack-Hardik/hrdkpen-code-.git
cd hrdkpen-code-
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the development server
```bash
npm run dev
```

## Production Build

To test the production build locally:
```bash
npm run build
npm run preview
```

## Deployment
This project is configured for **Vercel**. Simply import the repository into your Vercel dashboard and click Deploy. 

*(Note: The project leverages `.npmrc` to strictly enforce `legacy-peer-deps` so that all Radix UI and React type dependencies compile without conflicts during the `npm ci` stage).*
