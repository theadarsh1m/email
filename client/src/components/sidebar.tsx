import { Link, useLocation } from "wouter";
import { Bot, BarChart3, Mail, Settings, Database, Gauge } from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", icon: Gauge, label: "Dashboard" },
    { path: "/emails", icon: Mail, label: "Email Inbox" },
    { path: "/analytics", icon: BarChart3, label: "Analytics" },
    { path: "/settings", icon: Settings, label: "Settings" },
    { path: "/knowledge", icon: Database, label: "Knowledge Base" },
  ];

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary-foreground" data-testid="logo-icon" />
          </div>
          <div>
            <h1 className="font-semibold text-lg" data-testid="app-title">AI Assistant</h1>
            <p className="text-xs text-muted-foreground" data-testid="app-subtitle">Communication Hub</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;
          
          return (
            <Link key={item.path} href={item.path}>
              <div
                className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3 px-3 py-2">
          <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
            <span className="text-sm font-medium" data-testid="user-initials">JD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" data-testid="user-name">John Doe</p>
            <p className="text-xs text-muted-foreground truncate" data-testid="user-email">john@company.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
