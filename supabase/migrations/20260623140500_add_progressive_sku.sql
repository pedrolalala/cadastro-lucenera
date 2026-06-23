DO $$
DECLARE
  dup_record record;
  rec record;
  counter integer := 1;
BEGIN
  -- Handle empty strings first, convert them to NULL so they don't break uniqueness
  UPDATE public.produtos SET sku = NULL WHERE sku = '';
  
  -- Find duplicates and suffix them
  FOR dup_record IN
    SELECT sku, count(*) FROM public.produtos WHERE sku IS NOT NULL GROUP BY sku HAVING count(*) > 1
  LOOP
    counter := 1;
    -- Update duplicates except the first one (oldest stays)
    FOR rec IN
      SELECT id FROM public.produtos WHERE sku = dup_record.sku ORDER BY created_at ASC OFFSET 1
    LOOP
      UPDATE public.produtos SET sku = dup_record.sku || '-dup' || counter WHERE id = rec.id;
      counter := counter + 1;
    END LOOP;
  END LOOP;
END $$;

-- Create partial unique index to guarantee uniqueness of SKU
CREATE UNIQUE INDEX IF NOT EXISTS produtos_sku_unique_idx ON public.produtos (sku) WHERE sku IS NOT NULL;

-- Create function for progressive code generation
CREATE OR REPLACE FUNCTION public.get_next_sku(prefix text)
RETURNS text AS $$
DECLARE
  highest_num integer := 0;
  next_sku text;
  rec record;
  num_str text;
  parsed_num integer;
BEGIN
  FOR rec IN
    SELECT sku FROM public.produtos WHERE sku LIKE prefix || '%' AND sku IS NOT NULL
  LOOP
    num_str := regexp_replace(substring(rec.sku from length(prefix) + 1), '[^0-9]', '', 'g');
    IF num_str <> '' THEN
      BEGIN
        parsed_num := CAST(num_str AS integer);
        IF parsed_num > highest_num THEN
          highest_num := parsed_num;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        -- Ignore cast errors
      END;
    END IF;
  END LOOP;

  next_sku := prefix || lpad((highest_num + 1)::text, 2, '0');
  
  RETURN next_sku;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
