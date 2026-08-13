import { NavLink } from 'react-router-dom';
import { cn } from '@shared/lib/utils';
import {
  LayoutDashboard,
  Ship,
  Wrench,
  Bot,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@features/auth/auth-context';
import { Button } from '@shared/ui/button';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/vessels', icon: Ship, label: 'Vessels' },
  { to: '/maintenance', icon: Wrench, label: 'Maintenance' },
  { to: '/ai-query', icon: Bot, label: 'AI Query' },
];

export function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-sidebar-background">
      <div className="flex h-14 items-center border-b px-6">
        <Ship className="h-5 w-5 text-sidebar-primary" />
        <span className="ml-2 font-semibold text-sidebar-primary">MTTO Fleet</span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t p-4">
        <Button variant="ghost" className="w-full justify-start text-sidebar-foreground" onClick={logout}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
