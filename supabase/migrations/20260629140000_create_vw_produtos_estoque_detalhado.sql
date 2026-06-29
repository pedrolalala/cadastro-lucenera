-- Drop the existing view first because the column layout changed (names, order, types).
-- CREATE OR REPLACE VIEW cannot rename or reorder columns.
DROP VIEW IF EXISTS public.vw_produtos_estoque_detalhado;

-- Recreate with the full detailed stock view
CREATE VIEW public.vw_produtos_estoque_detalhado AS
SELECT
  p.id,
  p.nome,
  p.sku,
  p.codigo_produto,
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
  p.estoque_total,
  p.estoque_showroom,
  p.estoque_disponivel,
  COALESCE(SUM(ei.quantidade), 0) AS estoque_total_calc,
  COALESCE(SUM(ei.quantidade_reservada), 0) AS estoque_reservado_calc,
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

-- Grant access to authenticated users
GRANT SELECT ON public.vw_produtos_estoque_detalhado TO authenticated;
