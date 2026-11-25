
CREATE POLICY "users upload own cv"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'cvs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "users update own cv"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'cvs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "users delete own cv"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'cvs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "cv readable by owner employer admin"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'cvs' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'employer')
    OR public.has_role(auth.uid(), 'admin')
  )
);
