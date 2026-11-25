
CREATE TYPE public.app_role AS ENUM ('admin','job_seeker','mentor','employer','training_partner');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text,
  phone text,
  location text,
  gender text,
  age_group text,
  organization text,
  headline text,
  bio text,
  education text,
  experience text,
  certifications text,
  portfolio_url text,
  career_interests text[] NOT NULL DEFAULT '{}',
  preferred_employment text,
  skills text[] NOT NULL DEFAULT '{}',
  expertise text[] NOT NULL DEFAULT '{}',
  cv_path text,
  verified boolean NOT NULL DEFAULT false,
  consent_given boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "profiles readable by signed-in" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "roles readable by signed-in" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins add roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins remove roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- protect verified flag from self-edit
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.verified IS DISTINCT FROM OLD.verified AND NOT public.has_role(auth.uid(),'admin') THEN
    NEW.verified := OLD.verified;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER profiles_protect BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_profile_fields();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r text := COALESCE(NEW.raw_user_meta_data->>'role','job_seeker');
BEGIN
  IF r NOT IN ('job_seeker','mentor','employer','training_partner') THEN r := 'job_seeker'; END IF;
  INSERT INTO public.profiles (id, full_name, email, organization, consent_given)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), NEW.email,
          NEW.raw_user_meta_data->>'organization', COALESCE((NEW.raw_user_meta_data->>'consent')::boolean, false));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, r::public.app_role);
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Opportunities (jobs, fellowships, internships, returnships, training)
CREATE TABLE public.opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'job' CHECK (kind IN ('job','fellowship','internship','returnship','training')),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  skills text[] NOT NULL DEFAULT '{}',
  eligibility text,
  location text,
  employment_type text,
  deadline date,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.opportunities(owner_id);
CREATE INDEX ON public.opportunities(kind, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunities TO authenticated;
GRANT SELECT ON public.opportunities TO anon;
GRANT ALL ON public.opportunities TO service_role;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open opps public" ON public.opportunities FOR SELECT TO anon, authenticated USING (status = 'open' OR owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "posters create" ON public.opportunities FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid() AND (public.has_role(auth.uid(),'employer') OR public.has_role(auth.uid(),'training_partner') OR public.has_role(auth.uid(),'admin')));
CREATE POLICY "owners update" ON public.opportunities FOR UPDATE TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "owners delete" ON public.opportunities FOR DELETE TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.owns_opportunity(_opp uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.opportunities WHERE id = _opp AND owner_id = _user)
$$;

CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cover_note text,
  match_score int,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','shortlisted','interview','offered','placed','rejected','withdrawn')),
  progress int NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (opportunity_id, applicant_id)
);
CREATE INDEX ON public.applications(applicant_id);
GRANT SELECT, INSERT, UPDATE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app read" ON public.applications FOR SELECT TO authenticated USING (applicant_id = auth.uid() OR public.owns_opportunity(opportunity_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "app create" ON public.applications FOR INSERT TO authenticated WITH CHECK (applicant_id = auth.uid());
CREATE POLICY "app update" ON public.applications FOR UPDATE TO authenticated USING (applicant_id = auth.uid() OR public.owns_opportunity(opportunity_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid UNIQUE REFERENCES public.applications(id) ON DELETE CASCADE,
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL,
  paid_employment boolean NOT NULL DEFAULT false,
  started_on date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.placements TO authenticated;
GRANT ALL ON public.placements TO service_role;
ALTER TABLE public.placements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "placement read" ON public.placements FOR SELECT TO authenticated USING (participant_id = auth.uid() OR public.owns_opportunity(opportunity_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "placement create" ON public.placements FOR INSERT TO authenticated WITH CHECK (public.owns_opportunity(opportunity_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.saved_opportunities (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, opportunity_id)
);
GRANT SELECT, INSERT, DELETE ON public.saved_opportunities TO authenticated;
GRANT ALL ON public.saved_opportunities TO service_role;
ALTER TABLE public.saved_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own saved" ON public.saved_opportunities FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Mentorship
CREATE TABLE public.mentorships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mentee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  goals text,
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','active','completed','declined')),
  progress int NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mentor_id, mentee_id)
);
GRANT SELECT, INSERT, UPDATE ON public.mentorships TO authenticated;
GRANT ALL ON public.mentorships TO service_role;
ALTER TABLE public.mentorships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ms read" ON public.mentorships FOR SELECT TO authenticated USING (mentor_id = auth.uid() OR mentee_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "ms request" ON public.mentorships FOR INSERT TO authenticated WITH CHECK (mentee_id = auth.uid() AND public.has_role(mentor_id,'mentor'));
CREATE POLICY "ms update" ON public.mentorships FOR UPDATE TO authenticated USING (mentor_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.in_mentorship(_ms uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.mentorships WHERE id = _ms AND (mentor_id = _user OR mentee_id = _user))
$$;

CREATE TABLE public.mentorship_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentorship_id uuid NOT NULL REFERENCES public.mentorships(id) ON DELETE CASCADE,
  scheduled_at timestamptz NOT NULL,
  topic text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','done','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.mentorship_sessions TO authenticated;
GRANT ALL ON public.mentorship_sessions TO service_role;
ALTER TABLE public.mentorship_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sess all" ON public.mentorship_sessions FOR ALL TO authenticated USING (public.in_mentorship(mentorship_id, auth.uid()) OR public.has_role(auth.uid(),'admin')) WITH CHECK (public.in_mentorship(mentorship_id, auth.uid()));

CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentorship_id uuid NOT NULL REFERENCES public.mentorships(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.feedback TO authenticated;
GRANT ALL ON public.feedback TO service_role;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fb read" ON public.feedback FOR SELECT TO authenticated USING (public.in_mentorship(mentorship_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "fb write" ON public.feedback FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid() AND public.in_mentorship(mentorship_id, auth.uid()));

-- Networking
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'event' CHECK (kind IN ('event','workshop')),
  title text NOT NULL,
  description text,
  starts_at timestamptz NOT NULL,
  location text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.events TO anon;
GRANT SELECT, INSERT, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events public" ON public.events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "events create" ON public.events FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() AND NOT public.has_role(auth.uid(),'job_seeker') OR (created_by = auth.uid() AND public.has_role(auth.uid(),'admin')));
CREATE POLICY "events delete" ON public.events FOR DELETE TO authenticated USING (created_by = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.forum_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  community text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.forum_posts TO authenticated;
GRANT ALL ON public.forum_posts TO service_role;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts read" ON public.forum_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "posts write" ON public.forum_posts FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "posts delete" ON public.forum_posts FOR DELETE TO authenticated USING (author_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.forum_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.forum_replies TO authenticated;
GRANT ALL ON public.forum_replies TO service_role;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "replies read" ON public.forum_replies FOR SELECT TO authenticated USING (true);
CREATE POLICY "replies write" ON public.forum_replies FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "replies delete" ON public.forum_replies FOR DELETE TO authenticated USING (author_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.notifications(user_id, read);
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notif" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own notif upd" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own notif del" ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read audit" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Notification + audit triggers
CREATE OR REPLACE FUNCTION public.on_application_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o record;
BEGIN
  SELECT * INTO o FROM public.opportunities WHERE id = NEW.opportunity_id;
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications(user_id,title,body) VALUES (o.owner_id,'New application','Someone applied to "'||o.title||'"');
    INSERT INTO public.audit_logs(actor_id,action,entity,entity_id) VALUES (auth.uid(),'apply','application',NEW.id);
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.updated_at := now();
    INSERT INTO public.notifications(user_id,title,body) VALUES (NEW.applicant_id,'Application update','Your application for "'||o.title||'" is now '||NEW.status);
    INSERT INTO public.audit_logs(actor_id,action,entity,entity_id) VALUES (auth.uid(),'status:'||NEW.status,'application',NEW.id);
    IF NEW.status = 'placed' THEN
      INSERT INTO public.placements(application_id,opportunity_id,participant_id,kind,paid_employment)
      VALUES (NEW.id,o.id,NEW.applicant_id,o.kind,o.kind IN ('job','fellowship','returnship'))
      ON CONFLICT (application_id) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER applications_ins AFTER INSERT ON public.applications FOR EACH ROW EXECUTE FUNCTION public.on_application_change();
CREATE TRIGGER applications_upd BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.on_application_change();

CREATE OR REPLACE FUNCTION public.on_mentorship_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications(user_id,title,body) VALUES (NEW.mentor_id,'New mentorship request','A participant has asked you to be their mentor');
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.notifications(user_id,title,body) VALUES (NEW.mentee_id,'Mentorship update','Your mentorship is now '||NEW.status);
    INSERT INTO public.audit_logs(actor_id,action,entity,entity_id) VALUES (auth.uid(),'status:'||NEW.status,'mentorship',NEW.id);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER mentorships_change AFTER INSERT OR UPDATE ON public.mentorships FOR EACH ROW EXECUTE FUNCTION public.on_mentorship_change();

CREATE OR REPLACE FUNCTION public.on_role_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.audit_logs(actor_id,action,entity,entity_id)
  VALUES (auth.uid(), TG_OP||':'||COALESCE(NEW.role,OLD.role)::text, 'user_role', COALESCE(NEW.user_id,OLD.user_id));
  RETURN COALESCE(NEW,OLD);
END $$;
CREATE TRIGGER roles_audit AFTER INSERT OR DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.on_role_change();
