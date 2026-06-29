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
  return ESTOQUE_SETORES.map((setor) => {
    const record = estoqueItens.find((i) => i.local === setor)
    return {
      local: setor,
      quantidade: Number(record?.quantidade) || 0,
      quantidade_reservada: Number(record?.quantidade_reservada) || 0,
    }
  })
}
