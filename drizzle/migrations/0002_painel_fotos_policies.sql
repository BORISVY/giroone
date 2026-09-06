CREATE POLICY "painel fotos anon insert" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'painel-fotos');

CREATE POLICY "painel fotos auth read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'painel-fotos');