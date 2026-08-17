import { supabase } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'

type Produto = Database['public']['Tables']['produtos']['Row']
type ProdutoInsert = Database['public']['Tables']['produtos']['Insert']
type ProdutoUpdate = Database['public']['Tables']['produtos']['Update']

export async function getProdutos() {
  const { data, error } = await supabase
    .from('produtos')
    .select(`
      *,
      marca:marcas(nome),
      fornecedor:contatos!produtos_fornecedor_principal_id_fkey(nome),
      categoria_rel:categorias_produto(nome)
    `)
    .order('nome')
  if (error) throw error
  return data
}

export async function getProduto(id: string) {
  const { data, error } = await supabase.from('produtos').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function checkSkuExists(sku: string, excludeId?: string | null) {
  if (!sku) return false
  let query = supabase.from('produtos').select('id').eq('sku', sku)
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
    .insert([{ ...produto, ativo: true }])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateProduto(id: string, produto: ProdutoUpdate) {
  const { data, error } = await supabase
    .from('produtos')
    .update(produto)
    .eq('id', id)
    .select()
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
}

export async function getPedidosCompraEmTransito(
  produtoId: string,
): Promise<PedidoCompraEmTransitoRow[]> {
  const { data, error } = await (supabase.from as any)('vw_necessidade_compra_pedido_detalhe')
    .select('*')
    .eq('produto_id', produtoId)
  if (error) throw error
  return (data || []) as PedidoCompraEmTransitoRow[]
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

export async function getNextSku(prefix: string = 'teste') {
  try {
    const { data, error } = await (supabase.rpc as any)('get_next_sku', { prefix })
    if (!error && data) {
      return data as string
    }
  } catch (err) {
    console.warn('RPC get_next_sku failed, using JS fallback', err)
  }

  const { data: fallbackData, error: fallbackError } = await supabase
    .from('produtos')
    .select('sku')
    .like('sku', `${prefix}%`)

  if (fallbackError) throw fallbackError

  let maxNum = 0
  for (const row of fallbackData || []) {
    if (!row.sku) continue
    const numStr = row.sku.substring(prefix.length).replace(/[^0-9]/g, '')
    if (numStr) {
      const num = parseInt(numStr, 10)
      if (!isNaN(num) && num > maxNum) {
        maxNum = num
      }
    }
  }

  return `${prefix}${(maxNum + 1).toString().padStart(2, '0')}`
}

export async function getAllProdutosBatched(
  batchSize = 500,
  onProgress?: (loaded: number, total: number | null) => void,
) {
  const { count } = await supabase.from('produtos').select('*', { count: 'exact', head: true })

  let allData: any[] = []
  let offset = 0
  let hasMore = true

  while (hasMore) {
    const { data, error } = await supabase
      .from('produtos')
      .select(`
        *,
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
          `nome.ilike.%${term}%,sku.ilike.%${term}%,referencia.ilike.%${term}%,codigo_produto.eq.${numeric}`,
        )
      } else {
        q = q.or(`nome.ilike.%${term}%,sku.ilike.%${term}%,referencia.ilike.%${term}%`)
      }
    }
    return q
  }

  const countQuery = applyFilters(
    supabase.from('produtos').select('*', { count: 'exact', head: true }),
  )
  const { count } = await countQuery

  let allData: any[] = []
  let offset = 0
  let hasMore = true

  while (hasMore) {
    let query = supabase
      .from('produtos')
      .select(`
        *,
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
  sku: string | null
  codigo_produto: number | null
  codigo_legado: number | null
  referencia: string | null
  categoria: string | null
  valor_venda: number | null
  preco_venda: number | null
  marca_nome: string | null
  estoque_total: number
  estoque_reservado: number
  estoque_disponivel: number
  has_estoque: boolean
}

export async function getProdutosEstoqueFiltradoBatched(
  params: {
    searchTerm?: string
    marcaId?: string
    categoriaId?: string
  },
  batchSize = 500,
  onProgress?: (loaded: number, total: number | null) => void,
): Promise<ProdutoEstoqueRow[]> {
  const applyCommonFilters = (query: any) => {
    let q = query.eq('ativo', true)
    if (params.marcaId) q = q.eq('marca_id', params.marcaId)
    if (params.categoriaId) q = q.eq('categoria_id', params.categoriaId)
    return q
  }

  const selectFields = `
    id, nome, sku, codigo_produto, codigo_legado, referencia, categoria, descricao_tecnica,
    preco_venda, valor_venda, ativo,
    marca:marcas(nome),
    categoria_rel:categorias_produto(nome),
    estoque:estoque_itens(id, local, quantidade, quantidade_reservada)
  `

  const fetchBatched = async (extraFilterFn?: (q: any) => any): Promise<any[]> => {
    let countQuery = supabase.from('produtos').select('*', { count: 'exact', head: true })
    countQuery = applyCommonFilters(countQuery)
    if (extraFilterFn) countQuery = extraFilterFn(countQuery)
    const { count } = await countQuery

    let allProducts: any[] = []
    let offset = 0
    let hasMore = true

    while (hasMore) {
      let query = supabase
        .from('produtos')
        .select(selectFields)
        .order('nome')
        .range(offset, offset + batchSize - 1)
      query = applyCommonFilters(query)
      if (extraFilterFn) query = extraFilterFn(query)

      const { data, error } = await query
      if (error) throw error
      if (!data || data.length === 0) {
        hasMore = false
      } else {
        allProducts = [...allProducts, ...data]
        onProgress?.(allProducts.length, count ?? null)
        if (data.length < batchSize) {
          hasMore = false
        } else {
          offset += batchSize
        }
      }
    }

    return allProducts
  }

  let products: any[] = []

  if (params.searchTerm) {
    // SPEC-116 (piloto 1): busca universal via RPC buscar_produtos_fuzzy
    // (SPEC-100, estendida) — um termo (ou vários, em qualquer ordem) casa
    // contra nome/sku/referencia/codigo_produto/descricao_tecnica/marca/
    // categoria, tolerando acento e erro de digitação. A RPC resolve QUAIS
    // produtos casam; a busca em lote abaixo continua trazendo os campos de
    // estoque (que a RPC não retorna) só para esses ids.
    const { data: matches, error: matchError } = await (supabase.rpc as any)(
      'buscar_produtos_fuzzy',
      {
        p_termo: params.searchTerm,
        p_marca_id: params.marcaId || null,
        p_categoria_id: params.categoriaId || null,
        p_offset: 0,
        p_limit: 2000,
      },
    )
    if (matchError) throw matchError
    const ids = (matches || []).map((m: any) => m.id)

    products = ids.length === 0 ? [] : await fetchBatched((q: any) => q.in('id', ids))
  } else {
    products = await fetchBatched()
  }

  const rows: ProdutoEstoqueRow[] = products.map((p) => {
    const marcaNome = p.marca?.nome || null
    const categoriaNome = p.categoria_rel?.nome || p.categoria || null
    const estoqueItems = Array.isArray(p.estoque) ? p.estoque : []

    const totalQuantidade = estoqueItems.reduce(
      (sum: number, ei: any) => sum + (Number(ei.quantidade) || 0),
      0,
    )
    const totalReservada = estoqueItems.reduce(
      (sum: number, ei: any) => sum + (Number(ei.quantidade_reservada) || 0),
      0,
    )
    const disponivel = totalQuantidade - totalReservada

    return {
      id: p.id,
      nome: p.nome,
      sku: p.sku,
      codigo_produto: p.codigo_produto,
      codigo_legado: p.codigo_legado,
      referencia: p.referencia,
      categoria: categoriaNome,
      valor_venda: p.valor_venda,
      preco_venda: p.preco_venda,
      marca_nome: marcaNome,
      estoque_total: totalQuantidade,
      estoque_reservado: totalReservada,
      estoque_disponivel: disponivel,
      has_estoque: estoqueItems.length > 0,
    }
  })

  rows.sort((a, b) => {
    const aHasStock = a.estoque_disponivel > 0 ? 1 : 0
    const bHasStock = b.estoque_disponivel > 0 ? 1 : 0
    if (aHasStock !== bHasStock) return bHasStock - aHasStock
    return a.nome.localeCompare(b.nome)
  })

  return rows
}
