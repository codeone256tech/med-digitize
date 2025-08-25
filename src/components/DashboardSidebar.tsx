import { useState } from "react";
import { Home, FileText, Search, Settings, LogOut, User, Activity, ChevronLeft, ChevronRight, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
interface DashboardSidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}
export const DashboardSidebar = ({
  currentView,
  onViewChange
}: DashboardSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    signOut,
    doctorName
  } = useAuth();
  const menuItems = [{
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home
  }, {
    id: 'records',
    label: 'Patient Records',
    icon: FileText
  }, {
    id: 'analytics',
    label: 'Analytics',
    icon: Activity
  }, {
    id: 'search',
    label: 'Search',
    icon: Search
  }];
  return <div className={cn("bg-card border-r border-border h-full flex flex-col transition-all duration-300", collapsed ? "w-16" : "w-64")}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          {!collapsed && <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">MediScan AI</span>
            </div>}
          <Button variant="ghost" size="sm" onClick={() => setCollapsed(!collapsed)} className="ml-auto">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-2">
        <nav className="space-y-1">
          {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return <Button key={item.id} variant={isActive ? "secondary" : "ghost"} className={cn("w-full justify-start gap-3", collapsed && "justify-center px-2")} onClick={() => onViewChange(item.id)}>
                <Icon className="h-4 w-4" />
                {!collapsed && <span>{item.label}</span>}
              </Button>;
        })}
        </nav>
      </div>

      {/* User section */}
      <div className="p-2 border-t border-border">
        {!collapsed && <div className="px-3 py-2 mb-2">
            <Button variant="ghost" className="w-full p-2 h-auto justify-start" onClick={signOut}>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div className="truncate">
                  <p className="text-sm font-medium">{doctorName || 'Doctor'}</p>
                  <p className="text-xs text-muted-foreground">Logout</p>
                </div>
              </div>
            </Button>
          </div>}
        
        {collapsed && <div className="px-3 py-2 mb-2">
            <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-center">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>}
        
        <div className="space-y-1">
          <Button variant="ghost" className={cn("w-full justify-start gap-3", collapsed && "justify-center px-2")} onClick={() => onViewChange('settings')}>
            <Settings className="h-4 w-4" />
            {!collapsed && <span>Settings</span>}
          </Button>
        </div>
      </div>
    </div>;
};