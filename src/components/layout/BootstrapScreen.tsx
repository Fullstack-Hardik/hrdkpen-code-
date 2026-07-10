import React from 'react';
import { Button } from '@/components/ui/button';
import { FolderPlus, Download, FileCode2, Terminal, Code2, Coffee } from 'lucide-react';
import type { TEMPLATES } from '@/lib/templates';

interface BootstrapScreenProps {
  onLoadTemplate: (type: keyof typeof TEMPLATES) => void;
  onImportFolder: () => void;
}

export const BootstrapScreen = ({ onLoadTemplate, onImportFolder }: BootstrapScreenProps) => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-editor-bg text-editor-text font-sans p-6 overflow-y-auto">
      <div className="max-w-2xl w-full text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Welcome to HRDK Pen</h1>
        <p className="text-editor-text-muted text-lg max-w-lg mx-auto">
          A persistent, professional coding environment right in your browser. Choose a template to get started.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8 text-left">
          {/* Templates */}
          <button 
            onClick={() => onLoadTemplate('react')}
            className="flex flex-col p-5 bg-editor-sidebar border border-editor-border rounded-xl hover:border-blue-500 hover:bg-editor-active-tab transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Code2 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white mb-1">React + Vite</h3>
            <p className="text-xs text-editor-text-muted">Modern frontend web development with instant HMR.</p>
          </button>

          <button 
            onClick={() => onLoadTemplate('node')}
            className="flex flex-col p-5 bg-editor-sidebar border border-editor-border rounded-xl hover:border-green-500 hover:bg-editor-active-tab transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-green-500/10 text-green-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Terminal className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white mb-1">Node.js</h3>
            <p className="text-xs text-editor-text-muted">Backend JavaScript environment.</p>
          </button>

          <button 
            onClick={() => onLoadTemplate('python')}
            className="flex flex-col p-5 bg-editor-sidebar border border-editor-border rounded-xl hover:border-yellow-500 hover:bg-editor-active-tab transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 text-yellow-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FileCode2 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white mb-1">Python</h3>
            <p className="text-xs text-editor-text-muted">Learn Python and run scripts instantly.</p>
          </button>

          <button 
            onClick={() => onLoadTemplate('html')}
            className="flex flex-col p-5 bg-editor-sidebar border border-editor-border rounded-xl hover:border-orange-500 hover:bg-editor-active-tab transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FileCode2 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white mb-1">HTML / CSS / JS</h3>
            <p className="text-xs text-editor-text-muted">Standard static web project.</p>
          </button>

          <button 
            onClick={() => onLoadTemplate('c')}
            className="flex flex-col p-5 bg-editor-sidebar border border-editor-border rounded-xl hover:border-purple-500 hover:bg-editor-active-tab transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Coffee className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white mb-1">C / C++</h3>
            <p className="text-xs text-editor-text-muted">Compile and run native C/C++ code.</p>
          </button>
          
          {/* Import */}
          <button 
            onClick={onImportFolder}
            className="flex flex-col p-5 bg-editor-sidebar border border-editor-border border-dashed rounded-xl hover:border-editor-text hover:bg-editor-active-tab transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-white/5 text-editor-text-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FolderPlus className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white mb-1">Import Folder</h3>
            <p className="text-xs text-editor-text-muted">Load an existing project from your PC.</p>
          </button>

          {/* Empty */}
          <button 
            onClick={() => onLoadTemplate('empty')}
            className="flex flex-col p-5 bg-editor-sidebar border border-editor-border border-dashed rounded-xl hover:border-editor-text hover:bg-editor-active-tab transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-white/5 text-editor-text-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FolderPlus className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white mb-1">Empty Project</h3>
            <p className="text-xs text-editor-text-muted">Start fresh with no files.</p>
          </button>
        </div>
      </div>
    </div>
  );
};
