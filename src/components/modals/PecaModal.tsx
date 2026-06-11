import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import useDataStore from '@/stores/use-data-store'

export function PecaModal() {
  const { activeModal, closeModal, editingId, pecas, savePeca } = useDataStore()
  const isOpen = activeModal === 'peca'
  const editingData = editingId ? pecas.find((p) => p.id === editingId) : null

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    // Auto-generate random image for mock purposes if new
    const imageQuery = (formData.get('name') as string).split(' ')[0].toLowerCase() || 'machine'
    const image =
      editingData?.image || `https://img.usecurling.com/p/300/300?q=${imageQuery}&color=gray`

    savePeca(
      {
        name: formData.get('name') as string,
        sku: formData.get('sku') as string,
        specs: formData.get('specs') as string,
        stock: parseInt(formData.get('stock') as string) || 0,
        image,
      },
      editingId,
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editingId ? 'Editar Peça' : 'Nova Peça'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Peça</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={editingData?.name}
              placeholder="Ex: Válvula de Pressão X1"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU / Referência</Label>
              <Input
                id="sku"
                name="sku"
                required
                defaultValue={editingData?.sku}
                placeholder="VAL-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Estoque</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                min="0"
                required
                defaultValue={editingData?.stock ?? 0}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="specs">Especificações Técnicas</Label>
            <Textarea
              id="specs"
              name="specs"
              rows={3}
              required
              defaultValue={editingData?.specs}
              placeholder="Material, voltagem, resistência..."
            />
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white">
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
