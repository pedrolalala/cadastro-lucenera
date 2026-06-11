import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import useDataStore from '@/stores/use-data-store'
import { PecaCard } from '@/components/pecas/PecaCard'

export default function Pecas() {
  const { pecas } = useDataStore()
  const [searchTerm, setSearchTerm] = useState('')

  const filtered = pecas.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Peças</h1>
          <p className="text-slate-500">Catálogo e inventário de peças.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Buscar por nome ou SKU..."
            className="pl-9 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-slate-200">
          <p className="text-slate-500">Nenhuma peça encontrada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {filtered.map((p) => (
            <PecaCard key={p.id} peca={p} />
          ))}
        </div>
      )}
    </div>
  )
}
