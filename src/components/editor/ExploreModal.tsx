import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Rocket,
  Database,
  Code,
  FolderPlus,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExploreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (name: string, type: string) => void;
}

const PROJECT_TEMPLATES = [
  {
    id: 'react',
    name: 'React App',
    icon: Code,
    description: 'React + TypeScript + Vite setup',
    color: 'from-cyan-500 to-blue-600',
    files: [
      { path: 'src/App.tsx', content: `import React from 'react';\n\nfunction App() {\n  return (\n    <div className="App">\n      <h1>Hello React!</h1>\n    </div>\n  );\n}\n\nexport default App;` },
      { path: 'src/main.tsx', content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './index.css';\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>,\n);` },
      { path: 'src/index.css', content: `body {\n  margin: 0;\n  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;\n}` },
      { path: 'index.html', content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>React App</title>\n</head>\n<body>\n  <div id="root"></div>\n  <script type="module" src="/src/main.tsx"></script>\n</body>\n</html>` },
      { path: 'package.json', content: `{\n  "name": "react-app",\n  "version": "1.0.0",\n  "dependencies": {\n    "react": "^18.2.0",\n    "react-dom": "^18.2.0"\n  }\n}` }
    ]
  },
  {
    id: 'express',
    name: 'Express API',
    icon: Rocket,
    description: 'Node.js + Express + MongoDB',
    color: 'from-green-500 to-emerald-600',
    files: [
      { path: 'server.js', content: `const express = require('express');\nconst cors = require('cors');\n\nconst app = express();\nconst PORT = process.env.PORT || 3000;\n\napp.use(cors());\napp.use(express.json());\n\napp.get('/', (req, res) => {\n  res.json({ message: 'Welcome to Express API!' });\n});\n\napp.listen(PORT, () => {\n  console.log(\`Server running on port \${PORT}\`);\n});` },
      { path: 'package.json', content: `{\n  "name": "express-api",\n  "version": "1.0.0",\n  "main": "server.js",\n  "scripts": {\n    "start": "node server.js",\n    "dev": "nodemon server.js"\n  },\n  "dependencies": {\n    "express": "^4.18.0",\n    "cors": "^2.8.5",\n    "dotenv": "^16.0.0"\n  }\n}` },
      { path: '.env', content: `PORT=3000\nMONGODB_URI=mongodb://localhost:27017/mydb` }
    ]
  },
  {
    id: 'fullstack',
    name: 'Full Stack',
    icon: Database,
    description: 'React + Express + Database',
    color: 'from-purple-500 to-pink-600',
    files: [
      { path: 'client/src/App.tsx', content: `import React from 'react';\n\nfunction App() {\n  return <h1>Full Stack App</h1>;\n}\n\nexport default App;` },
      { path: 'server/server.js', content: `const express = require('express');\nconst app = express();\n\napp.get('/api', (req, res) => {\n  res.json({ message: 'API works!' });\n});\n\napp.listen(5000, () => console.log('Server on port 5000'));` },
      { path: 'package.json', content: `{\n  "name": "fullstack-app",\n  "version": "1.0.0",\n  "scripts": {\n    "client": "cd client && npm start",\n    "server": "cd server && npm start"\n  }\n}` }
    ]
  }
];

export const ExploreModal = ({ isOpen, onClose, onCreateProject }: ExploreModalProps) => {
  const [projectName, setProjectName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCreate = () => {
    if (!projectName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a project name",
        variant: "destructive"
      });
      return;
    }

    if (!selectedTemplate) {
      toast({
        title: "Error",
        description: "Please select a template",
        variant: "destructive"
      });
      return;
    }

    onCreateProject(projectName.trim(), selectedTemplate);
    setProjectName('');
    setSelectedTemplate(null);
    onClose();
    
    toast({
      title: "Project Created",
      description: `${projectName} has been created successfully!`
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-gradient-to-br from-editor-panel via-editor-sidebar to-editor-panel border-purple-500/30">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Explore Quick Setups
              </DialogTitle>
              <DialogDescription className="text-purple-300/70 mt-1">
                Get started quickly with pre-configured project templates
              </DialogDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Project Name Input */}
          <div className="space-y-2">
            <Label htmlFor="project-name" className="text-purple-200">Project Name</Label>
            <Input
              id="project-name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="my-awesome-project"
              className="bg-editor-panel/50 border-purple-500/30 text-editor-text focus:border-purple-400"
            />
          </div>

          {/* Templates Grid */}
          <div className="space-y-2">
            <Label className="text-purple-200">Select Template</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PROJECT_TEMPLATES.map((template) => {
                const Icon = template.icon;
                const isSelected = selectedTemplate === template.id;
                
                return (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`
                      relative overflow-hidden rounded-xl border-2 transition-all duration-300 p-6
                      ${isSelected 
                        ? 'border-purple-400 bg-purple-500/20 shadow-lg shadow-purple-500/30' 
                        : 'border-purple-500/30 bg-editor-active-tab hover:border-purple-400/50 hover:bg-purple-500/10'
                      }
                    `}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${template.color} opacity-5`} />
                    
                    <div className="relative z-10 space-y-3">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${template.color} flex items-center justify-center mx-auto`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      
                      <div className="text-center">
                        <h3 className="font-bold text-editor-text">{template.name}</h3>
                        <p className="text-xs text-editor-text-muted mt-1">{template.description}</p>
                      </div>
                      
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Create Button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-purple-500/30">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-purple-500/30"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!projectName.trim() || !selectedTemplate}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { PROJECT_TEMPLATES };
