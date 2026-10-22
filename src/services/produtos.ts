import { supabase } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'

type Produto = Database['public']['Tables']['produtos']['Row']
type ProdutoInsert = Database['public']['Tables']['produtos']['Insert']
type ProdutoUpdate = Database['public']['Tables']['produtos']['Update']

// SPEC-193 C2 (decisão 09/10): custo e impostos da peça só para a Administração (Lana, Débora,
// Carol, Matheus, Vinícius + Pedro/Filippo). No banco, essas colunas de `produtos` ficam fechadas
// para leitura direta; o custo vem de `vw_produtos_custo`, que só devolve linhas para quem está em
// `produto_custo_visualizadores`. Por isso nada aqui pode ler `produtos` com '*'.
export const PRODUTO_COLUNAS = `
  id, marca_id, nome, preco_venda, ativo, created_at, updated_at, codigo_produto,
  referencia, estoque_total, estoque_showroom, estoque_disponivel, unidade, valor_venda,
  categoria_id, fornecedor_principal_id, descricao_tecnica, ncm, tipo_fiscal, cst, cest,
  status_comercial, mascara_produto, prazo_entrega_dias, multiplo_compra, estoque_minimo,
  imagem_showroom_url, grupo_fiscal_nao_contribuinte, grupo_fiscal_revenda, tem_st
`

// Campos que só a Administração lê e grava (mais preco_venda/valor_venda, que saem da conta do custo).
export const CAMPOS_CUSTO = [
  'preco_custo',
  'porc_desconto',
  'percentual_desconto_compra',
  'porc_frete',
  'porc_st',
  'ipi_entrada',
  'icms_entrada',
  'porc_despesas',
  'porc_bdi',
  'vl_custo_indireto',
  'custo_total',
  'margem_lucro',
  'percentual_lucro',
] as const

let podeVerCustoCache: Promise<boolean> | null = null
export function podeVerCustoProduto(): Promise<boolean> {
  if (!podeVerCustoCache) {
    podeVerCustoCache = Promise.resolve(
      (supabase as any).rpc('pode_ver_custo_produto'),
    ).then(({ data, error }: any) => {
      if (error) {
        podeVerCustoCache = null
        return false
      }
      return data === true
    })
  }
  return podeVerCustoCache
}

async function semCamposDeCusto<T extends Record<string, any>>(produto: T): Promise<T> {
  if (await podeVerCustoProduto()) return produto
  const limpo: Record<string, any> = { ...produto }
  for (const c of CAMPOS_CUSTO) delete limpo[c]
  delete limpo.preco_venda
  delete limpo.valor_venda
  return limpo as T
}

export async function getProdutos() {
  const { data, error } = await supabase
    .from('produtos')
    .select(`
      ${PRODUTO_COLUNAS},
      marca:marcas(nome),
      fornecedor:contatos!produtos_fornecedor_principal_id_fkey(nome),
      categoria_rel:categorias_produto(nome)
    `)
    .order('nome')
  if (error) throw error
  return data
}

export async function getProduto(id: string) {
  const { data, error } = await supabase.from('produtos').select(PRODUTO_COLUNAS).eq('id', id).single()
  if (error) throw error
  // SPEC-193 C2: custo/impostos à parte; quem não é da Administração recebe só os dados da peça.
  const { data: custo } = await (supabase as any)
    .from('vw_produtos_custo')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  return { ...(data as any), ...(custo || {}) }
}

// SPEC-193 B3: a Referência é o único código do fornecedor (sku/codigo_legado eram cópias e
// vão sair do banco). Não deixar duas peças com a mesma referência.
export async function checkReferenciaExists(referencia: string, excludeId?: string | null) {
  if (!referencia) return false
  let query = supabase.from('produtos').select('id').eq('referencia', referencia)
  if (excludeId) {
    query = query.neq('id', excludeId)
  }
  const { data, error } = await query
  if (error) throw error
  return data.length > 0
}

export async function checkCodigoExists(codigo: number, excludeId?: string | null) {
  let query = supabase.from('produtos').select('id').eq('codigo_produto', codigo)
  if (excludeId) {
    query = query.neq('id', excludeId)
  }
  const { data, error } = await query
  if (error) throw error
  return data.length > 0
}

export async function createProduto(produto: ProdutoInsert) {
  const { data, error } = await supabase
    .from('produtos')
    .insert([{ ...(await semCamposDeCusto(produto)), ativo: true }])
    .select(PRODUTO_COLUNAS)
    .single()
  if (error) throw error
  return data
}

export async function updateProduto(id: string, produto: ProdutoUpdate) {
  const { data, error } = await supabase
    .from('produtos')
    .update(await semCamposDeCusto(produto))
    .eq('id', id)
    .select(PRODUTO_COLUNAS)
    .single()
  if (error) throw error
  return data
}

export async function deleteProduto(id: string) {
  const { error } = await supabase.from('produtos').delete().eq('id', id)
  if (error) throw error
}

export async function getMarcas() {
  const { data, error } = await supabase
    .from('marcas')
    .select('id, nome')
    .eq('ativo', true)
    .order('nome')
  if (error) throw error
  return data
}

export async function getCategoriasProduto() {
  const { data, error } = await supabase
    .from('categorias_produto')
    .select('id, nome')
    .eq('ativo', true)
    .order('nome')
  if (error) throw error
  return data
}

export async function getFornecedores() {
  const { data, error } = await supabase
    .from('contatos')
    .select('id, nome, razao_social')
    .eq('tipo', 'fornecedor')
    .order('nome')
  if (error) throw error
  return data
}

// SPEC-053: criação rápida de marca a partir do botão "+" em PecaForm, sem
// sair do formulário de produto. `fornecedor_id` e `prazo_entrega_dias`
// existem em public.marcas (migrations 20260716_049 SPEC-030 e 20260715_041),
// mas ainda não aparecem em src/lib/supabase/types.ts (gerado antes dessas
// migrations) — por isso o cast `as any`, mesmo padrão já usado neste
// arquivo para views/RPCs fora dos tipos gerados (ver getReservasProduto).
export interface MarcaQuickCreatePayload {
  nome: string
  fornecedor_id?: string | null
  prazo_entrega_dias?: number | null
}

export async function createMarca(payload: MarcaQuickCreatePayload) {
  const { data, error } = await (supabase.from('marcas') as any)
    .insert([
      {
        nome: payload.nome.trim(),
        fornecedor_id: payload.fornecedor_id || null,
        prazo_entrega_dias: payload.prazo_entrega_dias ?? null,
        ativo: true,
      },
    ])
    .select('id, nome')
    .single()
  if (error) throw error
  return data as { id: string; nome: string }
}

// SPEC-053: criação rápida de fornecedor (contatos.tipo = 'fornecedor') a
// partir do botão "+" em PecaForm, sem sair do formulário de produto.
export interface FornecedorQuickCreatePayload {
  nome: string
  cnpj?: string | null
  razao_social?: string | null
}

export async function createFornecedor(payload: FornecedorQuickCreatePayload) {
  const { data, error } = await supabase
    .from('contatos')
    .insert([
      {
        tipo: 'fornecedor',
        nome: payload.nome.trim(),
        cnpj: payload.cnpj?.trim() || null,
        razao_social: payload.razao_social?.trim() || null,
        ativo: true,
      },
    ])
    .select('id, nome, razao_social')
    .single()
  if (error) throw error
  return data
}

export async function getEstoqueItens(produtoId: string) {
  const { data, error } = await supabase
    .from('estoque_itens')
    .select('*')
    .eq('produto_id', produtoId)
  if (error) throw error
  return data
}

// SPEC-049: "Reservado por Cliente/Projeto" no card lateral de peça.
// Lê a view vw_cadastro_produto_reserva_detalhe (migration
// 20260727_063_spec049_cadastro_reserva_detalhe), que reaproveita
// vw_estoque_por_produto_projeto (SPEC-010) — uma linha por
// (produto_id, projeto_item_id) com reserva ativa. A view ainda não está
// nos tipos gerados de src/lib/supabase/types.ts (só existe a partir da
// migration desta SPEC), por isso o cast `as any` no `.from(...)`, mesmo
// padrão já usado neste arquivo para `get_next_sku`.
export interface ReservaProdutoRow {
  projeto_item_id: string
  projeto_id: string | null
  projeto_codigo: string | null
  orcamento_id: string | null
  orcamento_numero: string | null
  produto_id: string
  produto_codigo: string | null
  cliente_id: string | null
  cliente_nome: string | null
  equipe_id: string | null
  equipe_nome: string | null
  q_venda: number
  q_reserva: number
  q_entrega_futura: number
  status_operacional: string | null
}

export async function getReservasProduto(produtoId: string): Promise<ReservaProdutoRow[]> {
  const { data, error } = await (supabase.from as any)('vw_cadastro_produto_reserva_detalhe')
    .select('*')
    .eq('produto_id', produtoId)
  if (error) throw error
  return (data || []) as ReservaProdutoRow[]
}

// SPEC-174 N6c: Reserva, Separação e Entrega Futura somadas por peça
// (migration 20261002_174f_vw_cadastro_produto_setores). Sem linha = zeros.
export async function getSetoresProduto(
  produtoId: string,
): Promise<{ q_reserva: number; q_separacao: number; q_entrega_futura: number }> {
  const { data, error } = await (supabase.from as any)('vw_cadastro_produto_setores')
    .select('q_reserva, q_separacao, q_entrega_futura')
    .eq('produto_id', produtoId)
    .maybeSingle()
  if (error) throw error
  return {
    q_reserva: Number(data?.q_reserva) || 0,
    q_separacao: Number(data?.q_separacao) || 0,
    q_entrega_futura: Number(data?.q_entrega_futura) || 0,
  }
}

// SPEC-182 (C2): uma linha por item de venda com a quantidade da peça em cada
// setor e os dados da venda (vw_cadastro_produto_movimentos, migration
// 20261006_185) — alimenta as abas Reserva / Entrega Futura / Separação /
// Entregue da consulta de peça.
export interface MovimentoProdutoRow {
  produto_id: string
  projeto_item_id: string
  orcamento_id: string | null
  orcamento_numero: string | null
  venda_numero: string | null
  funcionario_nome: string | null
  cliente_nome: string | null
  projeto_codigo: string | null
  l_fixo: string | null
  data_orcamento: string | null
  // SPEC-191 B3: data da VENDA (aprovação financeira), não a do orçamento.
  data_venda: string | null
  data_entrega: string | null
  valor_total_orcamento: number | null
  q_reserva: number
  q_entrega_futura: number
  q_separacao: number
  q_entregue: number
  q_devolvida_entregue: number
}

export async function getMovimentosProduto(produtoId: string): Promise<MovimentoProdutoRow[]> {
  const { data, error } = await (supabase.from as any)('vw_cadastro_produto_movimentos')
    .select('*')
    .eq('produto_id', produtoId)
    .order('data_venda', { ascending: false, nullsFirst: false })
  if (error) throw error
  return ((data || []) as any[]).map((r) => ({
    ...r,
    valor_total_orcamento: r.valor_total_orcamento == null ? null : Number(r.valor_total_orcamento),
    q_reserva: Number(r.q_reserva) || 0,
    q_entrega_futura: Number(r.q_entrega_futura) || 0,
    q_separacao: Number(r.q_separacao) || 0,
    q_entregue: Number(r.q_entregue) || 0,
    q_devolvida_entregue: Number(r.q_devolvida_entregue) || 0,
  }))
}

// SPEC-049: "Pedido de Compra em Trânsito" no card lateral de peça.
// Lê vw_necessidade_compra_pedido_detalhe (SPEC-039, já em produção, já com
// GRANT SELECT authenticated) — não cria view nova para esta parte. Compra
// não tem dono fixo (RN-03 SPEC-012/022): é agregada por produto, não por
// reserva/cliente específico.
export interface PedidoCompraEmTransitoRow {
  produto_id: string
  pedido_id: string
  numero: string | null
  status: string
  empresa_nome: string | null
  data_prevista_entrega: string | null
  qtd_pendente: number
  // SPEC-182 (C2): aba Compras no modelo do Connect.
  data_emissao: string | null
  perfil: string | null
}

export async function getPedidosCompraEmTransito(
  produtoId: string,
): Promise<PedidoCompraEmTransitoRow[]> {
  const { data, error } = await (supabase.from as any)('vw_necessidade_compra_pedido_detalhe')
    .select('*')
    .eq('produto_id', produtoId)
  if (error) throw error
  // SPEC-222 H1: a view traz uma linha por item do pedido (um por L) — aqui é uma linha por pedido,
  // com a quantidade somada (nº do pedido, quantidade, emissão e previsão; sem cliente).
  const porPedido = new Map<string, PedidoCompraEmTransitoRow>()
  for (const r of (data || []) as PedidoCompraEmTransitoRow[]) {
    const atual = porPedido.get(r.pedido_id)
    if (atual) atual.qtd_pendente = Number(atual.qtd_pendente) + Number(r.qtd_pendente)
    else porPedido.set(r.pedido_id, { ...r, qtd_pendente: Number(r.qtd_pendente) })
  }
  return Array.from(porPedido.values())
}

// SPEC-049 (seção adicional "Fornecedor Sugerido"): sugestão de compra por
// produto, lendo vw_necessidade_compra (já em produção, já com GRANT SELECT
// authenticated) — não é um pedido em trânsito, é COALESCE(produtos.fornecedor_
// principal_id, marcas.fornecedor_id). Independente de getPedidosCompraEmTransito.
export interface FornecedorSugeridoProdutoRow {
  fornecedor_nome: string | null
  pendente: number | null
  qtd_pedidos_abertos: number | null
  qtd_em_pedidos_abertos: number | null
  proxima_data_prevista_entrega: string | null
  status_mais_critico: string | null
}

export async function getFornecedorSugeridoProduto(
  produtoId: string,
): Promise<FornecedorSugeridoProdutoRow | null> {
  const { data, error } = await (supabase.from as any)('vw_necessidade_compra')
    .select(
      'fornecedor_nome, pendente, qtd_pedidos_abertos, qtd_em_pedidos_abertos, proxima_data_prevista_entrega, status_mais_critico',
    )
    .eq('produto_id', produtoId)
    .maybeSingle()
  if (error) throw error
  return data as FornecedorSugeridoProdutoRow | null
}

export async function getAllProdutosBatched(
  batchSize = 500,
  onProgress?: (loaded: number, total: number | null) => void,
) {
  const { count } = await supabase.from('produtos').select('id', { count: 'exact', head: true })

  let allData: any[] = []
  let offset = 0
  let hasMore = true

  while (hasMore) {
    const { data, error } = await supabase
      .from('produtos')
      .select(`
        ${PRODUTO_COLUNAS},
        marca:marcas(nome),
        fornecedor:contatos!produtos_fornecedor_principal_id_fkey(nome),
        categoria_rel:categorias_produto(nome)
      `)
      .order('nome')
      .range(offset, offset + batchSize - 1)

    if (error) throw error
    if (!data || data.length === 0) {
      hasMore = false
    } else {
      allData = [...allData, ...data]
      onProgress?.(allData.length, count ?? null)
      if (data.length < batchSize) {
        hasMore = false
      } else {
        offset += batchSize
      }
    }
  }

  return allData
}

export async function getProdutosFiltradosBatched(
  params: {
    searchTerm?: string
    marcaId?: string
    categoriaId?: string
    ativoFilter?: boolean
  },
  batchSize = 500,
  onProgress?: (loaded: number, total: number | null) => void,
) {
  const applyFilters = (query: any) => {
    let q = query
    if (params.marcaId) q = q.eq('marca_id', params.marcaId)
    if (params.categoriaId) q = q.eq('categoria_id', params.categoriaId)
    if (params.ativoFilter !== undefined) q = q.eq('ativo', params.ativoFilter)
    if (params.searchTerm) {
      const term = params.searchTerm
      const numeric = term.replace(/[^0-9]/g, '')
      if (numeric) {
        q = q.or(
          `nome.ilike.%${term}%,referencia.ilike.%${term}%,codigo_produto.eq.${numeric}`,
        )
      } else {
        q = q.or(`nome.ilike.%${term}%,referencia.ilike.%${term}%`)
      }
    }
    return q
  }

  const countQuery = applyFilters(
    supabase.from('produtos').select('id', { count: 'exact', head: true }),
  )
  const { count } = await countQuery

  let allData: any[] = []
  let offset = 0
  let hasMore = true

  while (hasMore) {
    let query = supabase
      .from('produtos')
      .select(`
        ${PRODUTO_COLUNAS},
        marca:marcas(nome),
        fornecedor:contatos!produtos_fornecedor_principal_id_fkey(nome),
        categoria_rel:categorias_produto(nome)
      `)
      .order('nome')
      .range(offset, offset + batchSize - 1)

    query = applyFilters(query)

    const { data, error } = await query
    if (error) throw error
    if (!data || data.length === 0) {
      hasMore = false
    } else {
      allData = [...allData, ...data]
      onProgress?.(allData.length, count ?? null)
      if (data.length < batchSize) {
        hasMore = false
      } else {
        offset += batchSize
      }
    }
  }

  return allData
}

export async function getProdutoEstoqueDetalhado(produtoId: string) {
  const { data, error } = await supabase
    .from('vw_produtos_estoque_detalhado')
    .select('*')
    .eq('id', produtoId)
    .single()
  if (error) throw error
  return data
}

export interface ProdutoEstoqueRow {
  id: string
  nome: string
  codigo_produto: number | null
  referencia: string | null
  categoria: string | null
  valor_venda: number | null
  preco_venda: number | null
  marca_nome: string | null
  estoque_total: number
  estoque_reservado: number
  estoque_disponivel: number
  has_estoque: boolean
  // SPEC-195 B1: alguma quantidade diferente de zero (positiva ou negativa) em
  // qualquer setor, no Disponível ou no Showroom — base do filtro "Só com estoque".
  tem_saldo: boolean
  // SPEC-195 B1: peça desativada também aparece na lista, marcada.
  ativo: boolean
  // SPEC-151: quantidade real do Showroom, lida direto de produtos.estoque_showroom.
  // NÃO usar estoque_itens(local='Showroom') para isso — o trigger
  // fn_sync_estoque_itens_from_produtos zera essa linha a cada update de produtos.
  estoque_showroom: number
}

// SPEC-193 C1/C3/C4: a Consulta lê a view enxuta `vw_consulta_estoque` (migration 204), que já devolve
// os saldos calculados no banco com a mesma conta de calcularDisponivel (SPEC-191 B1): Geral − maior
// (reserva + separação do sistema, reserva da Connect). Antes a tela trazia a tabela `produtos` inteira
// em lotes de 500 com estoque_itens embutido e fazia a conta aqui (≈6 s); agora ≈1,5 s com o filtro
// "Só com estoque" aplicado no banco.
const CONSULTA_COLUNAS = `
  produto_id, codigo_produto, referencia, nome, ativo, preco_venda, valor_venda, marca_nome,
  categoria_nome, estoque_total, estoque_reservado, estoque_disponivel, estoque_showroom,
  has_estoque, tem_saldo
`

function linhaConsulta(r: any): ProdutoEstoqueRow {
  return {
    id: r.produto_id,
    nome: r.nome,
    codigo_produto: r.codigo_produto,
    referencia: r.referencia,
    categoria: r.categoria_nome || null,
    valor_venda: r.valor_venda,
    preco_venda: r.preco_venda,
    marca_nome: r.marca_nome || null,
    estoque_total: Number(r.estoque_total) || 0,
    estoque_reservado: Number(r.estoque_reservado) || 0,
    estoque_disponivel: Number(r.estoque_disponivel) || 0,
    has_estoque: r.has_estoque === true,
    estoque_showroom: Number(r.estoque_showroom) || 0,
    tem_saldo: r.tem_saldo === true,
    ativo: r.ativo !== false,
  }
}

export async function getProdutosEstoqueFiltradoBatched(
  params: {
    searchTerm?: string
    marcaId?: string
    categoriaId?: string
    // SPEC-195 B1: "Só com estoque" — sem busca, filtra no banco.
    soComSaldo?: boolean
  },
  batchSize = 1000,
  onProgress?: (loaded: number, total: number | null) => void,
): Promise<ProdutoEstoqueRow[]> {
  const consulta = () => (supabase.from as any)('vw_consulta_estoque').select(CONSULTA_COLUNAS)
  // SPEC-195 B1 (decisão 11/10): as desativadas também entram, marcadas na tela.
  const applyCommonFilters = (query: any) => {
    let q = query
    if (params.marcaId) q = q.eq('marca_id', params.marcaId)
    if (params.categoriaId) q = q.eq('categoria_id', params.categoriaId)
    return q
  }

  let products: any[] = []

  if (params.searchTerm) {
    // SPEC-116 (piloto 1): busca universal via RPC buscar_produtos_fuzzy
    // (SPEC-100, estendida) — um termo (ou vários, em qualquer ordem) casa
    // contra nome/referencia/codigo_produto/descricao_tecnica/marca/
    // categoria, tolerando acento e erro de digitação. A RPC resolve QUAIS
    // produtos casam; os saldos vêm da vw_consulta_estoque só para esses ids.
    const { data: matches, error: matchError } = await (supabase.rpc as any)(
      'buscar_produtos_fuzzy',
      {
        p_termo: params.searchTerm,
        p_marca_id: params.marcaId || null,
        p_categoria_id: params.categoriaId || null,
        p_offset: 0,
        p_limit: 500,
      },
    )
    if (matchError) throw matchError
    const ids = (matches || []).map((m: any) => m.id)

    // Bug achado ao testar ao vivo (SPEC-116): mandar centenas de ids de uma
    // vez via `.in()` estourava o limite de tamanho de URL — lotes pequenos.
    const ID_CHUNK_SIZE = 150
    for (let i = 0; i < ids.length; i += ID_CHUNK_SIZE) {
      const chunk = ids.slice(i, i + ID_CHUNK_SIZE)
      const { data, error } = await applyCommonFilters(consulta().in('produto_id', chunk))
      if (error) throw error
      products = products.concat(data || [])
      onProgress?.(products.length, ids.length)
    }

    // SPEC-195 B1: buscar_produtos_fuzzy só devolve peças ativas (e é usada
    // também no Orçamento, então não muda); as desativadas entram por uma
    // busca simples de código/referência/descrição, para aparecer marcadas.
    const termo = params.searchTerm.trim().replace(/[%,()]/g, ' ')
    if (termo) {
      const filtros = [`nome.ilike.%${termo}%`, `referencia.ilike.%${termo}%`]
      if (/^\d+$/.test(termo)) filtros.push(`codigo_produto.eq.${termo}`)
      const { data: inativas, error: inativasError } = await applyCommonFilters(
        consulta().eq('ativo', false).or(filtros.join(',')).limit(200),
      )
      if (inativasError) throw inativasError
      const jaTem = new Set(products.map((p: any) => p.produto_id))
      products = products.concat((inativas || []).filter((p: any) => !jaTem.has(p.produto_id)))
    }
  } else {
    let countQuery = (supabase.from as any)('vw_consulta_estoque').select('produto_id', {
      count: 'exact',
      head: true,
    })
    countQuery = applyCommonFilters(countQuery)
    if (params.soComSaldo) countQuery = countQuery.eq('tem_saldo', true)
    const { count } = await countQuery

    for (let offset = 0; ; offset += batchSize) {
      let query = applyCommonFilters(consulta())
      if (params.soComSaldo) query = query.eq('tem_saldo', true)
      const { data, error } = await query
        .order('nome')
        .order('produto_id')
        .range(offset, offset + batchSize - 1)
      if (error) throw error
      products = products.concat(data || [])
      onProgress?.(products.length, count ?? null)
      if (!data || data.length < batchSize) break
    }
  }

  const rows: ProdutoEstoqueRow[] = products.map(linhaConsulta)

  rows.sort((a, b) => {
    // SPEC-195 B1: desativadas sempre no fim da lista.
    if (a.ativo !== b.ativo) return a.ativo ? -1 : 1
    const aHasStock = a.estoque_disponivel > 0 ? 1 : 0
    const bHasStock = b.estoque_disponivel > 0 ? 1 : 0
    if (aHasStock !== bHasStock) return bHasStock - aHasStock
    return a.nome.localeCompare(b.nome)
  })

  return rows
}
