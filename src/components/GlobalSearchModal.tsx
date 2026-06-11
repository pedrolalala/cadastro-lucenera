import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { useStore } from '@/lib/store'
import { Users, FolderKanban, Wrench } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function GlobalSearchModal() {
  const { globalSearchOpen, setGlobalSearchOpen, contatos, projetos, pecas } = useStore()
  const navigate = useNavigate()

  const onSelect = (path: string) => {
    setGlobalSearchOpen(false)
    navigate(path)
  }

  return (
    <CommandDialog open={globalSearchOpen} onOpenChange={setGlobalSearchOpen}>
      <CommandInput placeholder="Digite para buscar clientes, projetos ou peças..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        {contatos.length > 0 && (
          <CommandGroup heading="Clientes">
            {contatos.slice(0, 5).map((c) => (
              <CommandItem
                key={c.id}
                onSelect={() => onSelect('/clientes')}
                className="cursor-pointer"
              >
                <Users className="mr-2 h-4 w-4 text-slate-400" />
                <span>
                  {c.name} - {c.company}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {projetos.length > 0 && (
          <CommandGroup heading="Projetos">
            {projetos.slice(0, 5).map((p) => (
              <CommandItem
                key={p.id}
                onSelect={() => onSelect('/projetos')}
                className="cursor-pointer"
              >
                <FolderKanban className="mr-2 h-4 w-4 text-slate-400" />
                <span>{p.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {pecas.length > 0 && (
          <CommandGroup heading="Peças">
            {pecas.slice(0, 5).map((p) => (
              <CommandItem
                key={p.id}
                onSelect={() => onSelect('/pecas')}
                className="cursor-pointer"
              >
                <Wrench className="mr-2 h-4 w-4 text-slate-400" />
                <span>
                  {p.sku} - {p.name}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
