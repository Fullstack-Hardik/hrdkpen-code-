import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Plus, 
  Trash2, 
  Download,
  Search,
  RefreshCw,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InstalledPackage {
  name: string;
  version: string;
  type: 'npm' | 'pip';
}

interface QuickSetup {
  name: string;
  description: string;
  packages: { name: string; type: 'npm' | 'pip' }[];
  icon: string;
}

const QUICK_SETUPS: QuickSetup[] = [
  {
    name: 'React App',
    description: 'React + TypeScript + Vite',
    packages: [
      { name: 'react', type: 'npm' },
      { name: 'react-dom', type: 'npm' },
      { name: 'typescript', type: 'npm' }
    ],
    icon: '⚛️'
  },
  {
    name: 'Express API',
    description: 'Node.js + Express + CORS',
    packages: [
      { name: 'express', type: 'npm' },
      { name: 'cors', type: 'npm' },
      { name: 'dotenv', type: 'npm' }
    ],
    icon: '🚀'
  },
  {
    name: 'Python Data',
    description: 'NumPy + Pandas + Matplotlib',
    packages: [
      { name: 'numpy', type: 'pip' },
      { name: 'pandas', type: 'pip' },
      { name: 'matplotlib', type: 'pip' }
    ],
    icon: '🐍'
  }
];

export const PackageManager = () => {
  const [installedPackages, setInstalledPackages] = useState<InstalledPackage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [packageType, setPackageType] = useState<'npm' | 'pip'>('npm');
  const { toast } = useToast();

  const installPackage = (packageName: string, type: 'npm' | 'pip') => {
    const pkg: InstalledPackage = {
      name: packageName,
      version: 'latest',
      type
    };

    setInstalledPackages(prev => [...prev, pkg]);
    
    toast({
      title: "Package Installed",
      description: `${packageName} has been installed successfully`
    });
  };

  const uninstallPackage = (packageName: string) => {
    setInstalledPackages(prev => prev.filter(p => p.name !== packageName));
    
    toast({
      title: "Package Removed",
      description: `${packageName} has been uninstalled`
    });
  };

  const installQuickSetup = (setup: QuickSetup) => {
    setup.packages.forEach(pkg => {
      installPackage(pkg.name, pkg.type);
    });
    
    toast({
      title: "Quick Setup Complete",
      description: `${setup.name} packages installed`
    });
  };

  return (
    <div className="flex flex-col h-full bg-editor-panel">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-editor-sidebar">
        <Package className="w-4 h-4 text-editor-accent" />
        <span className="text-sm font-medium text-editor-text">Package Manager</span>
      </div>

      {/* Quick Setups */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-yellow-500" />
          <span className="text-xs font-medium text-editor-text">Quick Setups</span>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {QUICK_SETUPS.map((setup) => (
            <Button
              key={setup.name}
              variant="outline"
              size="sm"
              onClick={() => installQuickSetup(setup)}
              className="justify-start h-auto p-2 text-left"
            >
              <span className="text-lg mr-2">{setup.icon}</span>
              <div className="flex-1">
                <div className="text-xs font-medium">{setup.name}</div>
                <div className="text-xs text-muted-foreground">{setup.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Search & Install */}
      <div className="p-3 border-b border-border space-y-2">
        <div className="flex gap-2">
          <Button
            variant={packageType === 'npm' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPackageType('npm')}
            className="flex-1"
          >
            NPM
          </Button>
          <Button
            variant={packageType === 'pip' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPackageType('pip')}
            className="flex-1"
          >
            PIP
          </Button>
        </div>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-editor-text-muted" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${packageType} packages...`}
              className="pl-7 h-8 text-sm bg-editor-panel border-editor-border text-editor-text"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchTerm.trim()) {
                  installPackage(searchTerm.trim(), packageType);
                  setSearchTerm('');
                }
              }}
            />
          </div>
          <Button
            size="sm"
            onClick={() => {
              if (searchTerm.trim()) {
                installPackage(searchTerm.trim(), packageType);
                setSearchTerm('');
              }
            }}
            disabled={!searchTerm.trim()}
            className="h-8 px-3"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Installed Packages */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-3 py-2 border-b border-border">
          <span className="text-xs font-medium text-editor-text">
            Installed Packages ({installedPackages.length})
          </span>
        </div>
        
        <ScrollArea className="flex-1">
          {installedPackages.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="w-12 h-12 mx-auto mb-3 text-editor-text-muted opacity-50" />
              <p className="text-sm text-editor-text-muted">
                No packages installed yet
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {installedPackages.map((pkg, index) => (
                <div
                  key={`${pkg.name}-${index}`}
                  className="flex items-center justify-between p-2 rounded hover:bg-editor-active-tab group"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <Badge variant="secondary" className="text-xs">
                      {pkg.type}
                    </Badge>
                    <div>
                      <div className="text-sm font-medium text-editor-text">
                        {pkg.name}
                      </div>
                      <div className="text-xs text-editor-text-muted">
                        {pkg.version}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => uninstallPackage(pkg.name)}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};
