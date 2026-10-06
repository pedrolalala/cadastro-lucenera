import { useEffect, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { isSetorForaDoGeral, type SetorQuantidadeRow } from '@/lib/estoque-sectors'
import type { MovimentoProdutoRow, PedidoCompraEmTransitoRow } from '@/services/produtos'
import { cn } from '@/lib/utils'

// SPEC-182 (C2, decisões do usuário 06/10): consulta de peça com abas por setor
// no modelo do Connect. "Setores" = visão consolidada (setor + quantidade);
// Reserva / Entrega Futura / Separação / Entregue têm as mesmas colunas e só
// mudam o filtro; Compras lista os pedidos de compra ativos da peça. Entregue é
// só histórico (sem ação de devolução — a devolução é pelo orçamento).

type AbaMovimento = 'reserva' | 'entrega_futura' | 'separacao' | 'entregue'
type Aba = 'setores' | AbaMovimento | 'compras'

const ABAS_MOVIMENTO: { aba: AbaMovimento; rotulo: string; setor: string }[] = [
  { aba: 'reserva', rotulo: 'Reserva', setor: 'Reserva' },
  { aba: 'entrega_futura', rotulo: 'Entrega Futura', setor: 'Entrega Futura' },
  { aba: 'separacao', rotulo: 'Separação', setor: 'Separação' },
  { aba: 'entregue', rotulo: 'Entregue', setor: 'Entregue' },
]

const qtdDoSetor = (m: MovimentoProdutoRow, aba: AbaMovimento) =>
  aba === 'reserva'
    ? m.q_reserva
    : aba === 'entrega_futura'
      ? m.q_entrega_futura
      : aba === 'separacao'
        ? m.q_separacao
        : m.q_entregue

const semPrefixo = (n: string | null | undefined) => (n || '').replace(/^(VENDA|ORC)-/i, '')

// Data sem fuso: "2026-10-18" vira 18/10/2026 sem voltar um dia.
const formatDate = (v: string | null | undefined) => {
  if (!v) return '-'
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v)
  if (m) return `${m[3]}/${m[2]}/${m[1]}`
  return new Date(v).toLocaleDateString('pt-BR')
}

const formatCurrency = (v: number | null | undefined) =>
  v == null ? '-' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const PERFIL_LABEL: Record<string, string> = { ribeirao: 'Ribeirão', sao_paulo: 'São Paulo' }

function Head({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <TableHead
      className={cn(
        'h-9 py-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-600 whitespace-nowrap',
        right && 'text-right',
      )}
    >
      {children}
    </TableHead>
  )
}

function Vazio({ texto }: { texto: string }) {
  return (
    <div className="border rounded-lg bg-slate-50 flex items-center justify-center p-8">
      <p className="text-sm text-slate-500 text-center">{texto}</p>
    </div>
  )
}

function Carregando({ colunas }: { colunas: number }) {
  return (
    <div className="border rounded-lg bg-slate-50 p-3 space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${colunas}, 1fr)` }}
        >
          {Array.from({ length: colunas }).map((__, j) => (
            <Skeleton key={j} className="h-4 bg-slate-200" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function PecaAbasSetores({
  pecaId,
  setores,
  carregandoSetores,
  movimentos,
  carregandoMovimentos,
  pedidos,
  carregandoPedidos,
}: {
  pecaId: string
  setores: SetorQuantidadeRow[]
  carregandoSetores: boolean
  movimentos: MovimentoProdutoRow[]
  carregandoMovimentos: boolean
  pedidos: PedidoCompraEmTransitoRow[]
  carregandoPedidos: boolean
}) {
  const [aba, setAba] = useState<Aba>('setores')

  // Trocou de peça: volta para a visão consolidada.
  useEffect(() => {
    setAba('setores')
  }, [pecaId])

  const linhasDaAba = (a: AbaMovimento) => movimentos.filter((m) => qtdDoSetor(m, a) > 0)
  const abaDoSetor = (local: string) => ABAS_MOVIMENTO.find((x) => x.setor === local)?.aba

  return (
    <Tabs value={aba} onValueChange={(v) => setAba(v as Aba)} className="w-full">
      <TabsList className="h-auto flex-wrap justify-start gap-1 bg-slate-100 p-1">
        <TabsTrigger value="setores" className="data-[state=active]:bg-white">
          Setores
        </TabsTrigger>
        {ABAS_MOVIMENTO.map(({ aba: a, rotulo }) => {
          const n = linhasDaAba(a).length
          return (
            <TabsTrigger key={a} value={a} className="gap-1.5 data-[state=active]:bg-white">
              {rotulo}
              {n > 0 && (
                <span className="rounded-full bg-slate-200 px-1.5 text-[10px] font-semibold text-slate-700">
                  {n}
                </span>
              )}
            </TabsTrigger>
          )
        })}
        <TabsTrigger value="compras" className="gap-1.5 data-[state=active]:bg-white">
          Compras
          {pedidos.length > 0 && (
            <span className="rounded-full bg-slate-200 px-1.5 text-[10px] font-semibold text-slate-700">
              {pedidos.length}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      {/* Visão consolidada: clicar num setor com detalhe abre a aba dele. */}
      <TabsContent value="setores" className="mt-3">
        {carregandoSetores ? (
          <Carregando colunas={2} />
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-100/80">
                <TableRow>
                  <Head>Setor</Head>
                  <Head right>Quantidade</Head>
                </TableRow>
              </TableHeader>
              <TableBody>
                {setores.map((s) => {
                  const destino = abaDoSetor(s.local)
                  return (
                    <TableRow
                      key={s.local}
                      onClick={destino ? () => setAba(destino) : undefined}
                      className={cn(
                        'h-10',
                        destino ? 'cursor-pointer hover:bg-amber-50' : 'hover:bg-transparent',
                      )}
                      title={destino ? `Ver detalhe de ${s.local}` : undefined}
                    >
                      <TableCell className="py-2 px-3 text-sm font-medium text-slate-700">
                        <span className="flex items-center gap-1.5">
                          {s.local}
                          {isSetorForaDoGeral(s.local) && (
                            <span className="text-[9px] font-semibold uppercase text-amber-700 bg-amber-50 border border-amber-200 rounded px-1 py-0.5">
                              fora do disponível
                            </span>
                          )}
                          {destino && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                        </span>
                      </TableCell>
                      <TableCell
                        className={cn(
                          'py-2 px-3 text-sm text-right font-semibold tabular-nums',
                          s.quantidade > 0
                            ? 'text-slate-900'
                            : s.quantidade < 0
                              ? 'text-destructive'
                              : 'text-slate-400',
                        )}
                      >
                        {s.quantidade}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>

      {ABAS_MOVIMENTO.map(({ aba: a, rotulo }) => {
        const linhas = linhasDaAba(a)
        return (
          <TabsContent key={a} value={a} className="mt-3">
            {carregandoMovimentos ? (
              <Carregando colunas={6} />
            ) : linhas.length === 0 ? (
              <Vazio texto={`Nenhuma venda com esta peça em ${rotulo}.`} />
            ) : (
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-100/80">
                    <TableRow>
                      <Head>Orçamento</Head>
                      <Head>Venda</Head>
                      <Head>Funcionário</Head>
                      <Head>Cliente</Head>
                      <Head>Projeto</Head>
                      <Head>L</Head>
                      <Head right>Qtd</Head>
                      <Head>Data Orçamento</Head>
                      <Head>Data da Entrega</Head>
                      <Head right>Valor Total</Head>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {linhas.map((m) => (
                      <TableRow key={m.projeto_item_id} className="h-10 hover:bg-slate-50">
                        <TableCell className="py-2 px-3 text-xs font-mono">
                          {semPrefixo(m.orcamento_numero) || '-'}
                        </TableCell>
                        <TableCell className="py-2 px-3 text-xs font-mono font-semibold">
                          {semPrefixo(m.venda_numero) || '-'}
                        </TableCell>
                        <TableCell className="py-2 px-3 text-xs text-slate-700">
                          {m.funcionario_nome?.trim() || '-'}
                        </TableCell>
                        <TableCell className="py-2 px-3 text-xs text-slate-700 max-w-[220px] break-words">
                          {m.cliente_nome || '-'}
                        </TableCell>
                        <TableCell className="py-2 px-3 text-xs text-slate-700 whitespace-nowrap">
                          {m.projeto_codigo || '-'}
                        </TableCell>
                        <TableCell className="py-2 px-3 text-xs font-mono">
                          {m.l_fixo || '-'}
                        </TableCell>
                        <TableCell className="py-2 px-3 text-xs text-right font-semibold tabular-nums">
                          {qtdDoSetor(m, a)}
                          {a === 'entregue' && m.q_devolvida_entregue > 0 && (
                            <div className="text-[10px] font-normal text-slate-500">
                              {m.q_devolvida_entregue} devolvida(s)
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="py-2 px-3 text-xs whitespace-nowrap">
                          {formatDate(m.data_orcamento)}
                        </TableCell>
                        <TableCell className="py-2 px-3 text-xs whitespace-nowrap">
                          {formatDate(m.data_entrega)}
                        </TableCell>
                        <TableCell className="py-2 px-3 text-xs text-right whitespace-nowrap">
                          {formatCurrency(m.valor_total_orcamento)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        )
      })}

      <TabsContent value="compras" className="mt-3">
        {carregandoPedidos ? (
          <Carregando colunas={6} />
        ) : pedidos.length === 0 ? (
          <Vazio texto="Nenhum pedido de compra ativo para esta peça." />
        ) : (
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-100/80">
                <TableRow>
                  <Head>Pedido</Head>
                  <Head right>Qtd</Head>
                  <Head>Data Emissão</Head>
                  <Head>Data Entrega</Head>
                  <Head>Empresa</Head>
                  <Head>Perfil</Head>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pedidos.map((p) => (
                  <TableRow key={p.pedido_id} className="h-10 hover:bg-slate-50">
                    <TableCell className="py-2 px-3 text-xs font-mono font-semibold">
                      {p.numero || '-'}
                    </TableCell>
                    <TableCell className="py-2 px-3 text-xs text-right font-semibold tabular-nums">
                      {p.qtd_pendente}
                    </TableCell>
                    <TableCell className="py-2 px-3 text-xs whitespace-nowrap">
                      {formatDate(p.data_emissao)}
                    </TableCell>
                    <TableCell className="py-2 px-3 text-xs whitespace-nowrap">
                      {formatDate(p.data_prevista_entrega)}
                    </TableCell>
                    <TableCell className="py-2 px-3 text-xs text-slate-700">
                      {p.empresa_nome || '-'}
                    </TableCell>
                    <TableCell className="py-2 px-3 text-xs text-slate-700">
                      {p.perfil ? (PERFIL_LABEL[p.perfil] ?? p.perfil) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
