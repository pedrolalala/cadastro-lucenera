import { useLocation } from 'react-router-dom'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, Users, Briefcase, Wrench, Search } from 'lucide-react'
import useDataStore from '@/stores/use-data-store'

export function AppHeader() {
  const location = useLocation()
  const { setActiveModal } = useDataStore()

  const pathMap: Record<string, string> = {
    '/clientes': 'Clientes',
    '/projetos': 'Projetos',
    '/pecas': 'Peças',
  }
  const currentPathName = pathMap[location.pathname] || 'Projetos'

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-4 md:px-6 shadow-sm">
      <div className="flex-1 flex items-center gap-4">
        <Breadcrumb className="hidden md:flex">
          <BreadcrumbList>
            <BreadcrumbItem>Cadastro</BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-semibold">{currentPathName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="md:hidden font-semibold text-lg text-slate-800">{currentPathName}</div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center text-sm text-slate-500 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200">
          <Search className="w-4 h-4 mr-2" />
          <span>Pesquisar</span>
          <kbd className="ml-4 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white shadow-md border-0 transition-all active:scale-95">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Novo Cadastro</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setActiveModal('cliente')} className="cursor-pointer">
              <Users className="mr-2 h-4 w-4 text-slate-500" />
              Novo Cliente
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveModal('projeto')} className="cursor-pointer">
              <Briefcase className="mr-2 h-4 w-4 text-slate-500" />
              Novo Projeto
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveModal('peca')} className="cursor-pointer">
              <Wrench className="mr-2 h-4 w-4 text-slate-500" />
              Nova Peça
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
