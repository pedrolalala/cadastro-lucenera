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
import { Edit, Trash, Briefcase, Mail, Phone, Building, MapPin, FileText, User } from 'lucide-react'
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

  const isAtivo = cliente.ativo ?? cliente.status === 'Ativo'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div>
              <SheetTitle className="text-2xl">{cliente.nome || cliente.name}</SheetTitle>
              <SheetDescription className="flex items-center gap-2 mt-1">
                {cliente.tipo_pessoa === 'Jurídica' ? (
                  <>
                    <Building className="w-4 h-4" />{' '}
                    {cliente.nome_empresa || cliente.razao_social || cliente.company}
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4" /> Pessoa Física
                  </>
                )}
              </SheetDescription>
            </div>
            <Badge
              variant={isAtivo ? 'default' : 'secondary'}
              className={
                isAtivo
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }
            >
              {isAtivo ? 'Ativo' : 'Inativo'}
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
              Detalhes
            </h4>
            {cliente.tipo_pessoa === 'Jurídica' ? (
              <>
                {cliente.cnpj && (
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <FileText className="w-4 h-4 text-slate-400" /> CNPJ: {cliente.cnpj}
                  </div>
                )}
                {cliente.razao_social && (
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Building className="w-4 h-4 text-slate-400" /> Razão Social:{' '}
                    {cliente.razao_social}
                  </div>
                )}
              </>
            ) : (
              <>
                {cliente.cpf && (
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <FileText className="w-4 h-4 text-slate-400" /> CPF: {cliente.cpf}
                  </div>
                )}
                {cliente.rg && (
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <FileText className="w-4 h-4 text-slate-400" /> RG: {cliente.rg}
                  </div>
                )}
              </>
            )}
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
              Contato
            </h4>
            {(cliente.email || cliente.email_financeiro) && (
              <div className="flex flex-col gap-1 text-sm text-slate-600">
                {cliente.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-slate-400" /> {cliente.email}
                  </div>
                )}
                {cliente.email_financeiro && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-amber-400" /> {cliente.email_financeiro} (Financ.)
                  </div>
                )}
              </div>
            )}
            {(cliente.telefone || cliente.celular || cliente.phone) && (
              <div className="flex flex-col gap-1 text-sm text-slate-600">
                {cliente.telefone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-slate-400" /> {cliente.telefone} (Fixo)
                  </div>
                )}
                {cliente.celular && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-slate-400" /> {cliente.celular} (Celular)
                  </div>
                )}
                {!cliente.telefone && !cliente.celular && cliente.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-slate-400" /> {cliente.phone}
                  </div>
                )}
              </div>
            )}
          </div>

          {(cliente.endereco || cliente.cidade) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                  Endereço
                </h4>
                <div className="flex items-start gap-3 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p>
                      {cliente.endereco} {cliente.bairro && `- ${cliente.bairro}`}
                    </p>
                    <p>
                      {cliente.cidade} {cliente.estado && `- ${cliente.estado}`}{' '}
                      {cliente.cep && `| CEP: ${cliente.cep}`}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {cliente.observacoes && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                  Observações
                </h4>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{cliente.observacoes}</p>
              </div>
            </>
          )}

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
