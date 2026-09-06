-- 1. Permissions per user per screen
CREATE TABLE public.user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  screen text NOT NULL,
  can_view boolean NOT NULL DEFAULT true,
  can_edit boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, screen)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_permissions TO authenticated;
GRANT ALL ON public.user_permissions TO service_role;

ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "perms read own or admin" ON public.user_permissions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "perms admin write" ON public.user_permissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Roles manageable by admins
CREATE POLICY "roles admin insert" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "roles admin update" ON public.user_roles
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "roles admin delete" ON public.user_roles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 3. Settings: everyone authenticated reads, only admins write
DROP POLICY IF EXISTS "settings auth all" ON public.settings;
CREATE POLICY "settings read" ON public.settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "settings admin write" ON public.settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. Odometer photo on movements
ALTER TABLE public.movements ADD COLUMN IF NOT EXISTS photo_url text;

DROP FUNCTION IF EXISTS public.register_movement(text, uuid, movement_type, numeric, text, text);

CREATE OR REPLACE FUNCTION public.register_movement(
  p_vehicle_code text,
  p_driver_id uuid,
  p_type movement_type,
  p_km numeric,
  p_reason text,
  p_notes text DEFAULT NULL::text,
  p_photo_url text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v public.vehicles%ROWTYPE;
  d public.drivers%ROWTYPE;
  t public.trips%ROWTYPE;
  m_id uuid;
  trip_id uuid;
BEGIN
  SELECT * INTO v FROM public.vehicles WHERE code = p_vehicle_code AND deleted_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'VEICULO_NAO_ENCONTRADO'; END IF;
  IF NOT v.active THEN RAISE EXCEPTION 'VEICULO_INATIVO'; END IF;

  SELECT * INTO d FROM public.drivers WHERE id = p_driver_id AND deleted_at IS NULL AND active;
  IF NOT FOUND THEN RAISE EXCEPTION 'MOTORISTA_INVALIDO'; END IF;

  IF p_km IS NULL OR p_km < 0 THEN RAISE EXCEPTION 'KM_INVALIDO'; END IF;
  IF coalesce(trim(p_reason),'') = '' THEN RAISE EXCEPTION 'MOTIVO_OBRIGATORIO'; END IF;
  IF coalesce(trim(p_photo_url),'') = '' THEN RAISE EXCEPTION 'FOTO_OBRIGATORIA'; END IF;

  SELECT * INTO t FROM public.trips WHERE vehicle_id = v.id AND open ORDER BY started_at DESC LIMIT 1;

  IF p_type = 'saida' AND FOUND THEN
    INSERT INTO public.error_events (vehicle_id, driver_id, kind, blocked, details)
    VALUES (v.id, d.id, 'saida_duplicada', true, 'Tentativa de saída com veículo em uso');
    RAISE EXCEPTION 'SAIDA_DUPLICADA';
  END IF;

  IF p_type = 'retorno' AND t.id IS NULL THEN
    INSERT INTO public.error_events (vehicle_id, driver_id, kind, blocked, details)
    VALUES (v.id, d.id, 'retorno_sem_saida', true, 'Tentativa de retorno sem saída aberta');
    RAISE EXCEPTION 'RETORNO_SEM_SAIDA';
  END IF;

  IF p_km < v.current_km THEN
    INSERT INTO public.error_events (vehicle_id, driver_id, kind, blocked, details)
    VALUES (v.id, d.id, 'km_invalido', true, 'KM informado ('||p_km||') menor que o último ('||v.current_km||')');
    RAISE EXCEPTION 'KM_MENOR_QUE_ULTIMO:%', v.current_km;
  END IF;

  IF p_type = 'saida' THEN
    INSERT INTO public.trips (vehicle_id, driver_id, start_km, reason)
    VALUES (v.id, d.id, p_km, p_reason) RETURNING id INTO trip_id;
    UPDATE public.vehicles SET status = 'em_uso', current_km = p_km WHERE id = v.id;
  ELSE
    trip_id := t.id;
    UPDATE public.trips SET end_km = p_km, distance_km = p_km - start_km, ended_at = now(), open = false
      WHERE id = t.id;
    UPDATE public.vehicles SET status = 'disponivel', current_km = p_km WHERE id = v.id;
  END IF;

  INSERT INTO public.movements (vehicle_id, driver_id, trip_id, type, km, reason, notes, photo_url)
  VALUES (v.id, d.id, trip_id, p_type, p_km, p_reason, nullif(trim(coalesce(p_notes,'')),''), p_photo_url)
  RETURNING id INTO m_id;

  IF nullif(trim(coalesce(p_notes,'')),'') IS NOT NULL
     AND lower(trim(p_notes)) NOT IN ('nenhuma observação','nenhuma observacao','nada','n/a','-') THEN
    INSERT INTO public.incidents (vehicle_id, driver_id, movement_id, description, km)
    VALUES (v.id, d.id, m_id, trim(p_notes), p_km);
  END IF;

  RETURN jsonb_build_object('movement_id', m_id, 'trip_id', trip_id, 'type', p_type, 'km', p_km);
END;
$function$;