import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, primaryRole, ROLE_LABELS } from "@/hooks/useAuth";
import { computeSkillMatch } from "@/lib/matching";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Local Talent Connect" },
      { name: "description", content: "Your role-specific Local Talent Connect workspace." },
      { property: "og:title", content: "Dashboard — Local Talent Connect" },
      { property: "og:description", content: "Your role-specific Local Talent Connect workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const queryClient = useQueryClient();
  const { data: auth, isLoading } = useAuth();
  const user = auth?.user;
  const profile = auth?.profile;
  const roles = auth?.roles ?? [];
  const role = primaryRole(roles);
  const isPoster = roles.includes("employer") || roles.includes("training_partner") || roles.includes("admin");

  const { data: opportunities = [] } = useQuery({
    queryKey: ["opportunities-open"],
    queryFn: async () => {
      const { data } = await supabase.from("opportunities").select("*").eq("status", "open").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: myApplications = [] } = useQuery({
    queryKey: ["my-applications", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data } = await supabase
        .from("applications")
        .select("*, opportunities(title, kind, location)")
        .eq("applicant_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: incomingApplications = [] } = useQuery({
    queryKey: ["incoming-applications", user?.id],
    enabled: Boolean(user?.id && isPoster),
    queryFn: async () => {
      const { data: myOpps } = await supabase.from("opportunities").select("id").eq("owner_id", user!.id);
      const ids = (myOpps ?? []).map((o) => o.id);
      if (ids.length === 0) return [];
      const { data } = await supabase
        .from("applications")
        .select("*, opportunities(title, kind), profiles!applications_applicant_id_fkey(full_name, skills, portfolio_url, cv_path)")
        .in("opportunity_id", ids)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: mentorships = [] } = useQuery({
    queryKey: ["my-mentorships", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data } = await supabase
        .from("mentorships")
        .select("*")
        .or(`mentor_id.eq.${user!.id},mentee_id.eq.${user!.id}`)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading your dashboard...</p>;

  const recommended = opportunities
    .map((o) => ({
      ...o,
      match: computeSkillMatch(profile?.skills ?? [], o.skills ?? [], Boolean(profile?.portfolio_url)),
    }))
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, 4);

  async function updateAppStatus(appId: string, status: string) {
    const { error } = await supabase.from("applications").update({ status }).eq("id", appId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Application marked as ${status}`);
    queryClient.invalidateQueries({ queryKey: ["incoming-applications"] });
  }

  async function openCv(cvPath: string) {
    const { data, error } = await supabase.storage.from("cvs").createSignedUrl(cvPath, 120);
    if (error || !data?.signedUrl) {
      toast.error("Could not open CV file.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Welcome, {profile?.full_name || user?.email?.split("@")[0]}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {ROLE_LABELS[role]} Dashboard {profile?.verified ? "· Verified Account" : "· Pending Verification"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/profile">Edit Profile</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/opportunities">{isPoster ? "Post Opportunity" : "Browse Opportunities"}</Link>
          </Button>
          {roles.includes("admin") && (
            <Button asChild size="sm" variant="secondary">
              <Link to="/admin">Open M&amp;E Admin</Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Open Opportunities</CardDescription>
            <CardTitle className="text-3xl">{opportunities.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{isPoster ? "Incoming Applications" : "My Applications"}</CardDescription>
            <CardTitle className="text-3xl">{isPoster ? incomingApplications.length : myApplications.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Mentorship Connections</CardDescription>
            <CardTitle className="text-3xl">{mentorships.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Profile Skills Listed</CardDescription>
            <CardTitle className="text-3xl">{profile?.skills?.length ?? 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {isPoster ? (
        <Card>
          <CardHeader>
            <CardTitle>Applicant Review &amp; Placement Tracker</CardTitle>
            <CardDescription>Review candidates by skill match and advance them through placement.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {incomingApplications.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No applications yet. Publish a vacancy, fellowship, returnship, or training programme on the Opportunities page.
              </p>
            ) : (
              incomingApplications.map((app) => {
                const applicant = app.profiles as { full_name?: string; skills?: string[]; cv_path?: string; portfolio_url?: string } | null;
                const opp = app.opportunities as { title?: string; kind?: string } | null;
                return (
                  <div key={app.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                    <div className="space-y-1">
                      <p className="font-medium">{applicant?.full_name || "Participant"} → {opp?.title}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary">{opp?.kind}</Badge>
                        {app.match_score !== null && <Badge variant="outline">{app.match_score}% skill match</Badge>}
                        {applicant?.cv_path && (
                          <button type="button" onClick={() => openCv(applicant.cv_path!)} className="text-primary underline">
                            View CV
                          </button>
                        )}
                      </div>
                      {app.cover_note && <p className="text-xs text-muted-foreground">{app.cover_note}</p>}
                    </div>
                    <Select value={app.status} onValueChange={(v) => updateAppStatus(app.id, v)}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["submitted", "shortlisted", "interview", "offered", "placed", "rejected"].map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recommended for Your Skills</CardTitle>
              <CardDescription>Transparent matching based on your listed skills and portfolio.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recommended.length === 0 ? (
                <p className="text-sm text-muted-foreground">No open opportunities yet. Check back soon!</p>
              ) : (
                recommended.map((o) => (
                  <div key={o.id} className="rounded-lg border p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{o.title}</p>
                      <Badge className="bg-primary text-primary-foreground">{o.match.score}% match</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{o.match.explanation}</p>
                  </div>
                ))
              )}
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link to="/opportunities">View All Opportunities</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>My Applications</CardTitle>
              <CardDescription>Track every application from submission to placement.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {myApplications.length === 0 ? (
                <p className="text-sm text-muted-foreground">You haven&apos;t applied to any opportunities yet.</p>
              ) : (
                myApplications.map((a) => {
                  const opp = a.opportunities as { title?: string; kind?: string } | null;
                  return (
                    <div key={a.id} className="flex items-center justify-between rounded-lg border p-3.5">
                      <div>
                        <p className="font-medium">{opp?.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{opp?.kind}</p>
                      </div>
                      <Badge variant="secondary" className="capitalize">{a.status}</Badge>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}