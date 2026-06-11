import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Contato, useStore } from '@/lib/store'
import { format } from 'date-fns'

export function ClientDetailsSheet({
  client,
  open,
  onOpenChange,
}: {
  client: Contato
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const { projetos } = useStore()

  if (!client) return null

  const clientProjects = projetos.filter((p) => p.clientId === client.id)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto pt-10">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl">{client.name}</SheetTitle>
          <SheetDescription>Detalhes do cliente e projetos vinculados.</SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1">
                Empresa
              </p>
              <p className="text-slate-900 font-medium">{client.company}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1">
                E-mail
              </p>
              <p className="text-slate-900 font-medium">{client.email}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1">
                Telefone
              </p>
              <p className="text-slate-900 font-medium">{client.phone}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1">
                Data de Cadastro
              </p>
              <p className="text-slate-900 font-medium">
                {format(new Date(client.createdAt), 'dd/MM/yyyy')}
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Projetos Relacionados</h3>
            {clientProjects.length === 0 ? (
              <p className="text-sm text-slate-500 bg-slate-50 p-4 rounded-md border border-slate-100 text-center">
                Nenhum projeto encontrado.
              </p>
            ) : (
              <div className="space-y-3">
                {clientProjects.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 border border-slate-200 rounded-md bg-slate-50 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-medium text-sm text-slate-900">{p.name}</p>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${p.status === 'Concluído' ? 'bg-emerald-100 text-emerald-700' : p.status === 'Em Andamento' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}
                      >
                        {p.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Prazo: {format(new Date(p.deadline), 'dd/MM/yyyy')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
