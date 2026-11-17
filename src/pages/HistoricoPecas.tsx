// SPEC-319 (Reunião 61): histórico geral de movimentação das peças dentro da Consulta de Produtos.
// Fonte: RPC relatorio_movimentacao_item (kardex SPEC-231 G). Só administrador (a RPC confere de novo).
// Código vazio = todas as peças, tudo o que há registrado, em ordem cronológica.
// Tabela com layout fixo e texto quebrando em linha: cabe na tela sem rolagem lateral.
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Download, Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase/client'

interface Movimento {
  ordem: number
  data: string
  codigo_produto: number
  produto: string
  historico: string | null
  /** E entrada de nota · S saída (venda) · D devolução · T transferência · I saldo inicial · '' saldo anterior */
  tipo: string
  quantidade: number | null
  saldo_setor: number
  saldo_geral: number
  setor: string
  usuario: string | null
  sistema: string | null
  nota: string | null
  fornecedor: string | null
  venda: string | null
  cliente: string | null
}

const LIMITE = 5000
const TIPOS = [
  { v: 'todos', t: 'Todos os tipos' },
  { v: 'E', t: 'E — Entrada de nota' },
  { v: 'S', t: 'S — Saída (venda)' },
  { v: 'D', t: 'D — Devolução' },
  { v: 'T', t: 'T — Transferência' },
  { v: 'I', t: 'I — Saldo inicial' },
]
const TIPO_COR: Record<string, string> = {
  E: 'bg-slate-100 text-slate-700',
  S: 'bg-red-50 text-red-700',
  D: 'bg-emerald-50 text-emerald-700',
  T: 'bg-blue-50 text-blue-700',
  I: 'bg-amber-50 text-amber-700',
}

const num = (v: number | null) =>
  v == null ? '' : v.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
const dia = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
const hoje = () => new Date().toLocaleDateString('sv-SE')

const SELECT_CLS =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring'

function baixarCsv(linhas: Movimento[], nome: string) {
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const n = (v: number | null) => (v == null ? '' : String(v).replace('.', ','))
  const cab = ['Data', 'Hora', 'Código', 'Peça', 'Histórico', 'Nota', 'Fornecedor', 'Venda', 'Cliente', 'Tipo',
    'Movimentação', 'Saldo do setor', 'Saldo geral', 'Setor', 'Usuário', 'Sistema']
  const corpo = linhas.map((m) =>
    [m.tipo === '' ? '' : dia(m.data), m.tipo === '' ? '' : hora(m.data), m.codigo_produto, m.produto, m.historico,
      m.nota, m.fornecedor, m.venda, m.cliente, m.tipo, n(m.quantidade), n(m.saldo_setor), n(m.saldo_geral),
      m.setor, m.usuario, m.sistema].map(esc).join(';'),
  )
  const blob = new Blob(['﻿' + [cab.join(';'), ...corpo].join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${nome}_${hoje()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function HistoricoPecas() {
  const [params] = useSearchParams()
  const codigoUrl = params.get('codigo') ?? ''
  const [codigo, setCodigo] = useState(codigoUrl)
  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState(hoje())
  const [setor, setSetor] = useState('todos')
  const [tipo, setTipo] = useState('todos')
  const [busca, setBusca] = useState('')
  const [maisRecentes, setMaisRecentes] = useState(false)
  const [linhas, setLinhas] = useState<Movimento[] | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const buscar = async (cod: string = codigo) => {
    setCarregando(true)
    setErro(null)
    const { data, error } = await (supabase.rpc as any)('relatorio_movimentacao_item', {
      p_codigo: cod.trim(),
      p_inicio: inicio || null,
      p_fim: fim || null,
      p_setor: setor === 'todos' ? null : setor,
    })
    setCarregando(false)
    if (error) {
      setLinhas(null)
      setErro(
        error.code === '42501'
          ? 'Somente a Administração vê o histórico de movimentação das peças.'
          : error.message || 'Não foi possível carregar o histórico.',
      )
      return
    }
    setLinhas(
      ((data as any[]) || []).map((r) => ({
        ...r,
        quantidade: r.quantidade == null ? null : Number(r.quantidade),
        saldo_setor: Number(r.saldo_setor),
        saldo_geral: Number(r.saldo_geral),
      })),
    )
  }

  // abre já buscando: pelo botão "Histórico da peça" (com ou sem peça selecionada)
  useEffect(() => {
    buscar(codigoUrl)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const umaPeca = !!codigo.trim()

  const visiveis = useMemo(() => {
    if (!linhas) return []
    const q = busca.trim().toLowerCase()
    let r = linhas.filter((m) => {
      if (tipo !== 'todos' && m.tipo !== tipo) return false
      if (!q) return true
      return [m.produto, String(m.codigo_produto), m.historico, m.nota, m.fornecedor, m.venda, m.cliente, m.usuario,
        m.setor, m.sistema].some((c) => (c ?? '').toLowerCase().includes(q))
    })
    if (maisRecentes) r = [...r].reverse()
    return r
  }, [linhas, tipo, busca, maisRecentes])

  const primeiro = linhas?.[0]
  const saldoFinal = linhas && linhas.length > 0 ? linhas[linhas.length - 1].saldo_geral : null
  const pecasDistintas = linhas ? new Set(linhas.map((m) => m.codigo_produto)).size : 0

  return (
    <div className="flex flex-col gap-4 w-full pb-20 lg:pb-0">
      <div>
        <Link to="/pecas" className="text-sm text-slate-500 hover:text-slate-800 inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Peças e Produtos
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mt-1">
          Histórico de movimentação
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Tudo o que mexeu no estoque, em ordem cronológica: entrada de nota (E), venda (S), devolução (D, soma no
          saldo) e transferência (T). Sem código, mostra todas as peças. Visível só para a Administração. O registro
          começa em 28/10/2026 (saldo inicial).
        </p>
      </div>

      <form
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:items-end rounded-lg border bg-white p-4"
        onSubmit={(e) => {
          e.preventDefault()
          buscar()
        }}
      >
        <div className="space-y-1.5">
          <Label>Código da peça</Label>
          <Input
            inputMode="numeric"
            placeholder="Vazio = todas"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>De</Label>
          <Input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Até</Label>
          <Input type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Setor</Label>
          <select className={SELECT_CLS} value={setor} onChange={(e) => setSetor(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="Estoque">Estoque Geral</option>
            <option value="Showroom">Showroom</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Tipo</Label>
          <select className={SELECT_CLS} value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {TIPOS.map((t) => (
              <option key={t.v} value={t.v}>
                {t.t}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={carregando}>
          {carregando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
          Buscar
        </Button>
      </form>

      {erro && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{erro}</div>
      )}

      {linhas && !erro && (
        <div className="rounded-lg border bg-white">
          <div className="flex flex-col gap-3 border-b p-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-slate-600">
              {linhas.length === 0 ? (
                'Nenhuma movimentação no período.'
              ) : umaPeca && primeiro ? (
                <>
                  <span className="font-semibold text-slate-900">
                    {primeiro.codigo_produto} — {primeiro.produto}
                  </span>
                  {' · '}saldo no fim do período{setor === 'todos' ? '' : ` (${setor === 'Estoque' ? 'Estoque Geral' : setor})`}:{' '}
                  <span className="font-semibold text-slate-900">{num(saldoFinal)}</span>
                </>
              ) : (
                <>
                  <span className="font-semibold text-slate-900">{visiveis.length.toLocaleString('pt-BR')}</span>{' '}
                  movimentos de {pecasDistintas.toLocaleString('pt-BR')} peças · o saldo de cada linha é o da própria
                  peça
                </>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                className="h-9 w-full md:w-64"
                placeholder="Filtrar por peça, nota, venda, cliente, pessoa…"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => setMaisRecentes((v) => !v)}>
                {maisRecentes ? 'Mais recentes primeiro' : 'Mais antigas primeiro'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={visiveis.length === 0}
                onClick={() => baixarCsv(visiveis, umaPeca ? `movimentacao-${codigo.trim()}` : 'movimentacao-todas-as-pecas')}
              >
                <Download className="mr-1.5 h-4 w-4" /> CSV
              </Button>
            </div>
          </div>

          {linhas.length > 0 && (
            <table className="w-full table-fixed text-[13px]">
              <colgroup>
                <col style={{ width: '7%' }} />
                <col style={{ width: '5%' }} />
                {!umaPeca && <col style={{ width: '15%' }} />}
                <col style={{ width: umaPeca ? '27%' : '17%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '4%' }} />
                <col style={{ width: '5%' }} />
                <col style={{ width: '6%' }} />
                <col style={{ width: '6%' }} />
                <col style={{ width: umaPeca ? '13%' : '10%' }} />
              </colgroup>
              <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-2 py-2">Data</th>
                  <th className="px-2 py-2">Cód.</th>
                  {!umaPeca && <th className="px-2 py-2">Peça</th>}
                  <th className="px-2 py-2">Histórico</th>
                  <th className="px-2 py-2">Nota / Fornecedor</th>
                  <th className="px-2 py-2">Venda / Cliente</th>
                  <th className="px-2 py-2">Tipo</th>
                  <th className="px-2 py-2 text-right">Mov.</th>
                  <th className="px-2 py-2 text-right">Saldo</th>
                  <th className="px-2 py-2">Setor</th>
                  <th className="px-2 py-2">Quem fez</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visiveis.slice(0, LIMITE).map((m) => (
                  <tr key={m.ordem} className="align-top hover:bg-slate-50/70">
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      {m.tipo === '' ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        <>
                          <div className="font-medium text-slate-800">{dia(m.data)}</div>
                          <div className="text-[11px] text-slate-500">{hora(m.data)}</div>
                        </>
                      )}
                    </td>
                    <td className="px-2 py-1.5 font-mono text-xs text-slate-900">{m.codigo_produto}</td>
                    {!umaPeca && <td className="px-2 py-1.5 break-words text-slate-800">{m.produto}</td>}
                    <td className="px-2 py-1.5 break-words text-slate-800">{m.historico}</td>
                    <td className="px-2 py-1.5 break-words">
                      {m.nota && <div className="font-medium text-slate-800">NF {m.nota}</div>}
                      {m.fornecedor && <div className="text-[12px] text-slate-500">{m.fornecedor}</div>}
                    </td>
                    <td className="px-2 py-1.5 break-words">
                      {m.venda && <div className="font-medium text-slate-800">{m.venda}</div>}
                      {m.cliente && <div className="text-[12px] text-slate-500">{m.cliente}</div>}
                    </td>
                    <td className="px-2 py-1.5">
                      {m.tipo && (
                        <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-semibold ${TIPO_COR[m.tipo] ?? ''}`}>
                          {m.tipo}
                        </span>
                      )}
                    </td>
                    <td className={`px-2 py-1.5 text-right tabular-nums ${(m.quantidade ?? 0) < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                      {num(m.quantidade)}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums font-medium text-slate-900">
                      {num(m.saldo_setor)}
                      {setor === 'todos' && umaPeca && (
                        <div className="text-[11px] font-normal text-slate-400">geral {num(m.saldo_geral)}</div>
                      )}
                    </td>
                    <td className="px-2 py-1.5 break-words text-slate-700">
                      {m.setor === 'Estoque' ? 'Estoque Geral' : m.setor}
                    </td>
                    <td className="px-2 py-1.5 break-words">
                      <div className="text-slate-800">{m.usuario ?? '—'}</div>
                      {m.sistema && <div className="text-[11px] text-slate-400">{m.sistema}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {visiveis.length > LIMITE && (
            <p className="border-t px-3 py-2 text-xs text-slate-500">
              Mostrando as primeiras {LIMITE.toLocaleString('pt-BR')} de {visiveis.length.toLocaleString('pt-BR')}{' '}
              linhas — use os filtros ou baixe o CSV para a lista completa.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
