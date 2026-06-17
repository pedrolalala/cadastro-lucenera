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
  const { activeModal, closeModal, editingId } = useDataStore()
  const isOpen = activeModal === 'peca'

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="max-w-[98vw] w-full max-h-[95vh] h-full flex flex-col p-4 sm:p-6 overflow-hidden">
        <DialogHeader className="flex-shrink-0 mb-2">
          <DialogTitle className="text-xl font-bold">
            {editingId ? 'Editar Peça' : 'Nova Peça'}
          </DialogTitle>
          <DialogDescription>
            Preencha os detalhes da peça para atualizar o catálogo de inventário.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto overflow-x-hidden -mx-2 px-2 pb-2">
          {isOpen && <PecaForm pecaId={editingId} onSuccess={closeModal} />}
        </div>
      </DialogContent>
    </Dialog>
  )
}
