CREATE OR REPLACE FUNCTION public.ensure_driver(p_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_name text;
  v_id uuid;
BEGIN
  v_name := regexp_replace(trim(coalesce(p_name,'')), '\s+', ' ', 'g');
  IF length(v_name) < 3 OR position(' ' IN v_name) = 0 THEN
    RAISE EXCEPTION 'MOTORISTA_NOME_INCOMPLETO';
  END IF;
  SELECT id INTO v_id FROM public.drivers
    WHERE lower(regexp_replace(trim(name), '\s+', ' ', 'g')) = lower(v_name)
      AND deleted_at IS NULL
    LIMIT 1;
  IF FOUND THEN
    IF v_id IS NOT NULL THEN
      UPDATE public.drivers SET active = true WHERE id = v_id AND NOT active;
      RETURN v_id;
    END IF;
  END IF;
  INSERT INTO public.drivers (name) VALUES (v_name) RETURNING id INTO v_id;
  RETURN v_id;
END;
$function$;