DROP POLICY IF EXISTS "posts read" ON public.forum_posts;

CREATE POLICY "posts read"
ON public.forum_posts
FOR SELECT
TO authenticated
USING (
  author_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);