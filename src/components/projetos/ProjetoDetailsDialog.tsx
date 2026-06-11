import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export function ProjetoDetailsDialog({
  open,
  onOpenChange,
  projeto,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  projeto: any
}) {
  if (!projeto) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold border-b pb-4 text-slate-900">
            Detalhes do Projeto
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6 py-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Código</p>
            <p className="text-base text-slate-900 font-medium">{projeto.codigo}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Nome</p>
            <p className="text-base text-slate-900 font-medium">{projeto.nome}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Cliente</p>
            <p className="text-base text-slate-900">{projeto.cliente_nome}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Arquiteto</p>
            <p className="text-base text-slate-900">{projeto.arquiteto_nome || '-'}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Responsável
            </p>
            <p className="text-base text-slate-900">{projeto.responsavel_nome || '-'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Nível Estratégico
            </p>
            <p className="text-base text-slate-900">{projeto.nivel_estrategico || '-'}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Status</p>
            <div>
              <Badge
                variant="secondary"
                className="font-medium bg-amber-50 text-amber-700 border-amber-200"
              >
                {projeto.status}
              </Badge>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Data de Entrada
            </p>
            <p className="text-base text-slate-900">
              {projeto.data_entrada
                ? new Date(projeto.data_entrada).toLocaleDateString('pt-BR')
                : '-'}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Localização
            </p>
            <p className="text-base text-slate-900">
              {projeto.cidade || '-'} {projeto.estado ? `- ${projeto.estado}` : ''}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Tipo de Área
            </p>
            <p className="text-base text-slate-900">
              {(projeto.area_do_projeto as any)?.tipo || '-'}
            </p>
          </div>
        </div>
        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar Janela
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
