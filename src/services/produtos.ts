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

export async function getEstoqueItens(produtoId: string) {
  const { data, error } = await supabase
    .from('estoque_itens')
    .select('*')
    .eq('produto_id', produtoId)
  if (error) throw error
  return data
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

  // Fallback JS logic
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
  referencia: string | null
  categoria: string | null
  preco_venda: number | null
  valor_venda: number | null
  marca_nome: string | null
  estoque_local: string | null
  estoque_quantidade: number | null
  estoque_reservada: number | null
  estoque_disponivel: number | null
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
    id, nome, sku, codigo_produto, referencia, categoria, descricao_tecnica,
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
    const term = params.searchTerm.trim().replace(/[,()]/g, '')
    const numeric = term.replace(/[^0-9]/g, '')

    const exactFn = (q: any) => {
      if (numeric) {
        return q.or(`sku.eq.${term},referencia.eq.${term},codigo_produto.eq.${numeric}`)
      }
      return q.or(`sku.eq.${term},referencia.eq.${term}`)
    }
    products = await fetchBatched(exactFn)

    if (products.length === 0) {
      const partialFn = (q: any) => {
        return q.or(`nome.ilike.%${term}%,descricao_tecnica.ilike.%${term}%`)
      }
      products = await fetchBatched(partialFn)
    }
  } else {
    products = await fetchBatched()
  }

  const rows: ProdutoEstoqueRow[] = []
  for (const p of products) {
    const marcaNome = p.marca?.nome || null
    const categoriaNome = p.categoria_rel?.nome || p.categoria || null
    const estoqueItems = Array.isArray(p.estoque) ? p.estoque : []

    if (estoqueItems.length === 0) {
      rows.push({
        id: p.id,
        nome: p.nome,
        sku: p.sku,
        codigo_produto: p.codigo_produto,
        referencia: p.referencia,
        categoria: categoriaNome,
        preco_venda: p.preco_venda,
        valor_venda: p.valor_venda,
        marca_nome: marcaNome,
        estoque_local: null,
        estoque_quantidade: null,
        estoque_reservada: null,
        estoque_disponivel: null,
        has_estoque: false,
      })
    } else {
      for (const ei of estoqueItems) {
        const quantidade = Number(ei.quantidade) || 0
        const reservada = Number(ei.quantidade_reservada) || 0
        rows.push({
          id: p.id,
          nome: p.nome,
          sku: p.sku,
          codigo_produto: p.codigo_produto,
          referencia: p.referencia,
          categoria: categoriaNome,
          preco_venda: p.preco_venda,
          valor_venda: p.valor_venda,
          marca_nome: marcaNome,
          estoque_local: ei.local,
          estoque_quantidade: quantidade,
          estoque_reservada: reservada,
          estoque_disponivel: quantidade - reservada,
          has_estoque: true,
        })
      }
    }
  }

  return rows
}
