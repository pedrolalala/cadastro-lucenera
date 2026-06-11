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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {editingId ? 'Editar Peça' : 'Nova Peça'}
          </DialogTitle>
          <DialogDescription>
            Preencha os detalhes da peça para atualizar o catálogo de inventário.
          </DialogDescription>
        </DialogHeader>
        {isOpen && <PecaForm pecaId={editingId} onSuccess={closeModal} />}
      </DialogContent>
    </Dialog>
  )
}
