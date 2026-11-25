import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export function useAuth() {
  return useQuery({
    queryKey: ["auth-session-profile"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { user: null, profile: null, roles: [] as AppRole[] };

      const [{ data: profile }, { data: roleRows }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);

      return {
        user,
        profile: profile ?? null,
        roles: (roleRows ?? []).map((r) => r.role),
      };
    },
    staleTime: 30_000,
  });
}

export function primaryRole(roles: AppRole[]): AppRole {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("employer")) return "employer";
  if (roles.includes("mentor")) return "mentor";
  if (roles.includes("training_partner")) return "training_partner";
  return "job_seeker";
}

export const ROLE_LABELS: Record<AppRole, string> = {
  job_seeker: "Job Seeker",
  mentor: "Mentor",
  employer: "Employer",
  training_partner: "Training Partner",
  admin: "Administrator",
};