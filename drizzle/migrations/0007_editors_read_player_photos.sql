CREATE POLICY "editors read player photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'player-photos'
  AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  AND public.can_edit_team(((storage.foldername(name))[1])::uuid)
);