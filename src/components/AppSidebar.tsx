import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Briefcase, Wrench, Hexagon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AppSidebar() {
  const location = useLocation()

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Clientes', path: '/clientes', icon: Users },
    { name: 'Projetos', path: '/projetos', icon: Briefcase },
    { name: 'Peças', path: '/pecas', icon: Wrench },
  ]

  return (
    <aside className="hidden md:flex flex-col w-64 border-r bg-slate-900 text-slate-100 min-h-screen shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <Hexagon className="w-6 h-6 text-amber-500 mr-3" />
        <span className="text-xl font-bold tracking-tight text-white">Lucenera</span>
      </div>

      <div className="px-4 py-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">
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
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all group',
                isActive
                  ? 'bg-slate-800 text-amber-500'
                  : 'text-slate-300 hover:bg-slate-800/50 hover:text-white',
              )}
            >
              {isActive && (
                <div className="absolute left-0 w-1 h-8 bg-amber-500 rounded-r-md animate-fade-in-up" />
              )}
              <item.icon
                className={cn(
                  'w-5 h-5',
                  isActive ? 'text-amber-500' : 'text-slate-400 group-hover:text-slate-300',
                )}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-amber-500">
            AD
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">Admin User</span>
            <span className="text-xs text-slate-500">admin@lucenera.com</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
