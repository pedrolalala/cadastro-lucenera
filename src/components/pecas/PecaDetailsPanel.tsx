import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Box, Edit, Trash2 } from 'lucide-react'
import { getProdutoEstoqueDetalhado, getEstoqueItens } from '@/services/produtos'
import { buildEstoquePorSetor } from '@/lib/estoque-sectors'
import { cn } from '@/lib/utils'

const formatCurrency = (v: number | null | undefined) =>
  v == null
    ? 'R$ 0,00'
    : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export function PecaDetailsPanel({
  peca,
  onEdit,
  onDelete,
}: {
  peca: any
  onEdit: () => void
  onDelete: () => void
}) {
  const [estoqueData, setEstoqueData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!peca) {
      setEstoqueData([])
      return
    }
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const data = await getProdutoEstoqueDetalhado(peca.id)
        if (cancelled) return
        const setores = data?.estoque_setores
        setEstoqueData(Array.isArray(setores) ? setores : [])
      } catch {
        try {
          const items = await getEstoqueItens(peca.id)
          if (!cancelled) setEstoqueData(items || [])
        } catch {
          if (!cancelled) setEstoqueData([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [peca])

  const estoquePorSetor = useMemo(() => buildEstoquePorSetor(estoqueData), [estoqueData])
  const totalGeral = estoquePorSetor.reduce((s, i) => s + i.quantidade, 0)

  if (!peca) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-y-auto flex-1">
        <div className="p-8 text-center flex flex-col items-center justify-center text-slate-500 min-h-[400px]">
          <Box className="w-12 h-12 mb-4 text-slate-200" />
          <h3 className="font-medium text-slate-900 mb-1">Nenhuma peça selecionada</h3>
          <p className="text-sm">Clique em uma peça na lista para ver seus detalhes e estoque.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-y-auto flex-1">
      <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-900 leading-tight">{peca.nome}</h3>
          <p className="text-xs text-slate-500 mt-1.5 font-mono bg-slate-200/50 inline-block px-1.5 py-0.5 rounded">
            Cód: {peca.codigo_produto} {peca.sku ? `| SKU: ${peca.sku}` : ''}
          </p>
          {peca.referencia && <p className="text-xs text-slate-400 mt-1">Ref: {peca.referencia}</p>}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-medium text-slate-700">
              {formatCurrency(peca.valor_venda || peca.preco_venda)}
            </span>
            <span
              className={cn(
                'text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase',
                peca.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600',
              )}
            >
              {peca.ativo ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <Button
            size="sm"
            className="bg-slate-900 hover:bg-slate-800 text-white h-8 text-xs w-full"
            onClick={onEdit}
          >
            <Edit className="h-3 w-3 mr-1.5" />
            Editar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50 w-full"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3 mr-1.5" />
            Excluir
          </Button>
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold flex items-center text-slate-700">
            <Box className="w-4 h-4 mr-2 text-slate-400" />
            Estoque Integrado
          </h4>
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
            Total: {totalGeral}
          </span>
        </div>
        <div className="border rounded-lg overflow-hidden bg-slate-50 flex-1">
          <Table>
            <TableHeader className="bg-slate-100/80">
              <TableRow>
                <TableHead className="h-9 py-2 px-3 text-xs text-slate-600">Setor</TableHead>
                <TableHead className="h-9 py-2 px-3 text-xs text-right text-slate-600">
                  Atual
                </TableHead>
                <TableHead className="h-9 py-2 px-3 text-xs text-right text-slate-600">
                  Reserv.
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 14 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="py-2.5 px-3">
                        <Skeleton className="h-4 w-24 bg-slate-200" />
                      </TableCell>
                      <TableCell className="py-2.5 px-3">
                        <Skeleton className="h-4 w-8 ml-auto bg-slate-200" />
                      </TableCell>
                      <TableCell className="py-2.5 px-3">
                        <Skeleton className="h-4 w-8 ml-auto bg-slate-200" />
                      </TableCell>
                    </TableRow>
                  ))
                : estoquePorSetor.map((i) => (
                    <TableRow key={i.local} className="h-10 hover:bg-slate-100/50">
                      <TableCell className="py-2 px-3 text-xs font-medium text-slate-700">
                        {i.local}
                      </TableCell>
                      <TableCell className="py-2 px-3 text-xs text-right">
                        <span
                          className={cn(
                            'font-medium px-2 py-0.5 rounded-full',
                            i.quantidade > 0
                              ? 'bg-emerald-100 text-emerald-700'
                              : i.quantidade < 0
                                ? 'bg-destructive/10 text-destructive'
                                : 'text-slate-500',
                          )}
                        >
                          {i.quantidade}
                        </span>
                      </TableCell>
                      <TableCell className="py-2 px-3 text-xs text-right text-slate-500">
                        {i.quantidade_reservada || 0}
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
