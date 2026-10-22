import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Box, Edit } from 'lucide-react'
import {
  getEstoqueItens,
  getSetoresProduto,
  getMovimentosProduto,
  getPedidosCompraEmTransito,
  type MovimentoProdutoRow,
  type PedidoCompraEmTransitoRow,
} from '@/services/produtos'
import {
  buildSetoresObrigatorios,
  calcularDisponivel,
  type SetoresSaldosProjeto,
} from '@/lib/estoque-sectors'
import { PecaAbasSetores } from '@/components/pecas/PecaAbasSetores'
import { cn } from '@/lib/utils'

const formatCurrency = (v: number | null | undefined) =>
  v == null
    ? 'R$ 0,00'
    : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

interface PecaData {
  id: string
  nome: string
  codigo_produto?: number | null
  referencia: string | null
  categoria?: string | null
  marca_nome?: string | null
  valor_venda: number | null
  preco_venda: number | null
  ativo: boolean
  estoque_total: number
  estoque_reservado?: number
  estoque_disponivel: number
  estoque_showroom?: number | null
}

export function PecaDetailsPanel({
  peca,
  canEdit,
  onEdit,
}: {
  peca: PecaData | null
  // SPEC-174 N7: todo mundo que abre este painel já consultou o produto;
  // só quem tem a ação "editar" no Cadastro (hub_pode_executar) vê o botão.
  canEdit: boolean
  onEdit: () => void
}) {
  const [estoqueData, setEstoqueData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  // SPEC-182 (C2): itens de venda com a peça por setor (abas Reserva/Entrega
  // Futura/Separação/Entregue) — substitui "Reservado por Cliente/Projeto".
  const [movimentos, setMovimentos] = useState<MovimentoProdutoRow[]>([])
  // SPEC-174 N6c: Reserva/Separação/Entrega Futura somadas por peça.
  const [setoresSaldos, setSetoresSaldos] = useState<SetoresSaldosProjeto | null>(null)
  const [loadingMovimentos, setLoadingMovimentos] = useState(false)
  const [pedidosData, setPedidosData] = useState<PedidoCompraEmTransitoRow[]>([])
  const [loadingPedidos, setLoadingPedidos] = useState(false)

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

  useEffect(() => {
    if (!peca) {
      setSetoresSaldos(null)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const saldos = await getSetoresProduto(peca.id)
        if (!cancelled) setSetoresSaldos(saldos)
      } catch {
        if (!cancelled) setSetoresSaldos(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [peca])

  // SPEC-049 / SPEC-182 (C2): vendas da peça por setor e pedidos de compra
  // ativos, somente leitura, carregados em paralelo à seção de estoque.
  useEffect(() => {
    if (!peca) {
      setMovimentos([])
      return
    }
    let cancelled = false
    setLoadingMovimentos(true)
    ;(async () => {
      try {
        const rows = await getMovimentosProduto(peca.id)
        if (!cancelled) setMovimentos(rows || [])
      } catch {
        if (!cancelled) setMovimentos([])
      } finally {
        if (!cancelled) setLoadingMovimentos(false)
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

  // SPEC-151: a quantidade de Showroom nunca vem de estoque_itens — o trigger
  // fn_sync_estoque_itens_from_produtos zera essa linha (local='Showroom') a
  // cada update de produtos, para não duplicar soma de estoque. A fonte real
  // é produtos.estoque_showroom, a mesma que o site público do Showroom usa.
  const estoqueShowroom = Number(peca?.estoque_showroom) || 0
  // SPEC-191 B1: a conta é a mesma da coluna Disponível da lista.
  const totalDisponivel = calcularDisponivel(estoqueData, setoresSaldos).disponivel

  // SPEC-174 N6c: os 8 setores obrigatórios, sempre visíveis. SPEC-222: a linha
  // "Entregue" (SPEC-182) saiu junto com a aba — informação que não serve aqui.
  const setores = useMemo(
    () => buildSetoresObrigatorios(estoqueData, estoqueShowroom, setoresSaldos),
    [estoqueData, estoqueShowroom, setoresSaldos],
  )

  if (!peca) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-8 text-center flex flex-col items-center justify-center text-slate-500 min-h-[160px]">
          <Box className="w-12 h-12 mb-4 text-slate-200" />
          <h3 className="font-medium text-slate-900 mb-1">Nenhuma peça selecionada</h3>
          <p className="text-sm">
            Clique em uma peça na lista para ver o estoque por setor, as vendas e as compras dela.
          </p>
        </div>
      </div>
    )
  }

  const codigoDisplay = peca.codigo_produto ?? '-'

  // SPEC-182 (C2): cabeçalho fixo no modelo do Connect — Código, Referência,
  // Descrição, Valor de Venda e Disponível em destaque (negativo em vermelho).
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm min-w-0">
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 rounded-t-xl">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          <div className="grid flex-1 min-w-0 grid-cols-2 md:grid-cols-[110px_160px_1fr_140px] gap-x-4 gap-y-3">
            <Campo rotulo="Código" valor={String(codigoDisplay)} mono />
            <Campo rotulo="Referência" valor={peca.referencia || '-'} mono />
            <Campo
              rotulo="Descrição"
              valor={peca.nome}
              className="col-span-2 md:col-span-1"
              extra={
                <span className="text-[11px] text-slate-500">
                  {peca.marca_nome || 'Marca não informada'} · {peca.categoria || 'Sem categoria'}
                  <span
                    className={cn(
                      'ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase',
                      peca.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600',
                    )}
                  >
                    {peca.ativo ? 'Ativo' : 'Desativada'}
                  </span>
                </span>
              }
            />
            <Campo
              rotulo="Valor de Venda"
              valor={formatCurrency(peca.valor_venda || peca.preco_venda)}
            />
          </div>
          <div className="flex items-end gap-3 shrink-0">
            <div
              className={cn(
                'rounded-lg border-2 px-4 py-2 text-center min-w-[120px]',
                loading
                  ? 'border-slate-200 bg-white'
                  : totalDisponivel < 0
                    ? 'border-red-300 bg-red-50'
                    : totalDisponivel > 0
                      ? 'border-emerald-300 bg-emerald-50'
                      : 'border-slate-300 bg-white',
              )}
              title="Estoque geral − reserva − separação (vale a maior reserva entre o sistema e a Connect)"
            >
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Disponível
              </p>
              {loading ? (
                <Skeleton className="h-7 w-10 mx-auto bg-slate-200" />
              ) : (
                <p
                  className={cn(
                    'text-2xl font-bold tabular-nums leading-tight',
                    totalDisponivel < 0
                      ? 'text-destructive'
                      : totalDisponivel > 0
                        ? 'text-emerald-700'
                        : 'text-slate-500',
                  )}
                >
                  {totalDisponivel}
                </p>
              )}
            </div>
            {/* SPEC-115: "Excluir" fica só na edição completa. SPEC-174 N7: sem a
                ação "editar" no Cadastro, o botão nem aparece. */}
            {canEdit && (
              <Button
                size="sm"
                className="bg-slate-900 hover:bg-slate-800 text-white h-9 text-xs"
                onClick={onEdit}
              >
                <Edit className="h-3 w-3 mr-1.5" />
                Editar
              </Button>
            )}
          </div>
        </div>
        {/* SPEC-191 B5 (reunião 08/10): a faixa "Fornecedor Sugerido · Pendente"
            saiu — o pendente é o negativo que já aparece no destaque Disponível,
            e sem ela cabe mais coisa na tela. */}
      </div>

      <div className="p-4 sm:p-5">
        <PecaAbasSetores
          pecaId={peca.id}
          setores={setores}
          carregandoSetores={loading}
          movimentos={movimentos}
          carregandoMovimentos={loadingMovimentos}
          pedidos={pedidosData}
          carregandoPedidos={loadingPedidos}
        />
      </div>
    </div>
  )
}

function Campo({
  rotulo,
  valor,
  mono,
  className,
  extra,
}: {
  rotulo: string
  valor: string
  mono?: boolean
  className?: string
  extra?: React.ReactNode
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{rotulo}</p>
      <p
        className={cn(
          'font-semibold text-slate-900 break-words',
          mono ? 'font-mono text-sm' : 'text-sm',
        )}
      >
        {valor}
      </p>
      {extra}
    </div>
  )
}
