import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Users, Briefcase, Wrench } from 'lucide-react'
import useDataStore from '@/stores/use-data-store'

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { clientes, projetos, pecas } = useDataStore()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const runCommand = (command: () => void) => {
    setOpen(false)
    command()
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Pesquisar em todo o sistema..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

        <CommandGroup heading="Clientes">
          {clientes.slice(0, 3).map((c) => (
            <CommandItem key={c.id} onSelect={() => runCommand(() => navigate('/clientes'))}>
              <Users className="mr-2 h-4 w-4" />
              <span>
                {c.name} ({c.company})
              </span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Projetos">
          {projetos.slice(0, 3).map((p) => (
            <CommandItem key={p.id} onSelect={() => runCommand(() => navigate('/projetos'))}>
              <Briefcase className="mr-2 h-4 w-4" />
              <span>{p.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Peças">
          {pecas.slice(0, 3).map((p) => (
            <CommandItem key={p.id} onSelect={() => runCommand(() => navigate('/pecas'))}>
              <Wrench className="mr-2 h-4 w-4" />
              <span>
                {p.name} ({p.sku})
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
