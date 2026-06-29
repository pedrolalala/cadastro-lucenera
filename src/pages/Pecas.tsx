import { useState, useEffect, useMemo, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Search, Box, Plus, X } from 'lucide-react'
import useDataStore from '@/stores/use-data-store'
import {
  getProdutosEstoqueFiltradoBatched,
  deleteProduto,
  getMarcas,
  getCategoriasProduto,
} from '@/services/produtos'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { PecaDetailsPanel } from '@/components/pecas/PecaDetailsPanel'
import { FilterCombobox } from '@/components/pecas/FilterCombobox'

const formatCurrency = (v: number | null | undefined) =>
  v == null
    ? 'R$ 0,00'
    : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const VISIBLE_BATCH = 100

export default function Pecas() {
  const { activeModal, setActiveModal } = useDataStore()
  const { toast } = useToast()

  const [produtos, setProdutos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState<{ loaded: number; total: number | null }>({
    loaded: 0,
    total: null,
  })

  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [marcaId, setMarcaId] = useState('')
  const [categoriaId, setCategoriaId] = useState('')

  const [marcas, setMarcas] = useState<{ id: string; nome: string }[]>([])
  const [categorias, setCategorias] = useState<{ id: string; nome: string }[]>([])

  const [selectedPecaId, setSelectedPecaId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [visibleCount, setVisibleCount] = useState(VISIBLE_BATCH)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    Promise.all([getMarcas(), getCategoriasProduto()])
      .then(([m, c]) => {
        setMarcas(m)
        setCategorias(c)
      })
      .catch(() => {
        toast({ title: 'Erro', description: 'Falha ao carregar filtros.', variant: 'destructive' })
      })
  }, [toast])

  const loadProdutos = useCallback(async () => {
    setLoading(true)
    setProgress({ loaded: 0, total: null })
    try {
      const data = await getProdutosEstoqueFiltradoBatched(
        {
          searchTerm: debouncedSearch || undefined,
          marcaId: marcaId || undefined,
          categoriaId: categoriaId || undefined,
        },
        500,
        (loaded, total) => setProgress({ loaded, total }),
      )
      setProdutos(data)
    } catch {
      toast({ title: 'Erro', description: 'Falha ao carregar as peças.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, marcaId, categoriaId, toast])

  useEffect(() => {
    if (activeModal === null) loadProdutos()
  }, [activeModal, loadProdutos])

  useEffect(() => {
    setVisibleCount(VISIBLE_BATCH)
  }, [debouncedSearch, marcaId, categoriaId])

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await deleteProduto(deleteId)
      toast({ title: 'Sucesso', description: 'Peça removida com sucesso!' })
      setProdutos((prev) => prev.filter((p) => p.id !== deleteId))
      if (selectedPecaId === deleteId) setSelectedPecaId(null)
    } catch {
      toast({ title: 'Erro', description: 'Falha ao remover a peça.', variant: 'destructive' })
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  const selectedPeca = useMemo(() => {
    const row = produtos.find((p) => p.id === selectedPecaId)
    if (!row) return null
    return {
      id: row.id,
      nome: row.nome,
      sku: row.sku,
      codigo_legado: row.codigo_legado,
      referencia: row.referencia,
      valor_venda: row.valor_venda,
      preco_venda: row.preco_venda,
      ativo: true,
      estoque_total: row.estoque_total,
      estoque_disponivel: row.estoque_disponivel,
    }
  }, [produtos, selectedPecaId])

  const visibleItems = produtos.slice(0, visibleCount)
  const hasActiveFilters = !!searchInput || !!marcaId || !!categoriaId

  const handleClearFilters = () => {
    setSearchInput('')
    setDebouncedSearch('')
    setMarcaId('')
    setCategoriaId('')
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 300 && visibleCount < produtos.length) {
      setVisibleCount((prev) => Math.min(prev + VISIBLE_BATCH, produtos.length))
    }
  }

  const marcaOptions = marcas.map((m) => ({ value: m.id, label: m.nome }))
  const categoriaOptions = categorias.map((c) => ({ value: c.id, label: c.nome }))

  return (
    <div className="flex flex-col space-y-6 max-w-[1400px] mx-auto pb-20 lg:pb-0 lg:h-[calc(100vh-130px)] animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            Peças e Produtos
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Gerencie o catálogo e inventário de peças e produtos.
          </p>
        </div>
        <Button
          onClick={() => setActiveModal('peca')}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Peça
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        <div className="w-full lg:w-[70%] flex flex-col gap-4 min-h-0">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm shrink-0">
            <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por SKU, referência, código legado, nome ou descrição..."
                className="pl-9 bg-slate-50 border-slate-200"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48 shrink-0">
              <FilterCombobox
                options={marcaOptions}
                value={marcaId}
                onChange={setMarcaId}
                placeholder="Marca"
                searchPlaceholder="Buscar marca..."
                allLabel="Todas as Marcas"
              />
            </div>
            <div className="w-full sm:w-48 shrink-0">
              <FilterCombobox
                options={categoriaOptions}
                value={categoriaId}
                onChange={setCategoriaId}
                placeholder="Categoria"
                searchPlaceholder="Buscar categoria..."
                allLabel="Todas as Categorias"
              />
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="shrink-0 text-slate-500 hover:text-slate-700 h-9"
              >
                <X className="w-4 h-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 overflow-hidden flex flex-col">
            <div className="px-4 py-2 text-xs text-slate-500 border-b border-slate-100 shrink-0">
              {loading
                ? `Carregando... ${progress.loaded}${progress.total ? `/${progress.total}` : ''} peças`
                : `Exibindo ${visibleItems.length} de ${produtos.length} registros (apenas produtos ativos)`}
            </div>
            <div className="overflow-auto flex-1 relative" onScroll={handleScroll}>
              <Table className="min-w-[1000px]">
                <TableHeader className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="w-20 text-slate-600 font-semibold pl-6">
                      Código (Legado)
                    </TableHead>
                    <TableHead className="text-slate-600 font-semibold min-w-[180px]">
                      Nome da Peça
                    </TableHead>
                    <TableHead className="text-slate-600 font-semibold w-32">Marca</TableHead>
                    <TableHead className="text-slate-600 font-semibold w-32">Categoria</TableHead>
                    <TableHead className="text-slate-600 font-semibold w-36">
                      SKU/Referência
                    </TableHead>
                    <TableHead className="text-right text-slate-600 font-semibold w-28">
                      Preço Venda
                    </TableHead>
                    <TableHead className="text-right text-slate-600 font-semibold w-24">
                      Qtd. Total
                    </TableHead>
                    <TableHead className="text-right text-slate-600 font-semibold w-24 pr-6">
                      Disponível
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs text-slate-500">
                            {progress.loaded > 0
                              ? `Carregadas ${progress.loaded} peças...`
                              : 'Iniciando carregamento...'}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : visibleItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-40 text-center">
                        <div className="flex flex-col items-center text-slate-400">
                          <Box className="w-10 h-10 mb-3 text-slate-300" />
                          <p className="text-slate-600 font-medium">
                            Nenhum produto encontrado para os filtros selecionados
                          </p>
                          <p className="text-sm mt-1">
                            Tente ajustar os filtros ou limpar a seleção.
                          </p>
                          {hasActiveFilters && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleClearFilters}
                              className="mt-3"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Limpar Filtros
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    visibleItems.map((p, idx) => (
                      <TableRow
                        key={`${p.id}-${idx}`}
                        onClick={() => setSelectedPecaId(p.id)}
                        className={cn(
                          'cursor-pointer transition-colors',
                          selectedPecaId === p.id
                            ? 'bg-primary/5 hover:bg-primary/10'
                            : 'hover:bg-slate-50/80',
                        )}
                      >
                        <TableCell className="font-mono text-xs text-slate-500 pl-6">
                          {p.codigo_legado != null ? p.codigo_legado : '-'}
                        </TableCell>
                        <TableCell className="font-medium text-slate-900">
                          <div className="flex items-center gap-2">
                            {p.nome}
                            {!p.has_estoque && (
                              <span className="text-[10px] text-amber-600 font-semibold uppercase">
                                Sem estoque
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {p.marca_nome || (
                            <span className="text-slate-400 italic">Marca não definida</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                            {p.categoria || 'Sem categoria'}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-600">
                          {p.sku || p.referencia || '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium text-slate-700">
                          {formatCurrency(p.valor_venda || p.preco_venda)}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium text-slate-700">
                          {p.estoque_total}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium pr-6">
                          <span
                            className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                              p.estoque_disponivel > 0
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-red-100 text-red-600',
                            )}
                          >
                            {p.estoque_disponivel}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {visibleCount < produtos.length && !loading && (
                <div className="py-3 text-center text-xs text-slate-400">
                  Role para carregar mais... ({produtos.length - visibleCount} restantes)
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[30%] flex flex-col shrink-0 lg:overflow-hidden lg:h-full">
          <PecaDetailsPanel
            peca={selectedPeca}
            onEdit={() => setActiveModal('peca', selectedPeca?.id)}
            onDelete={() => selectedPeca && setDeleteId(selectedPeca.id)}
          />
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A peça será removida permanentemente do banco de
              dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir Peça'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
