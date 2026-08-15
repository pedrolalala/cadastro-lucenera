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
  TableFooter,
} from '@/components/ui/table'
import {
  Box,
  Edit,
  Trash2,
  Tag,
  Layers,
  DollarSign,
  Hash,
  FileText,
  Users,
  Truck,
  Building2,
} from 'lucide-react'
import {
  getEstoqueItens,
  getReservasProduto,
  getPedidosCompraEmTransito,
  getFornecedorSugeridoProduto,
  type ReservaProdutoRow,
  type PedidoCompraEmTransitoRow,
  type FornecedorSugeridoProdutoRow,
} from '@/services/produtos'
import { buildEstoquePorSetor } from '@/lib/estoque-sectors'
import { cn } from '@/lib/utils'

// SPEC-049: mesmo dicionário de rótulos de status de pedido de compra usado em
// compras-lucenera-3o23t98ee/src/services/necessidade-compra.ts
// (STATUS_PEDIDO_COMPRA_LABEL). Duplicado aqui porque não há import
// cross-repo entre os dois sistemas — manter os mesmos textos nos dois.
const STATUS_PEDIDO_COMPRA_LABEL: Record<string, string> = {
  rascunho: 'Pendente',
  aprovado: 'Aprovado',
  enviado: 'Pedido Emitido',
  parcialmente_recebido: 'Em Trânsito',
  recebido: 'Recebido',
  cancelado: 'Cancelado',
}

const formatStatusPedidoCompra = (status: string | null | undefined) =>
  status ? (STATUS_PEDIDO_COMPRA_LABEL[status] ?? status) : '-'

const formatDate = (v: string | null | undefined) =>
  v ? new Date(v).toLocaleDateString('pt-BR') : '-'

const formatCurrency = (v: number | null | undefined) =>
  v == null
    ? 'R$ 0,00'
    : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

interface PecaData {
  id: string
  nome: string
  sku: string | null
  codigo_produto?: number | null
  codigo_legado?: number | null
  referencia: string | null
  categoria?: string | null
  marca_nome?: string | null
  valor_venda: number | null
  preco_venda: number | null
  ativo: boolean
  estoque_total: number
  estoque_reservado?: number
  estoque_disponivel: number
}

export function PecaDetailsPanel({
  peca,
  onEdit,
  onDelete,
}: {
  peca: PecaData | null
  onEdit: () => void
  onDelete: () => void
}) {
  const [estoqueData, setEstoqueData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [reservasData, setReservasData] = useState<ReservaProdutoRow[]>([])
  const [loadingReservas, setLoadingReservas] = useState(false)
  const [pedidosData, setPedidosData] = useState<PedidoCompraEmTransitoRow[]>([])
  const [loadingPedidos, setLoadingPedidos] = useState(false)
  const [fornecedorSugerido, setFornecedorSugerido] = useState<FornecedorSugeridoProdutoRow | null>(
    null,
  )
  const [loadingFornecedorSugerido, setLoadingFornecedorSugerido] = useState(false)

  useEffect(() => {
    if (!peca) {
      setEstoqueData([])
      return
    }
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const items = await getEstoqueItens(peca.id)
        if (!cancelled) setEstoqueData(items || [])
      } catch {
        if (!cancelled) setEstoqueData([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [peca])

  // SPEC-049: reserva por cliente/projeto/equipe e pedido de compra em
  // trânsito, somente leitura, carregados em paralelo à seção de estoque.
  useEffect(() => {
    if (!peca) {
      setReservasData([])
      return
    }
    let cancelled = false
    setLoadingReservas(true)
    ;(async () => {
      try {
        const rows = await getReservasProduto(peca.id)
        if (!cancelled) setReservasData(rows || [])
      } catch {
        if (!cancelled) setReservasData([])
      } finally {
        if (!cancelled) setLoadingReservas(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [peca])

  useEffect(() => {
    if (!peca) {
      setPedidosData([])
      return
    }
    let cancelled = false
    setLoadingPedidos(true)
    ;(async () => {
      try {
        const rows = await getPedidosCompraEmTransito(peca.id)
        if (!cancelled) setPedidosData(rows || [])
      } catch {
        if (!cancelled) setPedidosData([])
      } finally {
        if (!cancelled) setLoadingPedidos(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [peca])

  // SPEC-049 (seção adicional "Fornecedor Sugerido"): sugestão de compra por
  // produto (vw_necessidade_compra), independente da seção "Pedido de Compra
  // em Trânsito" — uma reflete pedidos já feitos, a outra uma sugestão.
  useEffect(() => {
    if (!peca) {
      setFornecedorSugerido(null)
      return
    }
    let cancelled = false
    setLoadingFornecedorSugerido(true)
    ;(async () => {
      try {
        const row = await getFornecedorSugeridoProduto(peca.id)
        if (!cancelled) setFornecedorSugerido(row)
      } catch {
        if (!cancelled) setFornecedorSugerido(null)
      } finally {
        if (!cancelled) setLoadingFornecedorSugerido(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [peca])

  const hasStockRecords = estoqueData.length > 0
  const estoquePorSetor = useMemo(
    () => (hasStockRecords ? buildEstoquePorSetor(estoqueData) : []),
    [estoqueData, hasStockRecords],
  )
  const totalGeral = estoquePorSetor.reduce((s, i) => s + i.quantidade, 0)
  // Comprometido total (reserva + entrega futura) por local — usado só na
  // tabela "Estoque por Local" abaixo, que é uma distribuição física por
  // depósito (estoque_itens não distingue setor de reserva por local).
  const totalComprometido = estoquePorSetor.reduce((s, i) => s + (i.quantidade_reservada || 0), 0)
  const totalDisponivelPorLocal = totalGeral - totalComprometido
  // SPEC-101: os badges do cabeçalho ("Reservado"/"Disponível") são a métrica
  // agregada de negócio, não por local — "Reservado" tem que ser só o que
  // está no setor Reserva, não o comprometido inteiro (reserva + entrega
  // futura). estoque_itens.quantidade_reservada mistura os dois por desenho
  // (é usada por outras RPCs com esse significado) — a métrica certa vem de
  // vw_cadastro_produto_reserva_detalhe (mesma fonte da tabela "Reservado por
  // Cliente/Projeto" abaixo), somando só q_reserva por projeto_item_id.
  const totalReservado = reservasData.reduce((s, r) => s + (r.q_reserva || 0), 0)
  const totalDisponivel = totalGeral - totalReservado

  const hasReservas = reservasData.length > 0
  const hasPedidos = pedidosData.length > 0
  const hasFornecedorSugerido = (fornecedorSugerido?.pendente ?? 0) > 0

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

  const codigoDisplay = peca.codigo_produto ?? peca.codigo_legado ?? '-'

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-y-auto flex-1 min-w-0">
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-slate-900 leading-tight break-words break-all">
              {peca.nome}
            </h3>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
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
      </div>

      <div className="p-4 sm:p-5 space-y-3">
        <div className="grid grid-cols-1 gap-2">
          <DetailRow icon={Hash} label="Código" value={String(codigoDisplay)} mono />
          <DetailRow
            icon={FileText}
            label="Referência"
            value={peca.referencia || peca.sku || '-'}
            mono
          />
          <DetailRow icon={Tag} label="Marca" value={peca.marca_nome || 'Não informada'} />
          <DetailRow icon={Layers} label="Categoria" value={peca.categoria || 'Sem categoria'} />
          <DetailRow
            icon={DollarSign}
            label="Preço de Venda"
            value={formatCurrency(peca.valor_venda || peca.preco_venda)}
          />
        </div>
      </div>

      <div className="px-4 sm:px-5 pb-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h4 className="text-sm font-semibold flex items-center text-slate-700">
            <Box className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
            Estoque por Local
          </h4>
          {hasStockRecords && (
            <div className="flex gap-1.5 flex-wrap">
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                Total: {totalGeral}
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                Reservado: {totalReservado}
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                Disponível: {totalDisponivel}
              </span>
            </div>
          )}
        </div>
        {loading ? (
          <div className="border rounded-lg overflow-hidden bg-slate-50 flex-1">
            <Table>
              <TableHeader className="bg-slate-100/80">
                <TableRow>
                  <StockHead>Local</StockHead>
                  <StockHead right>Qtd. Estoque</StockHead>
                  <StockHead right>Disponível</StockHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="py-2.5 px-2">
                      <Skeleton className="h-4 w-20 bg-slate-200" />
                    </TableCell>
                    <TableCell className="py-2.5 px-2">
                      <Skeleton className="h-4 w-6 ml-auto bg-slate-200" />
                    </TableCell>
                    <TableCell className="py-2.5 px-2">
                      <Skeleton className="h-4 w-6 ml-auto bg-slate-200" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : !hasStockRecords ? (
          <div className="border rounded-lg bg-slate-50 flex-1 flex items-center justify-center p-8">
            <p className="text-sm text-slate-500 text-center">
              Produto sem movimentação de estoque (Saldo Zero)
            </p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden bg-slate-50 flex-1 min-w-0">
            <Table>
              <TableHeader className="bg-slate-100/80">
                <TableRow>
                  <StockHead>Local</StockHead>
                  <StockHead right>Qtd. Estoque</StockHead>
                  <StockHead right>Disponível</StockHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estoquePorSetor.map((i) => {
                  const disponivelLocal = i.quantidade - (i.quantidade_reservada || 0)
                  return (
                    <TableRow key={i.local} className="h-10 hover:bg-slate-100/50">
                      <TableCell className="py-2 px-2 text-xs font-medium text-slate-700 break-words max-w-[120px]">
                        {i.local}
                      </TableCell>
                      <TableCell className="py-2 px-2 text-xs text-right">
                        <span
                          className={cn(
                            'font-medium px-1.5 py-0.5 rounded-full',
                            i.quantidade > 0 ? 'bg-slate-100 text-slate-700' : 'text-slate-400',
                          )}
                        >
                          {i.quantidade}
                        </span>
                      </TableCell>
                      <TableCell className="py-2 px-2 text-xs text-right">
                        <span
                          className={cn(
                            'font-medium px-1.5 py-0.5 rounded-full',
                            disponivelLocal > 0
                              ? 'bg-emerald-100 text-emerald-700'
                              : disponivelLocal < 0
                                ? 'bg-destructive/10 text-destructive'
                                : 'text-slate-500',
                          )}
                        >
                          {disponivelLocal}
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
              <TableFooter className="bg-slate-100/80 border-t border-slate-200">
                <TableRow className="h-10">
                  <TableCell className="py-2 px-2 text-xs font-bold text-slate-700">
                    Resumo Final
                  </TableCell>
                  <TableCell className="py-2 px-2 text-xs text-right font-semibold text-slate-600">
                    {totalGeral}
                  </TableCell>
                  <TableCell className="py-2 px-2 text-right">
                    <span
                      className={cn(
                        'text-xs font-bold px-2 py-1 rounded-full',
                        totalDisponivelPorLocal > 0
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-300 text-slate-600',
                      )}
                    >
                      {totalDisponivelPorLocal}
                    </span>
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
      </div>

      {/* SPEC-049: Reservado por Cliente/Projeto */}
      <div className="px-4 sm:px-5 pb-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h4 className="text-sm font-semibold flex items-center text-slate-700">
            <Users className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
            Reservado por Cliente/Projeto
          </h4>
        </div>
        {loadingReservas ? (
          <div className="border rounded-lg overflow-hidden bg-slate-50 flex-1">
            <Table>
              <TableHeader className="bg-slate-100/80">
                <TableRow>
                  <StockHead>Projeto</StockHead>
                  <StockHead>Cliente</StockHead>
                  <StockHead>Equipe</StockHead>
                  <StockHead right>Qtd. Vendida</StockHead>
                  <StockHead right>Reservado</StockHead>
                  <StockHead right>Aguardando Compra</StockHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j} className="py-2.5 px-2">
                        <Skeleton className="h-4 w-full bg-slate-200" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : !hasReservas ? (
          <div className="border rounded-lg bg-slate-50 flex-1 flex items-center justify-center p-8">
            <p className="text-sm text-slate-500 text-center">
              Nenhuma reserva ativa para esta peça.
            </p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden bg-slate-50 flex-1 min-w-0">
            <Table>
              <TableHeader className="bg-slate-100/80">
                <TableRow>
                  <StockHead>Projeto</StockHead>
                  <StockHead>Cliente</StockHead>
                  <StockHead>Equipe</StockHead>
                  <StockHead right>Qtd. Vendida</StockHead>
                  <StockHead right>Reservado</StockHead>
                  <StockHead right>Aguardando Compra</StockHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservasData.map((r) => (
                  <TableRow key={r.projeto_item_id} className="h-10 hover:bg-slate-100/50">
                    <TableCell className="py-2 px-2 text-xs font-medium text-slate-700 break-words max-w-[110px]">
                      {r.projeto_codigo || '-'}
                    </TableCell>
                    <TableCell className="py-2 px-2 text-xs text-slate-700 break-words max-w-[130px]">
                      {r.cliente_nome || '-'}
                    </TableCell>
                    <TableCell className="py-2 px-2 text-xs text-slate-700 break-words max-w-[110px]">
                      {r.equipe_nome || '-'}
                    </TableCell>
                    <TableCell className="py-2 px-2 text-xs text-right">
                      <span className="font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {r.q_venda}
                      </span>
                    </TableCell>
                    <TableCell className="py-2 px-2 text-xs text-right">
                      <span
                        className={cn(
                          'font-medium px-1.5 py-0.5 rounded-full',
                          r.q_reserva > 0 ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400',
                        )}
                      >
                        {r.q_reserva}
                      </span>
                    </TableCell>
                    <TableCell className="py-2 px-2 text-xs text-right">
                      <span
                        className={cn(
                          'font-medium px-1.5 py-0.5 rounded-full',
                          r.q_entrega_futura > 0 ? 'bg-amber-100 text-amber-700' : 'text-slate-400',
                        )}
                      >
                        {r.q_entrega_futura}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* SPEC-049 (seção adicional): Fornecedor Sugerido — independente da
          seção "Pedido de Compra em Trânsito" abaixo; só aparece se houver
          quantidade pendente sugerida para compra (vw_necessidade_compra). */}
      {loadingFornecedorSugerido ? (
        <div className="px-4 sm:px-5 pb-3">
          <Skeleton className="h-4 w-2/3 bg-slate-200" />
        </div>
      ) : (
        hasFornecedorSugerido && (
          <div className="px-4 sm:px-5 pb-3">
            <div className="flex items-center gap-2 text-xs text-slate-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                <span className="font-medium">Fornecedor Sugerido:</span>{' '}
                {fornecedorSugerido?.fornecedor_nome || '-'} ·{' '}
                <span className="font-medium">Pendente:</span> {fornecedorSugerido?.pendente}
              </span>
            </div>
          </div>
        )
      )}

      {/* SPEC-049: Pedido de Compra em Trânsito */}
      <div className="px-4 sm:px-5 pb-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h4 className="text-sm font-semibold flex items-center text-slate-700">
            <Truck className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
            Pedido de Compra em Trânsito
          </h4>
        </div>
        {loadingPedidos ? (
          <div className="border rounded-lg overflow-hidden bg-slate-50 flex-1">
            <Table>
              <TableHeader className="bg-slate-100/80">
                <TableRow>
                  <StockHead>Nº Pedido</StockHead>
                  <StockHead>Status</StockHead>
                  <StockHead>Empresa</StockHead>
                  <StockHead>Previsão de Chegada</StockHead>
                  <StockHead right>Qtd. Pendente</StockHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j} className="py-2.5 px-2">
                        <Skeleton className="h-4 w-full bg-slate-200" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : !hasPedidos ? (
          <div className="border rounded-lg bg-slate-50 flex-1 flex items-center justify-center p-8">
            <p className="text-sm text-slate-500 text-center">
              Nenhum pedido de compra em trânsito para esta peça.
            </p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden bg-slate-50 flex-1 min-w-0">
            <Table>
              <TableHeader className="bg-slate-100/80">
                <TableRow>
                  <StockHead>Nº Pedido</StockHead>
                  <StockHead>Status</StockHead>
                  <StockHead>Empresa</StockHead>
                  <StockHead>Previsão de Chegada</StockHead>
                  <StockHead right>Qtd. Pendente</StockHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pedidosData.map((p) => (
                  <TableRow key={p.pedido_id} className="h-10 hover:bg-slate-100/50">
                    <TableCell className="py-2 px-2 text-xs font-medium text-slate-700 break-words max-w-[110px]">
                      {p.numero || '-'}
                    </TableCell>
                    <TableCell className="py-2 px-2 text-xs">
                      <span className="font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 whitespace-nowrap">
                        {formatStatusPedidoCompra(p.status)}
                      </span>
                    </TableCell>
                    <TableCell className="py-2 px-2 text-xs text-slate-700 break-words max-w-[130px]">
                      {p.empresa_nome || '-'}
                    </TableCell>
                    <TableCell className="py-2 px-2 text-xs text-slate-700 whitespace-nowrap">
                      {formatDate(p.data_prevista_entrega)}
                    </TableCell>
                    <TableCell className="py-2 px-2 text-xs text-right">
                      <span className="font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {p.qtd_pendente}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}

function DetailRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-start gap-2 text-sm min-w-0">
      <Icon className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
      <span className="text-slate-500 shrink-0 min-w-[90px]">{label}:</span>
      <span
        className={cn(
          'font-medium text-slate-800 break-words break-all min-w-0',
          mono && 'font-mono text-xs',
        )}
      >
        {value}
      </span>
    </div>
  )
}

function StockHead({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <TableHead
      className={cn(
        'h-9 py-2 px-2 text-[11px] text-slate-600 whitespace-nowrap',
        right && 'text-right',
      )}
    >
      {children}
    </TableHead>
  )
}
