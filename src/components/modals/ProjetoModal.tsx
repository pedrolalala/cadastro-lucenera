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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import useDataStore from '@/stores/use-data-store'
import { useState, useEffect } from 'react'

export function ProjetoModal() {
  const { activeModal, closeModal, editingId, projetos, clientes, saveProjeto } = useDataStore()
  const isOpen = activeModal === 'projeto'
  const editingData = editingId ? projetos.find((p) => p.id === editingId) : null

  const [status, setStatus] = useState<'Pendente' | 'Em Andamento' | 'Concluído'>('Pendente')
  const [clientId, setClientId] = useState<string>('')

  useEffect(() => {
    if (isOpen && editingData) {
      setStatus(editingData.status)
      setClientId(editingData.clientId)
    } else if (isOpen) {
      setStatus('Pendente')
      setClientId('')
    }
  }, [isOpen, editingData])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!clientId) return alert('Selecione um cliente')

    const formData = new FormData(e.currentTarget)
    saveProjeto(
      {
        name: formData.get('name') as string,
        deadline: formData.get('deadline') as string,
        description: formData.get('description') as string,
        progress: parseInt(formData.get('progress') as string) || 0,
        status,
        clientId,
      },
      editingId,
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editingId ? 'Editar Projeto' : 'Novo Projeto'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Projeto</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={editingData?.name}
              placeholder="Ex: Sistema de Refrigeração"
            />
          </div>
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select value={clientId} onValueChange={setClientId} required>
              <SelectTrigger>
                <SelectValue placeholder="Vincular a um cliente..." />
              </SelectTrigger>
              <SelectContent>
                {clientes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.company})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deadline">Prazo</Label>
              <Input
                id="deadline"
                name="deadline"
                type="date"
                required
                defaultValue={editingData?.deadline}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="progress">Progresso (%)</Label>
              <Input
                id="progress"
                name="progress"
                type="number"
                min="0"
                max="100"
                required
                defaultValue={editingData?.progress ?? 0}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                <SelectItem value="Concluído">Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={editingData?.description}
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
