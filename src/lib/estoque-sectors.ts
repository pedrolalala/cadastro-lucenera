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
