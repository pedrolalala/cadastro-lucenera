import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Edit, Trash, Briefcase, Mail, Phone, Building } from 'lucide-react'
import useDataStore from '@/stores/use-data-store'

export function ClienteDetailsSheet({
  id,
  open,
  onOpenChange,
}: {
  id: string | null
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const { clientes, projetos, setActiveModal, deleteCliente } = useDataStore()

  if (!id) return null
  const cliente = clientes.find((c) => c.id === id)
  if (!cliente) return null

  const relProjetos = projetos.filter((p) => p.clientId === id)

  const handleDelete = () => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      deleteCliente(id)
      onOpenChange(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div>
              <SheetTitle className="text-2xl">{cliente.name}</SheetTitle>
              <SheetDescription className="flex items-center gap-2 mt-1">
                <Building className="w-4 h-4" /> {cliente.company}
              </SheetDescription>
            </div>
            <Badge
              variant={cliente.status === 'Ativo' ? 'default' : 'secondary'}
              className={
                cliente.status === 'Ativo'
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  : ''
              }
            >
              {cliente.status}
            </Badge>
          </div>
        </SheetHeader>

        <div className="flex gap-2 py-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => {
              onOpenChange(false)
              setActiveModal('cliente', id)
            }}
          >
            <Edit className="w-4 h-4 mr-2" /> Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={handleDelete}
          >
            <Trash className="w-4 h-4 mr-2" /> Excluir
          </Button>
        </div>

        <Separator className="my-2" />

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
              Contato
            </h4>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Mail className="w-4 h-4 text-slate-400" /> {cliente.email}
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Phone className="w-4 h-4 text-slate-400" /> {cliente.phone}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="w-4 h-4" /> Projetos Relacionados ({relProjetos.length})
            </h4>
            {relProjetos.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum projeto vinculado.</p>
            ) : (
              <ul className="space-y-3">
                {relProjetos.map((p) => (
                  <li key={p.id} className="p-3 bg-slate-50 rounded-md border border-slate-100">
                    <p className="font-medium text-sm text-slate-900">{p.name}</p>
                    <div className="flex justify-between mt-2 text-xs text-slate-500">
                      <span>Status: {p.status}</span>
                      <span>Prazo: {new Date(p.deadline).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
