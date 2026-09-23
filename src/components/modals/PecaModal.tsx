import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import useDataStore from '@/stores/use-data-store'
import { PecaForm } from '../forms/PecaForm'

export function PecaModal() {
  const { activeModal, closeModal, editingId, setActiveModal } = useDataStore()
  const isOpen = activeModal === 'peca'

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="max-w-[98vw] w-full max-h-[97vh] h-full flex flex-col p-3 sm:p-4 overflow-hidden">
        <DialogHeader className="flex-shrink-0 mb-1.5">
          <DialogTitle className="text-xl font-bold">
            {editingId ? 'Editar Peça' : 'Nova Peça'}
          </DialogTitle>
          <DialogDescription>
            Preencha os detalhes da peça para atualizar o catálogo de inventário.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto overflow-x-hidden -mx-2 px-2 pb-2">
          {isOpen && (
            <PecaForm
              pecaId={editingId}
              onSuccess={closeModal}
              // SPEC-158 (P3.1): "Copiar" só troca editingId -> null, sem
              // fechar o modal nem remontar o PecaForm -- os valores já
              // carregados da peça de origem continuam no formulário,
              // agora em modo de CRIAÇÃO (novo codigo_produto ao salvar).
              onCopy={() => setActiveModal('peca', null)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
