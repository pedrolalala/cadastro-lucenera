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
      codigo_produto: row.codigo_produto,
      codigo_legado: row.codigo_legado,
      referencia: row.referencia,
      categoria: row.categoria,
      marca_nome: row.marca_nome,
      valor_venda: row.valor_venda,
      preco_venda: row.preco_venda,
      ativo: true,
      estoque_total: row.estoque_total,
      estoque_reservado: row.estoque_reservado,
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
    <div className="flex flex-col space-y-4 w-full pb-20 lg:pb-0 xl:h-[calc(100vh-130px)] animate-fade-in-up">
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

      <div className="flex flex-col xl:flex-row gap-4 flex-1 min-h-0">
        <div className="w-full xl:flex-1 flex flex-col gap-3 min-w-0 min-h-0">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm shrink-0">
            <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por SKU, referência, código, nome ou descrição..."
                className="pl-9 bg-slate-50 border-slate-200 h-9"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-44 shrink-0">
              <FilterCombobox
                options={marcaOptions}
                value={marcaId}
                onChange={setMarcaId}
                placeholder="Marca"
                searchPlaceholder="Buscar marca..."
                allLabel="Todas"
              />
            </div>
            <div className="w-full sm:w-44 shrink-0">
              <FilterCombobox
                options={categoriaOptions}
                value={categoriaId}
                onChange={setCategoriaId}
                placeholder="Categoria"
                searchPlaceholder="Buscar categoria..."
                allLabel="Todas"
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

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="px-4 py-2 text-xs text-slate-500 border-b border-slate-100 shrink-0">
              {loading
                ? `Carregando... ${progress.loaded}${progress.total ? `/${progress.total}` : ''} peças`
                : `${visibleItems.length} de ${produtos.length} registros ativos`}
            </div>
            <div className="overflow-auto flex-1" onScroll={handleScroll}>
              <Table className="w-full table-fixed">
                <TableHeader className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                  <TableRow className="h-11">
                    <TableHead className="w-[16%] pl-4 sm:pl-6 text-slate-600 font-semibold text-xs uppercase tracking-wide">
                      SKU / Referência
                    </TableHead>
                    <TableHead className="text-slate-600 font-semibold text-xs uppercase tracking-wide">
                      Descrição
                    </TableHead>
                    <TableHead className="w-[13%] hidden xl:table-cell text-slate-600 font-semibold text-xs uppercase tracking-wide">
                      Marca
                    </TableHead>
                    <TableHead className="w-[12%] text-right text-slate-600 font-semibold text-xs uppercase tracking-wide">
                      Preço Venda
                    </TableHead>
                    <TableHead className="w-[11%] hidden lg:table-cell text-right text-slate-600 font-semibold text-xs uppercase tracking-wide">
                      Estoque Total
                    </TableHead>
                    <TableHead className="w-[13%] pr-4 sm:pr-6 text-right text-slate-600 font-semibold text-xs uppercase tracking-wide">
                      Disponível
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center">
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
                      <TableCell colSpan={6} className="h-40 text-center">
                        <div className="flex flex-col items-center text-slate-400">
                          <Box className="w-10 h-10 mb-3 text-slate-300" />
                          <p className="text-slate-600 font-medium">Nenhum produto encontrado</p>
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
                          'cursor-pointer transition-colors h-14 border-b border-slate-50',
                          selectedPecaId === p.id
                            ? 'bg-primary/5 hover:bg-primary/10'
                            : 'hover:bg-slate-50/80',
                        )}
                      >
                        <TableCell className="pl-4 sm:pl-6 align-middle py-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary font-mono text-xs font-semibold whitespace-nowrap">
                            {p.sku || p.referencia || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="align-middle py-2">
                          <div className="flex items-start gap-2">
                            <p className="line-clamp-2 text-sm font-medium text-slate-900 leading-snug">
                              {p.nome}
                            </p>
                            {!p.has_estoque && (
                              <span className="shrink-0 mt-0.5 text-[9px] text-amber-600 font-bold uppercase whitespace-nowrap px-1 py-0.5 rounded bg-amber-50">
                                S/E
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell align-middle py-2">
                          <span className="text-sm text-slate-600 block truncate">
                            {p.marca_nome || (
                              <span className="text-slate-400 italic text-xs">Não informada</span>
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="text-right align-middle py-2">
                          <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
                            {formatCurrency(p.valor_venda || p.preco_venda)}
                          </span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-right align-middle py-2">
                          {!p.has_estoque ? (
                            <span className="text-[11px] text-slate-400 italic whitespace-nowrap">
                              Saldo Zero
                            </span>
                          ) : (
                            <span className="text-sm font-semibold text-slate-600">
                              {p.estoque_total}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="pr-4 sm:pr-6 text-right align-middle py-2">
                          {!p.has_estoque ? (
                            <span className="text-[11px] text-slate-400 italic whitespace-nowrap">
                              Saldo Zero
                            </span>
                          ) : (
                            <span
                              className={cn(
                                'font-semibold text-sm',
                                p.estoque_disponivel > 0 ? 'text-emerald-600' : 'text-slate-400',
                              )}
                            >
                              {p.estoque_disponivel}
                            </span>
                          )}
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

        <div className="w-full xl:w-80 shrink-0 flex flex-col xl:overflow-hidden xl:h-full">
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
