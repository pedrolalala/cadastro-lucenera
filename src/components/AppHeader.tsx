import { Button } from '@/components/ui/button'
import { Plus, Wrench } from 'lucide-react'
import useDataStore from '@/stores/use-data-store'

export function AppHeader() {
  const { setActiveModal } = useDataStore()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-white px-4 md:px-8 shadow-sm">
      <div className="flex items-center gap-3">
        <Wrench className="w-5 h-5 text-primary" />
        <span className="font-semibold text-lg text-slate-800">Peças</span>
        <span className="hidden sm:inline text-sm text-slate-400 ml-2">Gestão de Inventário</span>
      </div>

      <Button
        className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md border-0 transition-all active:scale-95"
        onClick={() => setActiveModal('peca')}
      >
        <Plus className="w-4 h-4 mr-2" />
        <span className="hidden sm:inline">Nova Peça</span>
        <span className="sm:hidden">Novo</span>
      </Button>
    </header>
  )
}
