-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin','operador');
CREATE TYPE public.vehicle_status AS ENUM ('disponivel','em_uso','manutencao','inativo');
CREATE TYPE public.movement_type AS ENUM ('saida','retorno');
CREATE TYPE public.incident_status AS ENUM ('nova','visualizada','pendente','realizada','recusada');
CREATE TYPE public.incident_category AS ENUM ('pneus','freios','motor','suspensao','eletrica','funilaria','ar_condicionado','documentacao','limpeza','seguranca','equipamentos','outros');
CREATE TYPE public.maintenance_kind AS ENUM ('preventiva','corretiva');
CREATE TYPE public.error_kind AS ENUM ('saida_duplicada','retorno_sem_saida','km_invalido','correcao','retorno_esquecido','veiculo_incorreto','outros');

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roles readable" ON public.user_roles FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- new user -> profile + admin role (equipe administrativa)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- DRIVERS
CREATE TABLE public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  notes text,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.drivers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.drivers TO authenticated;
GRANT ALL ON public.drivers TO service_role;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "drivers public read active" ON public.drivers FOR SELECT TO anon USING (active AND deleted_at IS NULL);
CREATE POLICY "drivers auth read" ON public.drivers FOR SELECT TO authenticated USING (true);
CREATE POLICY "drivers auth write" ON public.drivers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "drivers auth update" ON public.drivers FOR UPDATE TO authenticated USING (true);

-- VEHICLES
CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  brand text NOT NULL DEFAULT '',
  model text NOT NULL DEFAULT '',
  plate text NOT NULL,
  year int,
  color text,
  current_km numeric NOT NULL DEFAULT 0,
  status public.vehicle_status NOT NULL DEFAULT 'disponivel',
  active boolean NOT NULL DEFAULT true,
  notes text,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.vehicles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT ALL ON public.vehicles TO service_role;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vehicles public read" ON public.vehicles FOR SELECT TO anon USING (active AND deleted_at IS NULL);
CREATE POLICY "vehicles auth read" ON public.vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "vehicles auth insert" ON public.vehicles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "vehicles auth update" ON public.vehicles FOR UPDATE TO authenticated USING (true);

-- TRIPS
CREATE TABLE public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES public.drivers(id),
  start_km numeric NOT NULL,
  end_km numeric,
  distance_km numeric,
  reason text,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  open boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trips TO authenticated;
GRANT ALL ON public.trips TO service_role;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trips auth read" ON public.trips FOR SELECT TO authenticated USING (true);
CREATE POLICY "trips auth write" ON public.trips FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- MOVEMENTS
CREATE TABLE public.movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES public.drivers(id),
  trip_id uuid REFERENCES public.trips(id) ON DELETE SET NULL,
  type public.movement_type NOT NULL,
  km numeric NOT NULL,
  reason text,
  notes text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  corrected boolean NOT NULL DEFAULT false,
  correction_count int NOT NULL DEFAULT 0,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX movements_vehicle_idx ON public.movements(vehicle_id, occurred_at DESC);
CREATE INDEX movements_driver_idx ON public.movements(driver_id, occurred_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.movements TO authenticated;
GRANT ALL ON public.movements TO service_role;
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "movements auth read" ON public.movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "movements auth write" ON public.movements FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- INCIDENTS
CREATE TABLE public.incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number bigint GENERATED ALWAYS AS IDENTITY,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES public.drivers(id),
  movement_id uuid REFERENCES public.movements(id) ON DELETE SET NULL,
  description text NOT NULL,
  category public.incident_category NOT NULL DEFAULT 'outros',
  status public.incident_status NOT NULL DEFAULT 'nova',
  km numeric,
  owner_id uuid,
  owner_name text,
  viewed_at timestamptz,
  resolved_at timestamptz,
  resolution_note text,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.incidents TO authenticated;
GRANT ALL ON public.incidents TO service_role;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "incidents auth read" ON public.incidents FOR SELECT TO authenticated USING (true);
CREATE POLICY "incidents auth write" ON public.incidents FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.incident_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  from_status public.incident_status,
  to_status public.incident_status,
  note text,
  actor_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.incident_history TO authenticated;
GRANT ALL ON public.incident_history TO service_role;
ALTER TABLE public.incident_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inc hist auth read" ON public.incident_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "inc hist auth insert" ON public.incident_history FOR INSERT TO authenticated WITH CHECK (true);

-- PROVIDERS / MAINTENANCE
CREATE TABLE public.service_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_providers TO authenticated;
GRANT ALL ON public.service_providers TO service_role;
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "providers auth all" ON public.service_providers FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.maintenance_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  kind public.maintenance_kind NOT NULL DEFAULT 'corretiva',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.maintenance_types TO authenticated;
GRANT ALL ON public.maintenance_types TO service_role;
ALTER TABLE public.maintenance_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mtypes auth all" ON public.maintenance_types FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.maintenance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  type_id uuid REFERENCES public.maintenance_types(id),
  provider_id uuid REFERENCES public.service_providers(id),
  kind public.maintenance_kind NOT NULL DEFAULT 'corretiva',
  performed_at date NOT NULL DEFAULT current_date,
  description text,
  amount numeric NOT NULL DEFAULT 0,
  km numeric,
  notes text,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.maintenance_records TO authenticated;
GRANT ALL ON public.maintenance_records TO service_role;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mrec auth all" ON public.maintenance_records FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.maintenance_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  name text NOT NULL,
  interval_km numeric,
  interval_months int,
  last_km numeric,
  last_date date,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.maintenance_schedules TO authenticated;
GRANT ALL ON public.maintenance_schedules TO service_role;
ALTER TABLE public.maintenance_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msched auth all" ON public.maintenance_schedules FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ERROR EVENTS (qualidade dos lançamentos)
CREATE TABLE public.error_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  driver_id uuid REFERENCES public.drivers(id),
  movement_id uuid REFERENCES public.movements(id) ON DELETE SET NULL,
  kind public.error_kind NOT NULL,
  blocked boolean NOT NULL DEFAULT false,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.error_events TO authenticated;
GRANT ALL ON public.error_events TO service_role;
ALTER TABLE public.error_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "errors auth read" ON public.error_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "errors auth insert" ON public.error_events FOR INSERT TO authenticated WITH CHECK (true);

-- AUDIT
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  field text,
  old_value text,
  new_value text,
  reason text,
  actor_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit auth read" ON public.audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "audit auth insert" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- SETTINGS
CREATE TABLE public.settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings auth all" ON public.settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- REGISTRO DE MOVIMENTAÇÃO (validação no backend, acessível sem login via QR)
CREATE OR REPLACE FUNCTION public.register_movement(
  p_vehicle_code text,
  p_driver_id uuid,
  p_type public.movement_type,
  p_km numeric,
  p_reason text,
  p_notes text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

  INSERT INTO public.movements (vehicle_id, driver_id, trip_id, type, km, reason, notes)
  VALUES (v.id, d.id, trip_id, p_type, p_km, p_reason, nullif(trim(coalesce(p_notes,'')),''))
  RETURNING id INTO m_id;

  IF nullif(trim(coalesce(p_notes,'')),'') IS NOT NULL
     AND lower(trim(p_notes)) NOT IN ('nenhuma observação','nenhuma observacao','nada','n/a','-') THEN
    INSERT INTO public.incidents (vehicle_id, driver_id, movement_id, description, km)
    VALUES (v.id, d.id, m_id, trim(p_notes), p_km);
  END IF;

  RETURN jsonb_build_object('movement_id', m_id, 'trip_id', trip_id, 'type', p_type, 'km', p_km);
END;
$$;
REVOKE ALL ON FUNCTION public.register_movement(text,uuid,public.movement_type,numeric,text,text) FROM public;
GRANT EXECUTE ON FUNCTION public.register_movement(text,uuid,public.movement_type,numeric,text,text) TO anon, authenticated, service_role;