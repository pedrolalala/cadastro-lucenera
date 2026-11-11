// SPEC-282: histórico de alterações de preço/custo/ST de uma peça (quem, quando, de quanto, por qual
// caminho: edição manual, reajuste em lote, importação). Só aparece para quem pode ver custo.
import { useEffect, useState } from 'react'
import { History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase/client'

interface Registro {
  id: number
  criado_em: string
  usuario_nome: string | null
  origem: string
  campos: Record<string, [number | null, number | null]>
}

const ROTULOS: Record<string, { t: string; tipo: 'pct' | 'brl' }> = {
  preco_venda: { t: 'Preço de venda', tipo: 'brl' },
  valor_venda: { t: 'Valor de venda (Connect)', tipo: 'brl' },
  custo_total: { t: 'Custo total', tipo: 'brl' },
  preco_custo: { t: 'Preço de custo', tipo: 'brl' },
  porc_bdi: { t: 'BDI (R$)', tipo: 'brl' },
  porc_st: { t: '% ST', tipo: 'pct' },
  ipi_entrada: { t: '% IPI', tipo: 'pct' },
  porc_frete: { t: '% Frete', tipo: 'pct' },
  porc_despesas: { t: '% Outras despesas', tipo: 'pct' },
  porc_desconto: { t: '% Desconto do fornecedor', tipo: 'pct' },
  margem_lucro: { t: '% Lucro', tipo: 'pct' },
}
const ORDEM = Object.keys(ROTULOS)
const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function fmt(v: number | null, tipo: 'pct' | 'brl') {
  if (v === null || v === undefined) return '—'
  const n = Number(v)
  return tipo === 'brl' ? BRL.format(n) : `${n.toLocaleString('pt-BR', { maximumFractionDigits: 4 })}%`
}

export function HistoricoPrecoDialog({ produtoId }: { produtoId: string }) {
  const [open, setOpen] = useState(false)
  const [lista, setLista] = useState<Registro[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setLista(null)
    setErro(null)
    ;(async () => {
      const { data, error } = await (supabase.from as any)('produto_preco_historico')
        .select('id, criado_em, usuario_nome, origem, campos')
        .eq('produto_id', produtoId)
        .order('criado_em', { ascending: false })
        .limit(50)
      if (error) setErro(error.message)
      else setLista((data as Registro[]) || [])
    })()
  }, [open, produtoId])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-1">
          <History className="w-3.5 h-3.5" />
          Histórico de preço
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico de preço da peça</DialogTitle>
          <DialogDescription>
            Cada linha é uma alteração de custo, imposto ou preço: quem fez, quando e por qual caminho.
          </DialogDescription>
        </DialogHeader>

        {erro && <p className="text-sm text-red-600">Não foi possível carregar: {erro}</p>}
        {!erro && lista === null && <p className="text-sm text-slate-500">Carregando…</p>}
        {lista && lista.length === 0 && (
          <p className="text-sm text-slate-500">
            Nenhuma alteração registrada ainda. O histórico começou em 11/11/2026.
          </p>
        )}
        <div className="space-y-3">
          {lista?.map((r) => (
            <div key={r.id} className="rounded-md border p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{new Date(r.criado_em).toLocaleString('pt-BR')}</span>
                <span className="text-xs text-slate-500">
                  {r.usuario_nome || '—'} · {r.origem}
                </span>
              </div>
              <ul className="mt-2 space-y-0.5">
                {ORDEM.filter((k) => r.campos[k]).map((k) => {
                  const [antes, depois] = r.campos[k]
                  const { t, tipo } = ROTULOS[k]
                  return (
                    <li key={k} className="flex justify-between gap-3">
                      <span className="text-slate-600">{t}</span>
                      <span className="whitespace-nowrap">
                        {fmt(antes, tipo)} → <b>{fmt(depois, tipo)}</b>
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
