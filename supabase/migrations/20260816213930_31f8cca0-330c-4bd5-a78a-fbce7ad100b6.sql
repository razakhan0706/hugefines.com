-- Rename "Getting clean bowled" to the new batting category
UPDATE public.fine_categories SET label = 'Soft/ridiculous dismissal' WHERE lower(trim(label)) = 'getting clean bowled';

-- Move any fines from "Missing a straight one" onto the new category, then remove it
UPDATE public.fines f SET category_id = nc.id
FROM public.fine_categories oc
JOIN public.fine_categories nc ON nc.team_id = oc.team_id AND lower(trim(nc.label)) = 'soft/ridiculous dismissal'
WHERE f.category_id = oc.id AND lower(trim(oc.label)) = 'missing a straight one';

DELETE FROM public.fine_categories WHERE lower(trim(label)) = 'missing a straight one';

-- Link custom/free-text fines that describe soft or ridiculous dismissals
UPDATE public.fines f SET category_id = nc.id
FROM public.fine_categories nc
WHERE nc.team_id = f.team_id
  AND lower(trim(nc.label)) = 'soft/ridiculous dismissal'
  AND f.category_id IS NULL
  AND (f.description ~* 'soft dismissal|soft/ridiculous|ridiculous dismissal|soft out|clean bowled|straight one');