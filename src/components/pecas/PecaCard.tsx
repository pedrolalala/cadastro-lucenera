import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Copy, Box } from 'lucide-react'
import { Peca } from '@/types'
import useDataStore from '@/stores/use-data-store'

export function PecaCard({ peca }: { peca: Peca }) {
  const { setActiveModal, savePeca } = useDataStore()

  const handleDuplicate = () => {
    const { id, createdAt, ...rest } = peca
    savePeca({ ...rest, name: `${rest.name} (Cópia)`, sku: `${rest.sku}-COPY` })
  }

  return (
    <Card className="overflow-hidden group hover:shadow-md transition-shadow border-slate-200 bg-white flex flex-col">
      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
        <img
          src={peca.image}
          alt={peca.name}
          className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-2 right-2">
          <Badge
            variant="secondary"
            className="bg-white/90 backdrop-blur-sm font-mono font-bold text-xs shadow-sm"
          >
            {peca.sku}
          </Badge>
        </div>
      </div>
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start gap-2 mb-2">
          <h3 className="font-semibold text-slate-900 leading-tight line-clamp-2">{peca.name}</h3>
        </div>

        <p className="text-xs text-slate-500 line-clamp-2 mb-4 flex-1">{peca.specs}</p>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <Box className={`w-4 h-4 ${peca.stock > 0 ? 'text-emerald-500' : 'text-red-500'}`} />
            <span className={peca.stock > 0 ? 'text-slate-700' : 'text-red-600'}>
              {peca.stock} em estoque
            </span>
          </div>

          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-amber-600 hover:bg-amber-50"
              onClick={() => setActiveModal('peca', peca.id)}
              title="Editar"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
              onClick={handleDuplicate}
              title="Duplicar"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
