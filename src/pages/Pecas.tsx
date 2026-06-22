import { useState, useEffect, useMemo } from 'react'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Edit, Trash2, Box, Plus } from 'lucide-react'
import useDataStore from '@/stores/use-data-store'
import { getProdutos, deleteProduto, getEstoqueItens } from '@/services/produtos'
import { Database } from '@/lib/supabase/types'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

type ProdutoRow = Database['public']['Tables']['produtos']['Row']
type Produto = ProdutoRow & {
  marca?: { nome: string } | null
  fornecedor?: { nome: string } | null
  categoria_rel?: { nome: string } | null
}

export default function Pecas() {
  const { activeModal, setActiveModal } = useDataStore()
  const { toast } = useToast()

  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategoria, setFilterCategoria] = useState('todas')

  const [selectedPecaId, setSelectedPecaId] = useState<string | null>(null)
  const [estoqueItens, setEstoqueItens] = useState<any[]>([])
  const [loadingEstoque, setLoadingEstoque] = useState(false)

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadProdutos = async () => {
    setLoading(true)
    try {
      const data = await getProdutos()
      setProdutos(data as Produto[])
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao carregar as peças.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeModal === null) {
      loadProdutos()
    }
  }, [activeModal])

  useEffect(() => {
    if (selectedPecaId) {
      setLoadingEstoque(true)
      getEstoqueItens(selectedPecaId)
        .then((data) => setEstoqueItens(data || []))
        .catch(() =>
          toast({
            title: 'Erro',
            description: 'Falha ao carregar estoque.',
            variant: 'destructive',
          }),
        )
        .finally(() => setLoadingEstoque(false))
    } else {
      setEstoqueItens([])
    }
  }, [selectedPecaId, toast])

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await deleteProduto(deleteId)
      toast({ title: 'Sucesso', description: 'Peça removida com sucesso!' })
      setProdutos((prev) => prev.filter((p) => p.id !== deleteId))
      if (selectedPecaId === deleteId) {
        setSelectedPecaId(null)
      }
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao remover a peça.', variant: 'destructive' })
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  const formatCurrency = (value: number | null | undefined) => {
    if (value == null) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const categorias = useMemo(() => {
    return Array.from(
      new Set(produtos.map((p) => p.categoria_rel?.nome || p.categoria).filter(Boolean)),
    ) as string[]
  }, [produtos])

  const filtered = useMemo(() => {
    return produtos.filter((p) => {
      const matchSearch =
        searchTerm === '' ||
        p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(p.codigo_produto || '').includes(searchTerm) ||
        String(p.sku || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      const catName = p.categoria_rel?.nome || p.categoria || ''
      const matchCat = filterCategoria === 'todas' || catName === filterCategoria
      return matchSearch && matchCat
    })
  }, [produtos, searchTerm, filterCategoria])

  const selectedPeca = useMemo(() => {
    return produtos.find((p) => p.id === selectedPecaId) || null
  }, [produtos, selectedPecaId])

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
          className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Peça
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Lista de Peças (Master) */}
        <div className="w-full lg:w-[70%] space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por código, nome ou SKU..."
                className="pl-9 bg-slate-50 border-slate-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-64 shrink-0">
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
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 border-b border-slate-200">
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
                      <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                        <div className="flex justify-center items-center h-full">
                          <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-40 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <Box className="w-10 h-10 mb-3 text-slate-300" />
                          <p className="text-slate-600 font-medium">Nenhuma peça encontrada</p>
                          <p className="text-sm">
                            Tente ajustar seus filtros ou crie uma nova peça.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((p) => (
                      <TableRow
                        key={p.id}
                        onClick={() => setSelectedPecaId(p.id)}
                        className={cn(
                          'cursor-pointer transition-colors border-l-4',
                          selectedPecaId === p.id
                            ? 'bg-amber-50/60 border-l-amber-600 hover:bg-amber-50'
                            : 'hover:bg-slate-50/80 border-l-transparent',
                        )}
                      >
                        <TableCell className="font-mono text-xs text-slate-500 pl-6">
                          {p.codigo_produto != null ? p.codigo_produto : '-'}
                          {p.sku && (
                            <div className="text-[10px] text-slate-400 mt-0.5">{p.sku}</div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium text-slate-900">{p.nome}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                            {p.categoria_rel?.nome || p.categoria || 'Sem categoria'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium text-slate-700 pr-6">
                          {formatCurrency((p as any).valor_venda || p.preco_venda)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Detalhes da Peça (Detail) */}
        <div className="w-full lg:w-[30%]">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden sticky top-6">
            {!selectedPeca ? (
              <div className="p-8 text-center flex flex-col items-center justify-center text-slate-500 min-h-[400px]">
                <Box className="w-12 h-12 mb-4 text-slate-200" />
                <h3 className="font-medium text-slate-900 mb-1">Nenhuma peça selecionada</h3>
                <p className="text-sm">
                  Clique em uma peça na lista para ver seus detalhes e estoque.
                </p>
              </div>
            ) : (
              <div className="flex flex-col min-h-[400px]">
                <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-slate-900 leading-tight">
                      {selectedPeca.nome}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 font-mono bg-slate-200/50 inline-block px-1.5 py-0.5 rounded">
                      Cód: {selectedPeca.codigo_produto}{' '}
                      {selectedPeca.sku ? `| SKU: ${selectedPeca.sku}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="bg-slate-900 hover:bg-slate-800 text-white h-8 text-xs w-full"
                      onClick={() => setActiveModal('peca', selectedPeca.id)}
                    >
                      <Edit className="h-3 w-3 mr-1.5" />
                      Editar Peça
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50 w-full"
                      onClick={() => setDeleteId(selectedPeca.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1.5" />
                      Excluir
                    </Button>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <h4 className="text-sm font-semibold mb-3 flex items-center text-slate-700">
                    <Box className="w-4 h-4 mr-2 text-slate-400" />
                    Estoque Integrado
                  </h4>

                  <div className="border rounded-lg overflow-hidden bg-slate-50 flex-1">
                    <Table>
                      <TableHeader className="bg-slate-100/80">
                        <TableRow>
                          <TableHead className="h-9 py-2 px-3 text-xs text-slate-600">
                            Setor
                          </TableHead>
                          <TableHead className="h-9 py-2 px-3 text-xs text-right text-slate-600">
                            Atual
                          </TableHead>
                          <TableHead className="h-9 py-2 px-3 text-xs text-right text-slate-600">
                            Reserv.
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loadingEstoque ? (
                          Array.from({ length: 3 }).map((_, i) => (
                            <TableRow key={i}>
                              <TableCell className="py-2.5 px-3">
                                <Skeleton className="h-4 w-20 bg-slate-200" />
                              </TableCell>
                              <TableCell className="py-2.5 px-3">
                                <Skeleton className="h-4 w-8 ml-auto bg-slate-200" />
                              </TableCell>
                              <TableCell className="py-2.5 px-3">
                                <Skeleton className="h-4 w-8 ml-auto bg-slate-200" />
                              </TableCell>
                            </TableRow>
                          ))
                        ) : estoqueItens.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={3}
                              className="text-center text-xs text-slate-500 py-8"
                            >
                              <div className="flex flex-col items-center justify-center">
                                <Box className="h-8 w-8 text-slate-200 mb-2" />
                                <span>Nenhum registro de estoque.</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          estoqueItens.map((i) => (
                            <TableRow key={i.id} className="h-10 hover:bg-slate-100/50">
                              <TableCell className="py-2 px-3 text-xs font-medium text-slate-700">
                                {i.local}
                              </TableCell>
                              <TableCell className="py-2 px-3 text-xs text-right">
                                <span
                                  className={cn(
                                    'font-medium px-2 py-0.5 rounded-full',
                                    i.quantidade > 0
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : 'bg-red-100 text-red-700',
                                  )}
                                >
                                  {i.quantidade}
                                </span>
                              </TableCell>
                              <TableCell className="py-2 px-3 text-xs text-right text-slate-500">
                                {i.quantidade_reservada || 0}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
          </div>
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
