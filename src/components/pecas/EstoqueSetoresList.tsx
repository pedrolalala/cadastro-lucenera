import { cn } from '@/lib/utils'
import { isSetorForaDoGeral, type SetorQuantidadeRow } from '@/lib/estoque-sectors'

// SPEC-174 N6c (pedido do usuário, 02/10): estoque da peça na vertical, um
// setor por linha (nome + quantidade). Os 8 setores obrigatórios aparecem
// sempre, mesmo zerados; setores extras (ex.: Em trânsito, Defeito) só
// aparecem quando têm saldo, abaixo dos obrigatórios. Usado no painel da peça
// selecionada (PecaDetailsPanel) e no "Estoque Integrado" da edição (PecaForm).
export function EstoqueSetoresList({
  setores,
  compact = false,
}: {
  setores: SetorQuantidadeRow[]
  compact?: boolean
}) {
  return (
    <div className="border rounded-lg bg-slate-50 divide-y divide-slate-200 overflow-hidden">
      {setores.map((s) => {
        const foraDoGeral = isSetorForaDoGeral(s.local)
        return (
          <div
            key={s.local}
            className={cn(
              'flex items-center justify-between gap-2',
              compact ? 'px-2 py-1.5' : 'px-3 py-2',
              s.extra && 'bg-slate-100/60',
            )}
          >
            <span
              className={cn(
                'font-medium text-slate-700 flex items-center gap-1.5 min-w-0',
                compact ? 'text-xs' : 'text-sm',
              )}
            >
              <span className="truncate">{s.local}</span>
              {/* SPEC-174 N8: Casa Cor/Garantia ficam visíveis mas fora do
                  estoque geral/disponível do produto. */}
              {foraDoGeral && (
                <span className="shrink-0 text-[9px] font-semibold uppercase text-amber-700 bg-amber-50 border border-amber-200 rounded px-1 py-0.5">
                  fora do disponível
                </span>
              )}
            </span>
            <span
              className={cn(
                'shrink-0 font-semibold tabular-nums',
                compact ? 'text-xs' : 'text-sm',
                s.quantidade > 0
                  ? 'text-slate-900'
                  : s.quantidade < 0
                    ? 'text-destructive'
                    : 'text-slate-400',
              )}
            >
              {s.quantidade}
            </span>
          </div>
        )
      })}
    </div>
  )
}
