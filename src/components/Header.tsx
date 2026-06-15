import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { useLocation, Link } from 'react-router-dom'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, Users, FolderKanban, Wrench, Search } from 'lucide-react'
import { useEffect } from 'react'

export function Header() {
  const location = useLocation()
  const { setModal, setGlobalSearchOpen } = useStore()

  const pathMap: Record<string, string> = {
    '/clientes': 'Clientes',
    '/projetos': 'Projetos',
    '/pecas': 'Peças',
  }
  const title = pathMap[location.pathname] || 'Projetos'

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setGlobalSearchOpen(true)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [setGlobalSearchOpen])

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-8 bg-white border-b border-slate-200 shadow-sm shrink-0 z-10 sticky top-0">
      <div className="flex items-center">
        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/projetos">Cadastro</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="sm:hidden font-semibold text-slate-800">{title}</h1>
      </div>
      <div className="flex items-center space-x-2 md:space-x-4">
        <Button
          variant="outline"
          className="hidden md:flex text-slate-500 justify-start w-64 px-3 relative bg-slate-50"
          onClick={() => setGlobalSearchOpen(true)}
        >
          <Search className="w-4 h-4 mr-2" />
          <span className="text-sm">Buscar...</span>
          <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-5 select-none items-center gap-1 rounded border bg-white px-1.5 font-mono text-[10px] font-medium text-slate-500 shadow-sm">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setGlobalSearchOpen(true)}
        >
          <Search className="w-5 h-5 text-slate-600" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white shadow-md transition-all">
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Novo Cadastro</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setModal('cliente', true)} className="cursor-pointer">
              <Users className="w-4 h-4 mr-2 text-slate-500" /> Novo Cliente
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setModal('projeto', true)} className="cursor-pointer">
              <FolderKanban className="w-4 h-4 mr-2 text-slate-500" /> Novo Projeto
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setModal('peca', true)} className="cursor-pointer">
              <Wrench className="w-4 h-4 mr-2 text-slate-500" /> Nova Peça
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
