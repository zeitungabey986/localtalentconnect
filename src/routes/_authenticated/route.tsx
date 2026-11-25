import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, LogOut, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, primaryRole, ROLE_LABELS } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/auth", search: { mode: "login" } });
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: auth } = useAuth();
  const roles = auth?.roles ?? [];
  const isAdmin = roles.includes("admin");
  const roleLabel = ROLE_LABELS[primaryRole(roles)];

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", auth?.user?.id],
    enabled: Boolean(auth?.user?.id),
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      return data ?? [];
    },
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markAllRead() {
    if (!auth?.user?.id) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", auth.user.id).eq("read", false);
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    queryClient.clear();
    navigate({ to: "/" });
  }

  const navLinkClass =
    "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground [&.active]:bg-primary/10 [&.active]:text-primary";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-2 font-semibold text-foreground">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
                LT
              </span>
              <span className="hidden sm:inline" style={{ fontFamily: "var(--font-display)" }}>
                Local Talent Connect
              </span>
            </Link>
            <nav className="flex flex-wrap items-center gap-1">
              <Link to="/dashboard" className={navLinkClass}>Dashboard</Link>
              <Link to="/opportunities" className={navLinkClass}>Opportunities</Link>
              <Link to="/mentorship" className={navLinkClass}>Mentorship</Link>
              <Link to="/network" className={navLinkClass}>Network</Link>
              <Link to="/profile" className={navLinkClass}>Profile</Link>
              {isAdmin && (
                <Link to="/admin" className={navLinkClass}>
                  <span className="inline-flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5" /> Admin
                  </span>
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="hidden sm:inline-flex">{roleLabel}</Badge>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80">
                <div className="flex items-center justify-between pb-2">
                  <p className="text-sm font-semibold">Notifications</p>
                  {unreadCount > 0 && (
                    <button type="button" onClick={markAllRead} className="text-xs text-primary underline">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="py-4 text-center text-xs text-muted-foreground">No notifications yet.</p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className={`rounded-md border p-2.5 text-xs ${n.read ? "opacity-70" : "bg-secondary/50"}`}>
                        <p className="font-medium text-foreground">{n.title}</p>
                        {n.body && <p className="mt-0.5 text-muted-foreground">{n.body}</p>}
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-1.5 h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}