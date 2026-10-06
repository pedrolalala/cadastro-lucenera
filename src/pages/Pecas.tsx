import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
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
import { Search, Box, Plus, X, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import useDataStore from '@/stores/use-data-store'
import {
  getProdutosEstoqueFiltradoBatched,
  getMarcas,
  getCategoriasProduto,
} from '@/services/produtos'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { PecaDetailsPanel } from '@/components/pecas/PecaDetailsPanel'
import { FilterCombobox } from '@/components/pecas/FilterCombobox'
// SPEC-174 N7: canEdit decide Editar/Copiar/Excluir e o duplo clique.
import { useAuth } from '@/hooks/use-auth'

const formatCurrency = (v: number | null | undefined) =>
  v == null
    ? 'R$ 0,00'
    : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const VISIBLE_BATCH = 100

// SPEC-122: mesmo padrão de ordenação por coluna já em produção em
// Orçamentos (ProductSearchModal.tsx) — o usuário escolhe qual coluna
// manda, em vez de ficar preso à ordem fixa que o service já devolve
// (estoque disponível desc, depois nome).
type SortKey =
  | 'codigo_produto'
  | 'referencia'
  | 'nome'
  | 'marca_nome'
  | 'preco'
  | 'estoque_total'
  | 'estoque_disponivel'
type SortDir = 'asc' | 'desc'

const SORT_COLS: { key: SortKey; label: string }[] = [
  { key: 'codigo_produto', label: 'Código' },
  { key: 'referencia', label: 'Referência' },
  { key: 'nome', label: 'Descrição' },
  { key: 'marca_nome', label: 'Marca' },
  { key: 'preco', label: 'Preço Venda' },
  { key: 'estoque_total', label: 'Estoque Total' },
  { key: 'estoque_disponivel', label: 'Disponível' },
]

function getSortValue(row: any, key: SortKey): string | number {
  switch (key) {
    case 'codigo_produto':
      return row.codigo_produto ?? row.codigo_legado ?? 0
    case 'referencia':
      return row.referencia || row.sku || ''
    case 'nome':
      return row.nome || ''
    case 'marca_nome':
      return row.marca_nome || ''
    case 'preco':
      return row.valor_venda ?? row.preco_venda ?? 0
    case 'estoque_total':
      return row.estoque_total ?? 0
    case 'estoque_disponivel':
      return row.estoque_disponivel ?? 0
    default:
      return ''
  }
}

function sortProdutos(data: any[], key: SortKey, dir: SortDir): any[] {
  return [...data].sort((a, b) => {
    const va = getSortValue(a, key)
    const vb = getSortValue(b, key)
    const cmp =
      typeof va === 'number' && typeof vb === 'number'
        ? va - vb
        : String(va).localeCompare(String(vb))
    return dir === 'asc' ? cmp : -cmp
  })
}

export default function Pecas() {
  const { activeModal, setActiveModal } = useDataStore()
  const { toast } = useToast()
  // SPEC-174 N7: todo mundo com acesso ao Cadastro consulta produto; só quem
  // tem a ação "editar" (hub_pode_executar) abre a edição pelo duplo clique.
  const { canEdit, canCreate } = useAuth()

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
  const [visibleCount, setVisibleCount] = useState(VISIBLE_BATCH)

  // SPEC-122: null = mantém a ordem que o service já devolve (estoque
  // disponível desc, depois nome) — só passa a ter uma coluna "no comando"
  // depois que o usuário clica em algum cabeçalho.
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

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

  // SPEC-182 (C1): a carga sem filtro (todas as peças, em lotes) demora alguns
  // segundos; se a pessoa buscar nesse meio tempo, a carga antiga terminava
  // depois e sobrescrevia o resultado da busca ("a pesquisa some sozinha").
  // Só a chamada mais recente grava na tela.
  const cargaAtual = useRef(0)

  const loadProdutos = useCallback(async () => {
    const minhaCarga = ++cargaAtual.current
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
        (loaded, total) => {
          if (minhaCarga === cargaAtual.current) setProgress({ loaded, total })
        },
      )
      if (minhaCarga !== cargaAtual.current) return
      setProdutos(data)
    } catch {
      if (minhaCarga !== cargaAtual.current) return
      toast({ title: 'Erro', description: 'Falha ao carregar as peças.', variant: 'destructive' })
    } finally {
      if (minhaCarga === cargaAtual.current) setLoading(false)
    }
  }, [debouncedSearch, marcaId, categoriaId, toast])

  useEffect(() => {
    if (activeModal === null) loadProdutos()
  }, [activeModal, loadProdutos])

  useEffect(() => {
    setVisibleCount(VISIBLE_BATCH)
  }, [debouncedSearch, marcaId, categoriaId])

  const sortedProdutos = useMemo(
    () => (sortKey ? sortProdutos(produtos, sortKey, sortDir) : produtos),
    [produtos, sortKey, sortDir],
  )

  const selectedPeca = useMemo(() => {
    const row = sortedProdutos.find((p) => p.id === selectedPecaId)
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
      estoque_showroom: row.estoque_showroom,
    }
  }, [sortedProdutos, selectedPecaId])

  const visibleItems = sortedProdutos.slice(0, visibleCount)
  const hasActiveFilters = !!searchInput || !!marcaId || !!categoriaId

  const handleClearFilters = () => {
    setSearchInput('')
    setDebouncedSearch('')
    setMarcaId('')
    setCategoriaId('')
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    if (
      el.scrollHeight - el.scrollTop - el.clientHeight < 300 &&
      visibleCount < sortedProdutos.length
    ) {
      setVisibleCount((prev) => Math.min(prev + VISIBLE_BATCH, sortedProdutos.length))
    }
  }

  const marcaOptions = marcas.map((m) => ({ value: m.id, label: m.nome }))
  const categoriaOptions = categorias.map((c) => ({ value: c.id, label: c.nome }))

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="w-3 h-3 opacity-40" />
    return sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
  }

  return (
    <div className="flex flex-col space-y-4 w-full pb-20 lg:pb-0 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            Peças e Produtos
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Gerencie o catálogo e inventário de peças e produtos.
          </p>
        </div>
        {/* SPEC-174 N7 (decisão 02/10): "Nova Peça" só para quem tem a ação
            "criar" no Cadastro (administração + compras). */}
        {canCreate && (
          <Button
            onClick={() => setActiveModal('peca')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Peça
          </Button>
        )}
      </div>

      {/* SPEC-182 (C2, decisão 06/10): a peça selecionada abre numa área larga
          ABAIXO da lista (cabeçalho + abas por setor, modelo do Connect), no
          lugar do antigo card lateral. */}
      <div className="flex flex-col gap-4">
        <div className="w-full flex flex-col gap-3 min-w-0">
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

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm h-[46vh] min-h-[320px] overflow-hidden flex flex-col">
            <div className="px-4 py-2 text-xs text-slate-500 border-b border-slate-100 shrink-0">
              {loading
                ? `Carregando... ${progress.loaded}${progress.total ? `/${progress.total}` : ''} peças`
                : `${visibleItems.length} de ${sortedProdutos.length} registros ativos`}
            </div>
            <div className="overflow-auto flex-1" onScroll={handleScroll}>
              <Table className="w-full table-fixed">
                <TableHeader className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                  <TableRow className="h-11">
                    {SORT_COLS.map((col) => {
                      const widthClass =
                        col.key === 'codigo_produto'
                          ? 'w-[9%] pl-4 sm:pl-6 pr-2 hidden md:table-cell'
                          : col.key === 'referencia'
                            ? 'w-[15%] pl-4 sm:pl-6 md:pl-2'
                            : col.key === 'nome'
                              ? ''
                              : col.key === 'marca_nome'
                                ? 'w-[12%] hidden xl:table-cell'
                                : col.key === 'preco'
                                  ? 'w-[11%] text-right'
                                  : col.key === 'estoque_total'
                                    ? 'w-[10%] hidden lg:table-cell text-right'
                                    : 'w-[12%] pr-4 sm:pr-6 text-right'
                      const justify =
                        col.key === 'preco' ||
                        col.key === 'estoque_total' ||
                        col.key === 'estoque_disponivel'
                          ? 'justify-end'
                          : ''
                      return (
                        <TableHead
                          key={col.key}
                          className={cn(
                            widthClass,
                            'text-slate-600 font-semibold text-xs uppercase tracking-wide',
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => handleSort(col.key)}
                            className={cn(
                              'flex items-center gap-1 hover:text-slate-900',
                              justify && `w-full ${justify}`,
                            )}
                          >
                            {col.label}
                            {renderSortIcon(col.key)}
                          </button>
                        </TableHead>
                      )
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center">
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
                      <TableCell colSpan={7} className="h-40 text-center">
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
                        onDoubleClick={() => {
                          if (canEdit) setActiveModal('peca', p.id)
                        }}
                        className={cn(
                          // SPEC-174 N5: destaque anterior (bg-primary/5) era fraco
                          // demais em alguns monitores -- só a célula da referência
                          // (bg-primary/10, mais saturada) parecia destacada. Agora
                          // a linha inteira fica com fundo âmbar mais forte e uma
                          // borda lateral esquerda de indicador; texto de código e
                          // referência continuam pretos (SPEC-158 P2.5), não mudam.
                          'cursor-pointer transition-colors h-14 border-b border-slate-50 border-l-4',
                          selectedPecaId === p.id
                            ? 'bg-amber-200/80 hover:bg-amber-200/80 border-l-amber-500'
                            : 'border-l-transparent hover:bg-slate-50/80',
                        )}
                      >
                        <TableCell className="pl-4 sm:pl-6 pr-2 hidden md:table-cell align-middle py-2">
                          {/* SPEC-158 (P2.5): "código" e "referência" ficavam em
                              cinza/laranja claro, forçando a vista para ler --
                              pedido do usuário (22/09/2026): manter o visual
                              discreto (fonte pequena, badge da referência),
                              mas com o texto preto/quase preto. */}
                          <span className="font-mono text-xs text-slate-900 whitespace-nowrap">
                            {p.codigo_produto ?? p.codigo_legado ?? '-'}
                          </span>
                        </TableCell>
                        <TableCell className="pl-4 sm:pl-6 md:pl-2 align-middle py-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-slate-900 font-mono text-xs font-semibold whitespace-nowrap">
                            {p.referencia || p.sku || '-'}
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
              {visibleCount < sortedProdutos.length && !loading && (
                <div className="py-3 text-center text-xs text-slate-400">
                  Role para carregar mais... ({sortedProdutos.length - visibleCount} restantes)
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-full">
          {/* SPEC-115: onDelete removido — excluir peça agora só é possível
              dentro da edição completa (PecaForm.tsx via PecaModal). */}
          <PecaDetailsPanel
            peca={selectedPeca}
            canEdit={!!canEdit}
            onEdit={() => setActiveModal('peca', selectedPeca?.id)}
          />
        </div>
      </div>
    </div>
  )
}
