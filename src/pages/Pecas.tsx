import { useState, useEffect, useMemo, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Search, Box, Plus } from 'lucide-react'
import useDataStore from '@/stores/use-data-store'
import { getAllProdutosBatched, deleteProduto } from '@/services/produtos'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { PecaDetailsPanel } from '@/components/pecas/PecaDetailsPanel'

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
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategoria, setFilterCategoria] = useState('todas')
  const [filterAtivo, setFilterAtivo] = useState('todos')
  const [selectedPecaId, setSelectedPecaId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [visibleCount, setVisibleCount] = useState(VISIBLE_BATCH)

  const loadProdutos = useCallback(async () => {
    setLoading(true)
    setProgress({ loaded: 0, total: null })
    try {
      const data = await getAllProdutosBatched(500, (loaded, total) =>
        setProgress({ loaded, total }),
      )
      setProdutos(data)
    } catch {
      toast({ title: 'Erro', description: 'Falha ao carregar as peças.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (activeModal === null) loadProdutos()
  }, [activeModal, loadProdutos])

  useEffect(() => {
    setVisibleCount(VISIBLE_BATCH)
  }, [searchTerm, filterCategoria, filterAtivo])

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

  const categorias = useMemo(
    () =>
      Array.from(
        new Set(produtos.map((p) => p.categoria_rel?.nome || p.categoria).filter(Boolean)),
      ) as string[],
    [produtos],
  )

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return produtos.filter((p) => {
      const matchSearch =
        !term ||
        (p.nome && p.nome.toLowerCase().includes(term)) ||
        String(p.codigo_produto || '').includes(term) ||
        (p.sku && p.sku.toLowerCase().includes(term)) ||
        (p.referencia && p.referencia.toLowerCase().includes(term))
      const catName = p.categoria_rel?.nome || p.categoria || ''
      const matchCat = filterCategoria === 'todas' || catName === filterCategoria
      const matchAtivo =
        filterAtivo === 'todos' ||
        (filterAtivo === 'ativos' && p.ativo) ||
        (filterAtivo === 'inativos' && !p.ativo)
      return matchSearch && matchCat && matchAtivo
    })
  }, [produtos, searchTerm, filterCategoria, filterAtivo])

  const selectedPeca = useMemo(
    () => produtos.find((p) => p.id === selectedPecaId) || null,
    [produtos, selectedPecaId],
  )
  const visibleItems = filtered.slice(0, visibleCount)

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 300 && visibleCount < filtered.length) {
      setVisibleCount((prev) => Math.min(prev + VISIBLE_BATCH, filtered.length))
    }
  }

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
          <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm shrink-0">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por código, nome, SKU ou referência..."
                className="pl-9 bg-slate-50 border-slate-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48 shrink-0">
              <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                <SelectTrigger className="bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas Categorias</SelectItem>
                  {categorias.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-40 shrink-0">
              <Select value={filterAtivo} onValueChange={setFilterAtivo}>
                <SelectTrigger className="bg-slate-50 border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ativos">Ativos</SelectItem>
                  <SelectItem value="inativos">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 overflow-hidden flex flex-col">
            <div className="px-4 py-2 text-xs text-slate-500 border-b border-slate-100 shrink-0">
              {loading
                ? `Carregando... ${progress.loaded}${progress.total ? `/${progress.total}` : ''} peças`
                : `Exibindo ${visibleItems.length} de ${filtered.length} peças${filtered.length !== produtos.length ? ` (de ${produtos.length} total)` : ''}`}
            </div>
            <div className="overflow-auto flex-1 relative" onScroll={handleScroll}>
              <Table>
                <TableHeader className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="w-28 text-slate-600 font-semibold pl-6">Código</TableHead>
                    <TableHead className="text-slate-600 font-semibold">Nome da Peça</TableHead>
                    <TableHead className="text-slate-600 font-semibold">Categoria</TableHead>
                    <TableHead className="text-right text-slate-600 font-semibold pr-6">
                      Preço Venda
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center">
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
                      <TableCell colSpan={4} className="h-40 text-center">
                        <div className="flex flex-col items-center text-slate-400">
                          <Box className="w-10 h-10 mb-3 text-slate-300" />
                          <p className="text-slate-600 font-medium">Nenhuma peça encontrada</p>
                          <p className="text-sm">
                            Tente ajustar seus filtros ou crie uma nova peça.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    visibleItems.map((p) => (
                      <TableRow
                        key={p.id}
                        onClick={() => setSelectedPecaId(p.id)}
                        className={cn(
                          'cursor-pointer transition-colors border-l-4',
                          selectedPecaId === p.id
                            ? 'bg-primary/5 border-l-primary hover:bg-primary/10'
                            : 'hover:bg-slate-50/80 border-l-transparent',
                        )}
                      >
                        <TableCell className="font-mono text-xs text-slate-500 pl-6">
                          {p.codigo_produto != null ? p.codigo_produto : '-'}
                          {p.sku && (
                            <div className="text-[10px] text-slate-400 mt-0.5">{p.sku}</div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium text-slate-900">
                          <div className="flex items-center gap-2">
                            {p.nome}
                            {!p.ativo && (
                              <span className="text-[10px] text-red-500 font-semibold uppercase">
                                Inativo
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                            {p.categoria_rel?.nome || p.categoria || 'Sem categoria'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium text-slate-700 pr-6">
                          {formatCurrency(p.valor_venda || p.preco_venda)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {visibleCount < filtered.length && !loading && (
                <div className="py-3 text-center text-xs text-slate-400">
                  Role para carregar mais... ({filtered.length - visibleCount} restantes)
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
