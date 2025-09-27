import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Code, Sparkles, Zap, Users } from 'lucide-react';

export const DefaultPreview = () => {
  return (
    <div className="h-full bg-gradient-to-br from-background via-background to-muted/20 p-8 overflow-auto">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Code className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">
              HardkPen Code Editor
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Professional online IDE with AI assistance, live preview, and team collaboration features
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="secondary">JavaScript</Badge>
            <Badge variant="secondary">Python</Badge>
            <Badge variant="secondary">HTML/CSS</Badge>
            <Badge variant="secondary">TypeScript</Badge>
          </div>
        </div>

        {/* Welcome Code Example */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              Hello World Example
            </h2>
            <div className="bg-muted rounded-lg p-4 font-mono text-sm">
              <div className="text-green-400">// Welcome to HardkPen Code Editor!</div>
              <div className="text-blue-400">function</div>
              <span className="text-yellow-400"> welcomeMessage</span>
              <span className="text-foreground">() &#123;</span>
              <div className="ml-4">
                <span className="text-blue-400">console</span>
                <span className="text-foreground">.</span>
                <span className="text-yellow-400">log</span>
                <span className="text-foreground">(</span>
                <span className="text-green-400">&quot;Hello, World! Welcome to coding!&quot;</span>
                <span className="text-foreground">);</span>
              </div>
              <div className="ml-4">
                <span className="text-blue-400">return</span>
                <span className="text-foreground"> </span>
                <span className="text-green-400">&quot;Start building amazing applications!&quot;</span>
                <span className="text-foreground">;</span>
              </div>
              <span className="text-foreground">&#125;</span>
              <br />
              <div className="text-yellow-400">welcomeMessage</div>
              <span className="text-foreground">();</span>
            </div>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Live Preview
              </h3>
              <p className="text-muted-foreground">
                See your code changes instantly with our real-time preview feature. 
                Perfect for web development and rapid prototyping.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Team Collaboration
              </h3>
              <p className="text-muted-foreground">
                Work together in real-time with your team. Share code, review changes, 
                and build better software together.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>1. Create a new file using the file explorer on the left</p>
              <p>2. Start typing your code with intelligent auto-completion</p>
              <p>3. Use the terminal to run your programs and see results</p>
              <p>4. Preview your web applications in real-time</p>
              <p>5. Collaborate with team members using our sharing features</p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>HardkPen Code Editor - Empowering developers worldwide</p>
          <p>Start coding today and bring your ideas to life!</p>
        </div>
      </div>
    </div>
  );
};