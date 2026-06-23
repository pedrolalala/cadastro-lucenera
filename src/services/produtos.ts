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
