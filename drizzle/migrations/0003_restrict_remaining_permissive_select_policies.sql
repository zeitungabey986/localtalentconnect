DROP POLICY IF EXISTS "profiles readable by signed-in" ON public.profiles;
CREATE POLICY "profiles readable by signed-in"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "roles readable by signed-in" ON public.user_roles;
CREATE POLICY "roles readable by signed-in"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "replies read" ON public.forum_replies;
CREATE POLICY "replies read"
ON public.forum_replies
FOR SELECT
TO authenticated
USING (
  author_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "events public" ON public.events;
CREATE POLICY "events public"
ON public.events
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);