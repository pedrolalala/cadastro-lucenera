CREATE OR REPLACE FUNCTION public.get_dashboard_kpi(p_date_now date)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_total_balance NUMERIC;
  v_month_income NUMERIC;
  v_month_expense NUMERIC;
  v_last_month_income NUMERIC;
  v_last_month_expense NUMERIC;
  v_start_month DATE;
  v_end_month DATE;
  v_start_last_month DATE;
  v_end_last_month DATE;
BEGIN
  v_start_month := date_trunc('month', p_date_now);
  v_end_month := (date_trunc('month', p_date_now) + interval '1 month' - interval '1 day')::date;
  v_start_last_month := date_trunc('month', p_date_now - interval '1 month');
  v_end_last_month := (date_trunc('month', p_date_now) - interval '1 day')::date;

  -- Calculate Total Balance
  SELECT COALESCE(SUM(saldo), 0)
  INTO v_total_balance
  FROM public.contas_bancarias;

  IF v_total_balance = 0 THEN
    SELECT COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor WHEN tipo = 'despesa' THEN -valor ELSE 0 END), 0)
    INTO v_total_balance
    FROM public.transacoes
    WHERE status_pago = 1 OR dt_pagamento IS NOT NULL;
  END IF;

  -- Calculate Month Income
  SELECT COALESCE(SUM(valor), 0)
  INTO v_month_income
  FROM public.transacoes
  WHERE tipo = 'receita' 
    AND (COALESCE(dt_pagamento, data_transacao) >= v_start_month AND COALESCE(dt_pagamento, data_transacao) <= v_end_month)
    AND (status_pago = 1 OR dt_pagamento IS NOT NULL);

  -- Calculate Month Expense
  SELECT COALESCE(SUM(valor), 0)
  INTO v_month_expense
  FROM public.transacoes
  WHERE tipo = 'despesa' 
    AND (COALESCE(dt_pagamento, data_transacao) >= v_start_month AND COALESCE(dt_pagamento, data_transacao) <= v_end_month)
    AND (status_pago = 1 OR dt_pagamento IS NOT NULL);

  -- Calculate Last Month Income
  SELECT COALESCE(SUM(valor), 0)
  INTO v_last_month_income
  FROM public.transacoes
  WHERE tipo = 'receita' 
    AND (COALESCE(dt_pagamento, data_transacao) >= v_start_last_month AND COALESCE(dt_pagamento, data_transacao) <= v_end_last_month)
    AND (status_pago = 1 OR dt_pagamento IS NOT NULL);

  -- Calculate Last Month Expense
  SELECT COALESCE(SUM(valor), 0)
  INTO v_last_month_expense
  FROM public.transacoes
  WHERE tipo = 'despesa' 
    AND (COALESCE(dt_pagamento, data_transacao) >= v_start_last_month AND COALESCE(dt_pagamento, data_transacao) <= v_end_last_month)
    AND (status_pago = 1 OR dt_pagamento IS NOT NULL);

  RETURN json_build_object(
    'totalBalance', v_total_balance,
    'monthIncome', v_month_income,
    'monthExpense', v_month_expense,
    'lastMonthIncome', v_last_month_income,
    'lastMonthExpense', v_last_month_expense
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_active_projects integer;
  v_completed_this_month integer;
  v_total_value numeric;
  v_clients_count integer;
  v_architects_count integer;
  v_engineers_count integer;
BEGIN
  -- Active projects count
  SELECT COUNT(*) INTO v_active_projects
  FROM public.projetos
  WHERE status::text NOT IN ('Finalizado', 'Obra Finalizada', 'Arquivado', 'Não Fechou')
     OR status IS NULL;
  
  -- Completed this month count
  SELECT COUNT(*) INTO v_completed_this_month
  FROM public.projetos
  WHERE status::text IN ('Finalizado', 'Obra Finalizada')
    AND updated_at >= date_trunc('month', CURRENT_DATE);

  -- Total Value: Sum of valor_total from vw_financeiro_projetos
  SELECT COALESCE(SUM(valor_total), 0) INTO v_total_value
  FROM public.vw_financeiro_projetos
  WHERE status::text NOT IN ('Arquivado', 'Não Fechou') OR status IS NULL;

  -- Contatos counts
  SELECT COUNT(*) INTO v_clients_count FROM public.contatos WHERE tipo = 'cliente';
  SELECT COUNT(*) INTO v_architects_count FROM public.contatos WHERE tipo = 'arquiteto';
  SELECT COUNT(*) INTO v_engineers_count FROM public.contatos WHERE tipo = 'engenheiro';

  RETURN json_build_object(
    'activeProjects', COALESCE(v_active_projects, 0),
    'completedThisMonth', COALESCE(v_completed_this_month, 0),
    'totalValue', COALESCE(v_total_value, 0),
    'clientsCount', COALESCE(v_clients_count, 0),
    'architectsCount', COALESCE(v_architects_count, 0),
    'engineersCount', COALESCE(v_engineers_count, 0)
  );
END;
$function$;
