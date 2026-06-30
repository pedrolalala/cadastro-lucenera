import { Wrench } from 'lucide-react'

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-4 md:px-8 shadow-sm">
      <div className="flex items-center gap-3">
        <Wrench className="w-5 h-5 text-primary" />
        <span className="font-semibold text-lg text-slate-800">Peças</span>
        <span className="hidden sm:inline text-sm text-slate-400 ml-2">Gestão de Inventário</span>
      </div>
    </header>
  )
}
