-- Fix the view to ensure correct aggregation and include codigo_legado
DROP VIEW IF EXISTS public.vw_produtos_estoque_detalhado;

CREATE VIEW public.vw_produtos_estoque_detalhado AS
SELECT
  p.id,
  p.nome,
  p.sku,
  p.codigo_produto,
  p.codigo_legado,
  p.referencia,
  p.ativo,
  p.preco_custo,
  p.preco_venda,
  p.valor_venda,
  p.categoria,
  p.categoria_id,
  p.marca_id,
  p.fornecedor_principal_id,
  p.unidade,
  p.descricao_tecnica,
  p.ncm,
  p.tipo_fiscal,
  COALESCE(SUM(ei.quantidade), 0) AS estoque_total_calc,
  COALESCE(SUM(ei.quantidade_reservada), 0) AS estoque_reservado_calc,
  COALESCE(SUM(ei.quantidade), 0) - COALESCE(SUM(ei.quantidade_reservada), 0) AS estoque_disponivel_calc,
  json_agg(
    json_build_object(
      'local', ei.local,
      'quantidade', ei.quantidade,
      'quantidade_reservada', ei.quantidade_reservada
    )
  ) FILTER (WHERE ei.id IS NOT NULL) AS estoque_setores
FROM public.produtos p
LEFT JOIN public.estoque_itens ei ON ei.produto_id = p.id
GROUP BY p.id;

GRANT SELECT ON public.vw_produtos_estoque_detalhado TO authenticated;

-- Ensure RLS policies for marcas
ALTER TABLE public.marcas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_select_marcas" ON public.marcas;
CREATE POLICY "authenticated_select_marcas" ON public.marcas
  FOR SELECT TO authenticated USING (true);

-- Ensure RLS policies for categorias_produto
ALTER TABLE public.categorias_produto ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_select_categorias_produto" ON public.categorias_produto;
CREATE POLICY "authenticated_select_categorias_produto" ON public.categorias_produto
  FOR SELECT TO authenticated USING (true);
