CREATE POLICY "player photos readable" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'player-photos');

CREATE POLICY "editors upload player photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'player-photos' AND public.can_edit_team(((storage.foldername(name))[1])::uuid));

CREATE POLICY "editors update player photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'player-photos' AND public.can_edit_team(((storage.foldername(name))[1])::uuid)) WITH CHECK (bucket_id = 'player-photos' AND public.can_edit_team(((storage.foldername(name))[1])::uuid));

CREATE POLICY "editors delete player photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'player-photos' AND public.can_edit_team(((storage.foldername(name))[1])::uuid));