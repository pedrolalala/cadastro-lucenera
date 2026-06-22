import { Link, useLocation } from 'react-router-dom'
import { Users, Briefcase, Wrench, Hexagon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AppSidebar() {
  const location = useLocation()

  const navItems = [
    { name: 'Projetos', path: '/projetos', icon: Briefcase },
    { name: 'Clientes', path: '/clientes', icon: Users },
    { name: 'Peças', path: '/pecas', icon: Wrench },
  ]

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-sidebar-border bg-sidebar text-sidebar-foreground min-h-screen shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
        <Hexagon className="w-6 h-6 text-sidebar-primary mr-3" />
        <span className="text-xl font-bold tracking-tight text-sidebar-foreground">Lucenera</span>
      </div>

      <div className="px-4 py-6 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
        Menu Principal
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all group relative',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
              )}
            >
              {isActive && (
                <div className="absolute left-0 w-1 h-8 bg-sidebar-primary rounded-r-md animate-fade-in-up" />
              )}
              <item.icon
                className={cn(
                  'w-5 h-5',
                  isActive
                    ? 'text-sidebar-primary'
                    : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground/70',
                )}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-bold text-sidebar-primary">
            AD
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-sidebar-foreground">Admin User</span>
            <span className="text-xs text-sidebar-foreground/60">admin@lucenera.com</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
