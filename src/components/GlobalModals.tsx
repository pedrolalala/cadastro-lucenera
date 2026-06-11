import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useStore } from '@/lib/store'
import { ClientForm } from './forms/ClientForm'
import { ProjectForm } from './forms/ProjectForm'
import { PecaForm } from './forms/PecaForm'

export function GlobalModals() {
  const { modals, setModal } = useStore()

  return (
    <>
      <Dialog open={modals.cliente} onOpenChange={(v) => setModal('cliente', v)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
            <DialogDescription>Cadastre os dados de um novo cliente no sistema.</DialogDescription>
          </DialogHeader>
          <ClientForm onSuccess={() => setModal('cliente', false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={modals.projeto} onOpenChange={(v) => setModal('projeto', v)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Projeto</DialogTitle>
            <DialogDescription>
              Crie um novo projeto e vincule a um cliente existente.
            </DialogDescription>
          </DialogHeader>
          <ProjectForm onSuccess={() => setModal('projeto', false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={modals.peca} onOpenChange={(v) => setModal('peca', v)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Peça</DialogTitle>
            <DialogDescription>Adicione uma nova peça ao catálogo de inventário.</DialogDescription>
          </DialogHeader>
          <PecaForm onSuccess={() => setModal('peca', false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}
