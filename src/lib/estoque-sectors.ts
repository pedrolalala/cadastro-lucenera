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

// SPEC-174 N6c (pedido do usuário, 02/10): setores que aparecem SEMPRE na
// peça selecionada, nesta ordem, mesmo zerados.
export const SETORES_OBRIGATORIOS = [
  'Estoque Geral',
  'Showroom',
  'Estoque Garantia',
  'Estoque Casa Cor',
  'Reserva',
  'Separação',
  'Entrega Futura',
  'Amostra / Emprestado',
] as const

// Saldos por projeto somados por peça (vw_cadastro_produto_setores):
// Reserva, Separação (a separar + separado) e Entrega Futura não ficam em
// estoque_itens.
export interface SetoresSaldosProjeto {
  q_reserva: number
  q_separacao: number
  q_entrega_futura: number
}

export interface SetorQuantidadeRow {
  local: string
  quantidade: number
  // true para setores fora da lista obrigatória (só aparecem se tiverem saldo)
  extra: boolean
}

// Locais de estoque_itens que contam como "Estoque Geral" ('Estoque' é o
// valor que as RPCs de aprovação/reserva usam hoje).
const LOCAIS_ESTOQUE_GERAL = ['Estoque', 'Estoque Geral']

export function buildSetoresObrigatorios(
  estoqueItens: any[],
  estoqueShowroom: number,
  saldos: SetoresSaldosProjeto | null,
): SetorQuantidadeRow[] {
  const porLocal = new Map<string, number>()
  for (const item of estoqueItens) {
    const local = item.local || 'Estoque'
    porLocal.set(local, (porLocal.get(local) || 0) + (Number(item.quantidade) || 0))
  }
  const doLocal = (local: string) => porLocal.get(local) || 0

  const valores: Record<(typeof SETORES_OBRIGATORIOS)[number], number> = {
    'Estoque Geral': LOCAIS_ESTOQUE_GERAL.reduce((s, l) => s + doLocal(l), 0),
    // SPEC-151: a fonte do Showroom é produtos.estoque_showroom, não estoque_itens.
    Showroom: Number(estoqueShowroom) || 0,
    'Estoque Garantia': doLocal('Estoque Garantia'),
    'Estoque Casa Cor': doLocal('Estoque Casa Cor'),
    // Hoje esses três locais não são usados em estoque_itens (o saldo vive
    // nos saldos por projeto); somados por segurança caso passem a ser.
    Reserva: (Number(saldos?.q_reserva) || 0) + doLocal('Reserva'),
    Separação: (Number(saldos?.q_separacao) || 0) + doLocal('Separação'),
    'Entrega Futura': (Number(saldos?.q_entrega_futura) || 0) + doLocal('Entrega Futura'),
    'Amostra / Emprestado': doLocal('Amostra / Emprestado'),
  }

  const tratados = new Set<string>([...SETORES_OBRIGATORIOS, ...LOCAIS_ESTOQUE_GERAL, 'Showroom'])
  const extras: SetorQuantidadeRow[] = Array.from(porLocal.entries())
    .filter(([local, qtd]) => !tratados.has(local) && qtd !== 0)
    .map(([local, quantidade]) => ({ local, quantidade, extra: true }))
    .sort((a, b) => b.quantidade - a.quantidade)

  return [
    ...SETORES_OBRIGATORIOS.map((local) => ({ local, quantidade: valores[local], extra: false })),
    ...extras,
  ]
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
