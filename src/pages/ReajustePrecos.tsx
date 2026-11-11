// SPEC-282 Parte B: reajuste de preço / ST / custo de peças em lote (por peça, marca, categoria,
// fornecedor ou lista de códigos), com pré-visualização, histórico e desfazer. Só administrador.
// A conta é feita no banco (reajuste_previa / reajuste_aplicar / reajuste_desfazer) com a mesma
// fórmula do formulário da peça.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { getCategoriasProduto, getFornecedores, getMarcas } from '@/services/produtos'

type Modo = '' | 'definir' | 'somar' | 'percentual'
interface Opcao {
  id: string
  nome: string
}
interface CampoDef {
  chave: string
  rotulo: string
  modos: { v: Modo; t: string }[]
}

const MODOS_PCT: { v: Modo; t: string }[] = [
  { v: '', t: 'Não alterar' },
  { v: 'definir', t: 'Definir em (%)' },
  { v: 'somar', t: 'Somar pontos (%)' },
]
const MODOS_VALOR: { v: Modo; t: string }[] = [
  { v: '', t: 'Não alterar' },
  { v: 'percentual', t: 'Reajustar em (%)' },
  { v: 'definir', t: 'Definir em (R$)' },
]
const CAMPOS: CampoDef[] = [
  { chave: 'porc_st', rotulo: '% ST', modos: MODOS_PCT },
  { chave: 'ipi_entrada', rotulo: '% IPI', modos: MODOS_PCT },
  { chave: 'porc_frete', rotulo: '% Frete', modos: MODOS_PCT },
  { chave: 'porc_despesas', rotulo: '% Outras despesas', modos: MODOS_PCT },
  { chave: 'porc_desconto', rotulo: '% Desconto do fornecedor', modos: MODOS_PCT },
  { chave: 'margem_lucro', rotulo: '% Lucro', modos: MODOS_PCT },
  { chave: 'preco_custo', rotulo: 'Preço de custo (tabela do fornecedor)', modos: MODOS_VALOR },
  { chave: 'preco_venda', rotulo: 'Preço de venda', modos: MODOS_VALOR },
]

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const num = (v: any) => (v === null || v === undefined ? null : Number(v))
const fmt = (v: any) => (num(v) === null ? '-' : BRL.format(num(v) as number))
const pct = (v: any) => (num(v) === null ? '-' : `${num(v)!.toLocaleString('pt-BR', { maximumFractionDigits: 4 })}%`)
const paraNumero = (s: string) => Number(String(s).trim().replace(/\./g, '').replace(',', '.'))

interface Previa {
  qtd_alteradas: number
  qtd_ignoradas: number
  venda_antes: number
  venda_depois: number
  itens: {
    codigo_produto: number
    referencia: string | null
    nome: string
    antes: Record<string, any>
    depois: Record<string, any>
    ignorado: string | null
  }[]
}
interface Lote {
  id: string
  numero: number
  criado_em: string
  criado_por_nome: string | null
  motivo: string
  qtd_pecas: number
  regra: Record<string, any>
  escopo: Record<string, any>
  desfeito_em: string | null
}

const selectCls =
  'h-9 w-full rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring'

export default function ReajustePrecos() {
  const { toast } = useToast()
  const [permitido, setPermitido] = useState<boolean | null>(null)
  const [marcas, setMarcas] = useState<Opcao[]>([])
  const [categorias, setCategorias] = useState<Opcao[]>([])
  const [fornecedores, setFornecedores] = useState<Opcao[]>([])

  const [marcaId, setMarcaId] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [fornecedorId, setFornecedorId] = useState('')
  const [codigos, setCodigos] = useState('')
  const [todos, setTodos] = useState(false)
  const [campos, setCampos] = useState<Record<string, { modo: Modo; valor: string }>>({})
  const [manter, setManter] = useState<'lucro' | 'venda'>('lucro')
  const [motivo, setMotivo] = useState('')

  const [previa, setPrevia] = useState<Previa | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [lotes, setLotes] = useState<Lote[]>([])

  const carregarLotes = useCallback(async () => {
    const { data } = await (supabase.from as any)('produto_reajuste_lote')
      .select('id, numero, criado_em, criado_por_nome, motivo, qtd_pecas, regra, escopo, desfeito_em')
      .order('criado_em', { ascending: false })
      .limit(20)
    setLotes((data as Lote[]) || [])
  }, [])

  useEffect(() => {
    ;(async () => {
      const { data } = await (supabase.rpc as any)('pode_reajustar_precos')
      setPermitido(data === true)
      if (data !== true) return
      const [m, c, f] = await Promise.all([getMarcas(), getCategoriasProduto(), getFornecedores()])
      setMarcas(m as Opcao[])
      setCategorias(c as Opcao[])
      setFornecedores((f as any[]).map((x) => ({ id: x.id, nome: x.nome || x.razao_social })))
      carregarLotes()
    })()
  }, [carregarLotes])

  const escopo = useMemo(() => {
    const lista = codigos
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter((s) => /^\d+$/.test(s))
    return {
      todos,
      so_ativos: true,
      marca_ids: marcaId ? [marcaId] : [],
      categoria_ids: categoriaId ? [categoriaId] : [],
      fornecedor_ids: fornecedorId ? [fornecedorId] : [],
      codigos: lista,
    }
  }, [todos, marcaId, categoriaId, fornecedorId, codigos])

  const regra = useMemo(() => {
    const r: Record<string, any> = { manter }
    for (const c of CAMPOS) {
      const x = campos[c.chave]
      if (x && x.modo && x.valor.trim() !== '' && !Number.isNaN(paraNumero(x.valor))) {
        r[c.chave] = { modo: x.modo, valor: paraNumero(x.valor) }
      }
    }
    return r
  }, [campos, manter])

  const temCampo = Object.keys(regra).some((k) => k !== 'manter')
  const temEscopo =
    todos || !!marcaId || !!categoriaId || !!fornecedorId || (escopo.codigos as string[]).length > 0
  const mexeuCustoSemVenda =
    !('preco_venda' in regra) && ['preco_custo', 'porc_st', 'ipi_entrada', 'porc_frete', 'porc_despesas', 'porc_desconto'].some((k) => k in regra)

  const invalidar = () => {
    setPrevia(null)
    setConfirmando(false)
  }

  async function gerarPrevia() {
    setCarregando(true)
    setConfirmando(false)
    const { data, error } = await (supabase.rpc as any)('reajuste_previa', {
      p_escopo: escopo,
      p_regra: regra,
      p_limite: 300,
    })
    setCarregando(false)
    if (error) {
      toast({ title: 'Não foi possível calcular', description: error.message, variant: 'destructive' })
      return
    }
    setPrevia(data as Previa)
  }

  async function aplicar() {
    setCarregando(true)
    const { data, error } = await (supabase.rpc as any)('reajuste_aplicar', {
      p_escopo: escopo,
      p_regra: regra,
      p_motivo: motivo,
    })
    setCarregando(false)
    if (error) {
      toast({ title: 'Não foi possível aplicar', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: 'Reajuste aplicado', description: `${(data as any).qtd_pecas} peça(s) atualizada(s).` })
    setPrevia(null)
    setConfirmando(false)
    setMotivo('')
    carregarLotes()
  }

  async function desfazer(l: Lote) {
    setCarregando(true)
    const { data, error } = await (supabase.rpc as any)('reajuste_desfazer', { p_lote: l.id })
    setCarregando(false)
    if (error) {
      toast({ title: 'Não foi possível desfazer', description: error.message, variant: 'destructive' })
      return
    }
    const r = data as any
    toast({
      title: `Lote ${l.numero} desfeito`,
      description:
        `${r.voltaram} peça(s) voltaram ao valor anterior.` +
        (r.puladas_editadas_depois ? ` ${r.puladas_editadas_depois} foram editadas depois e ficaram como estão.` : ''),
    })
    carregarLotes()
  }

  if (permitido === null) return <div className="p-6 text-sm text-slate-500">Carregando…</div>
  if (!permitido)
    return (
      <div className="p-6 max-w-lg space-y-2">
        <h1 className="text-lg font-semibold">Reajuste de preços</h1>
        <p className="text-sm text-slate-600">Só administradores podem reajustar preços de peças.</p>
        <Link to="/pecas" className="text-sm text-primary underline">Voltar às peças</Link>
      </div>
    )

  const dif = previa ? previa.venda_depois - previa.venda_antes : 0

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <Link to="/pecas" className="text-sm text-slate-500 hover:text-slate-800 inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Peças
        </Link>
        <h1 className="text-2xl font-bold tracking-tight mt-1">Reajuste de preços</h1>
        <p className="text-sm text-slate-500 mt-1">
          Altere ST, IPI, custo, lucro ou preço de várias peças de uma vez. Nada é gravado antes de você ver a
          pré-visualização e confirmar.
        </p>
      </div>

      <section className="rounded-lg border bg-white p-4 space-y-3">
        <h2 className="font-semibold">1. Quais peças</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm space-y-1">
            <span className="text-slate-600">Marca</span>
            <select className={selectCls} value={marcaId} onChange={(e) => { setMarcaId(e.target.value); invalidar() }}>
              <option value="">— todas —</option>
              {marcas.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </label>
          <label className="text-sm space-y-1">
            <span className="text-slate-600">Categoria (ex.: Luminária)</span>
            <select className={selectCls} value={categoriaId} onChange={(e) => { setCategoriaId(e.target.value); invalidar() }}>
              <option value="">— todas —</option>
              {categorias.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </label>
          <label className="text-sm space-y-1">
            <span className="text-slate-600">Fornecedor principal</span>
            <select className={selectCls} value={fornecedorId} onChange={(e) => { setFornecedorId(e.target.value); invalidar() }}>
              <option value="">— todos —</option>
              {fornecedores.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </label>
        </div>
        <label className="text-sm space-y-1 block">
          <span className="text-slate-600">Ou uma lista de códigos de peça (separe por espaço, vírgula ou linha)</span>
          <Textarea rows={2} value={codigos} onChange={(e) => { setCodigos(e.target.value); invalidar() }} placeholder="11412 13722" />
        </label>
        <label className="text-sm flex items-center gap-2">
          <input type="checkbox" checked={todos} onChange={(e) => { setTodos(e.target.checked); invalidar() }} />
          Aplicar em <b>todas</b> as peças ativas (use só se for mesmo para o catálogo inteiro)
        </label>
        <p className="text-xs text-slate-500">Marca, categoria e fornecedor se combinam: só entram as peças que atendem a todos os filtros escolhidos.</p>
      </section>

      <section className="rounded-lg border bg-white p-4 space-y-3">
        <h2 className="font-semibold">2. O que mudar</h2>
        <div className="space-y-2">
          {CAMPOS.map((c) => {
            const x = campos[c.chave] || { modo: '' as Modo, valor: '' }
            return (
              <div key={c.chave} className="grid gap-2 sm:grid-cols-[220px_190px_140px] items-center">
                <span className="text-sm">{c.rotulo}</span>
                <select
                  className={selectCls}
                  value={x.modo}
                  onChange={(e) => { setCampos({ ...campos, [c.chave]: { ...x, modo: e.target.value as Modo } }); invalidar() }}
                >
                  {c.modos.map((m) => <option key={m.v} value={m.v}>{m.t}</option>)}
                </select>
                <Input
                  inputMode="decimal"
                  disabled={!x.modo}
                  placeholder="valor"
                  value={x.valor}
                  onChange={(e) => { setCampos({ ...campos, [c.chave]: { ...x, valor: e.target.value } }); invalidar() }}
                />
              </div>
            )
          })}
        </div>
        {mexeuCustoSemVenda && (
          <div className="rounded-md bg-slate-50 border p-3 text-sm space-y-1">
            <p className="font-medium">Como o preço de venda deve reagir à mudança de custo/impostos?</p>
            <label className="flex items-center gap-2">
              <input type="radio" checked={manter === 'lucro'} onChange={() => { setManter('lucro'); invalidar() }} />
              Manter o % de lucro (a venda sobe junto com o custo) — padrão
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" checked={manter === 'venda'} onChange={() => { setManter('venda'); invalidar() }} />
              Manter o preço de venda (o % de lucro é recalculado)
            </label>
          </div>
        )}
        <p className="text-xs text-slate-500">
          Peças sem preço de custo não têm base para recalcular e ficam de fora (aparecem como ignoradas), a menos que você reajuste o preço de venda direto.
        </p>
      </section>

      <div>
        <Button disabled={!temCampo || !temEscopo || carregando} onClick={gerarPrevia}>
          {carregando && !previa ? 'Calculando…' : '3. Pré-visualizar'}
        </Button>
        {(!temEscopo || !temCampo) && (
          <span className="ml-3 text-xs text-slate-500">
            {!temEscopo ? 'Escolha as peças (passo 1). ' : ''}
            {!temCampo ? 'Escolha o que mudar (passo 2).' : ''}
          </span>
        )}
      </div>

      {previa && (
        <section className="rounded-lg border bg-white p-4 space-y-3">
          <h2 className="font-semibold">Pré-visualização (nada foi gravado)</h2>
          <div className="text-sm space-y-1">
            <p>
              <b>{previa.qtd_alteradas}</b> peça(s) seriam alteradas
              {previa.qtd_ignoradas > 0 && <> · {previa.qtd_ignoradas} ignorada(s) (sem preço de custo)</>}.
            </p>
            <p>
              Soma dos preços de venda dessas peças: {fmt(previa.venda_antes)} → <b>{fmt(previa.venda_depois)}</b>{' '}
              <span className={dif >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                ({dif >= 0 ? '+' : ''}{BRL.format(dif)})
              </span>
            </p>
            {previa.itens.length >= 300 && <p className="text-xs text-slate-500">Mostrando as 300 primeiras; o reajuste vale para todas.</p>}
          </div>
          <div className="overflow-auto max-h-96 border rounded-md">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 sticky top-0">
                <tr className="text-left">
                  <th className="p-2">Cód.</th><th className="p-2">Ref.</th><th className="p-2">Peça</th>
                  <th className="p-2">ST</th><th className="p-2">Custo total</th><th className="p-2">Preço de venda</th>
                </tr>
              </thead>
              <tbody>
                {previa.itens.map((i) => (
                  <tr key={i.codigo_produto} className={i.ignorado ? 'text-slate-400' : 'border-t'}>
                    <td className="p-2">{i.codigo_produto}</td>
                    <td className="p-2">{i.referencia}</td>
                    <td className="p-2 max-w-[260px] truncate" title={i.nome}>{i.nome}{i.ignorado ? ` — ${i.ignorado}` : ''}</td>
                    <td className="p-2 whitespace-nowrap">{pct(i.antes.porc_st)} → {pct(i.depois.porc_st)}</td>
                    <td className="p-2 whitespace-nowrap">{fmt(i.antes.custo_total)} → {fmt(i.depois.custo_total)}</td>
                    <td className="p-2 whitespace-nowrap">{fmt(i.antes.preco_venda)} → <b>{fmt(i.depois.preco_venda)}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {previa.qtd_alteradas > 0 && (
            <div className="space-y-2">
              <label className="text-sm block space-y-1">
                <span className="text-slate-600">Motivo (fica no histórico) *</span>
                <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: ST da Connect de 11/11" />
              </label>
              {!confirmando ? (
                <Button disabled={!motivo.trim() || carregando} onClick={() => setConfirmando(true)}>
                  4. Aplicar reajuste
                </Button>
              ) : (
                <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm space-y-2">
                  <p>
                    Confirmar o reajuste de <b>{previa.qtd_alteradas}</b> peça(s)? Dá para desfazer o lote depois pelo histórico,
                    enquanto as peças não forem editadas de novo.
                  </p>
                  <div className="flex gap-2">
                    <Button disabled={carregando} onClick={aplicar}>{carregando ? 'Aplicando…' : 'Sim, aplicar'}</Button>
                    <Button variant="outline" disabled={carregando} onClick={() => setConfirmando(false)}>Cancelar</Button>
                  </div>
                </div>
              )}
              <p className="text-xs text-slate-500">
                Os orçamentos em aberto não mudam sozinhos: ao reabrir, o Orçamentos pergunta se quer atualizar os preços.
              </p>
            </div>
          )}
        </section>
      )}

      <section className="rounded-lg border bg-white p-4 space-y-2">
        <h2 className="font-semibold">Histórico de reajustes</h2>
        {lotes.length === 0 && <p className="text-sm text-slate-500">Nenhum reajuste feito ainda.</p>}
        {lotes.map((l) => (
          <div key={l.id} className="flex flex-wrap items-center justify-between gap-2 border-t pt-2 text-sm">
            <div>
              <p>
                <b>Lote {l.numero}</b> · {new Date(l.criado_em).toLocaleString('pt-BR')} · {l.criado_por_nome || '—'} ·{' '}
                {l.qtd_pecas} peça(s)
                {l.desfeito_em && <span className="ml-2 text-red-700">desfeito em {new Date(l.desfeito_em).toLocaleDateString('pt-BR')}</span>}
              </p>
              <p className="text-xs text-slate-500">{l.motivo}</p>
            </div>
            {!l.desfeito_em && (
              <Button size="sm" variant="outline" disabled={carregando} onClick={() => desfazer(l)}>
                Desfazer lote
              </Button>
            )}
          </div>
        ))}
      </section>
    </div>
  )
}
