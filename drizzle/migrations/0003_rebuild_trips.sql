CREATE OR REPLACE FUNCTION public.rebuild_trips_from_movements()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  r record; cur_trip uuid; cur_vehicle uuid := NULL; cur_start numeric; n integer := 0;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  FOR r IN SELECT * FROM public.movements WHERE trip_id IS NULL AND deleted_at IS NULL ORDER BY vehicle_id, occurred_at, (type='retorno') LOOP
    IF cur_vehicle IS DISTINCT FROM r.vehicle_id THEN cur_vehicle := r.vehicle_id; cur_trip := NULL; END IF;
    IF r.type = 'saida' THEN
      INSERT INTO public.trips (vehicle_id, driver_id, start_km, reason, started_at, open)
      VALUES (r.vehicle_id, r.driver_id, r.km, r.reason, r.occurred_at, false) RETURNING id INTO cur_trip;
      cur_start := r.km; n := n + 1;
      UPDATE public.movements SET trip_id = cur_trip WHERE id = r.id;
    ELSIF cur_trip IS NOT NULL THEN
      UPDATE public.trips SET end_km = r.km, distance_km = greatest(r.km - cur_start, 0), ended_at = r.occurred_at WHERE id = cur_trip;
      UPDATE public.movements SET trip_id = cur_trip WHERE id = r.id;
      cur_trip := NULL;
    END IF;
  END LOOP;
  -- trips without return: close with no distance
  UPDATE public.trips SET ended_at = started_at WHERE ended_at IS NULL AND open = false;
  RETURN n;
END $$;
GRANT EXECUTE ON FUNCTION public.rebuild_trips_from_movements() TO authenticated;
SELECT public.rebuild_trips_from_movements();