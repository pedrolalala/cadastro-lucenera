import { Link, useLocation } from 'react-router-dom'
import { Users, Briefcase, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MobileBottomNav() {
  const location = useLocation()

  const navItems = [
    { name: 'Projetos', path: '/projetos', icon: Briefcase },
    { name: 'Clientes', path: '/clientes', icon: Users },
    { name: 'Peças', path: '/pecas', icon: Wrench },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 flex items-center justify-around pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'flex flex-col items-center justify-center w-full py-3 gap-1 transition-colors',
              isActive ? 'text-amber-600' : 'text-slate-500 hover:text-slate-900',
            )}
          >
            <item.icon className={cn('w-5 h-5', isActive && 'fill-amber-100/50')} />
            <span className={cn('text-[10px] font-medium', isActive && 'font-bold')}>
              {item.name}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
