export const ESTOQUE_SETORES = [
  'Estoque Geral',
  'Showroom',
  'Estoque Luce Nera',
  'Estoque Islight',
  'Estoque Foco',
  'Estoque Garantia',
  'Estoque Casa Cor',
  'Reserva',
  'Separação',
  'Entrega Futura',
  'Devolução',
  'Estoque Defeito',
  'Amostra / Emprestado',
  'Estoque Citel',
] as const

export interface EstoqueSetorRow {
  local: string
  quantidade: number
  quantidade_reservada: number
}

// SPEC-174 N8: decisão da reunião de 01/10 ("Setor separado") -- Casa Cor e
// Garantia ficam visíveis na consulta de produto (lista vertical do N6b e
// tabela "Estoque por Local"), mas NÃO entram no estoque geral nem no
// disponível do produto. Continuam aparecendo normalmente em
// buildEstoquePorSetor (abaixo), que não filtra nada -- quem soma os totais
// (PecaDetailsPanel.tsx, services/produtos.ts) precisa excluir estes setores
// usando esta lista antes de somar.
export const ESTOQUE_SETORES_FORA_DO_GERAL = ['Estoque Garantia', 'Estoque Casa Cor'] as const

export function isSetorForaDoGeral(local: string): boolean {
  return (ESTOQUE_SETORES_FORA_DO_GERAL as readonly string[]).includes(local)
}

export function buildEstoquePorSetor(estoqueItens: any[]): EstoqueSetorRow[] {
  const sectorMap = new Map<string, EstoqueSetorRow>()

  for (const item of estoqueItens) {
    const local = item.local || 'Estoque'
    const existing = sectorMap.get(local)
    if (existing) {
      existing.quantidade += Number(item.quantidade) || 0
      existing.quantidade_reservada += Number(item.quantidade_reservada) || 0
    } else {
      sectorMap.set(local, {
        local,
        quantidade: Number(item.quantidade) || 0,
        quantidade_reservada: Number(item.quantidade_reservada) || 0,
      })
    }
  }

  return Array.from(sectorMap.values()).sort((a, b) => b.quantidade - a.quantidade)
}
