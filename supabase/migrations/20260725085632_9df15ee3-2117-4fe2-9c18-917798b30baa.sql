
CREATE POLICY "own complaint photos read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'complaint-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "own complaint photos insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'complaint-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "own complaint photos delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'complaint-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
