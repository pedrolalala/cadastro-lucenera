import { Link, useLocation } from 'react-router-dom'
import { Users, FolderKanban, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const location = useLocation()

  const navItems = [
    { name: 'Projetos', path: '/projetos', icon: FolderKanban },
    { name: 'Clientes', path: '/clientes', icon: Users },
    { name: 'Peças', path: '/pecas', icon: Wrench },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex justify-around items-center z-50 px-2 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path
        return (
          <Link
            key={item.path}
            to={item.path}
            className="flex flex-col items-center justify-center w-full h-full space-y-1"
          >
            <item.icon
              className={cn(
                'w-6 h-6 transition-colors',
                isActive ? 'text-amber-600' : 'text-slate-400',
              )}
            />
            <span
              className={cn(
                'text-[10px] font-medium transition-colors',
                isActive ? 'text-amber-600' : 'text-slate-500',
              )}
            >
              {item.name}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
