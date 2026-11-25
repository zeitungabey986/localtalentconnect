import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const searchSchema = z.object({
  mode: z.enum(["login", "register", "forgot"]).optional().catch("login"),
});

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Sign In or Register — Local Talent Connect" },
      { name: "description", content: "Access your Local Talent Connect dashboard." },
      { property: "og:title", content: "Sign In — Local Talent Connect" },
      { property: "og:description", content: "Access your Local Talent Connect dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode: initialMode } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register" | "forgot">(initialMode ?? "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [organization, setOrganization] = useState("");
  const [role, setRole] = useState<"job_seeker" | "mentor" | "employer" | "training_partner">("job_seeker");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checkEmailMsg, setCheckEmailMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return toast.error("Please enter your email address.");
    setBusy(true);
    setCheckEmailMsg(null);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setCheckEmailMsg("Password reset link sent. Please check your inbox.");
      } else if (mode === "register") {
        if (!fullName.trim()) throw new Error("Please enter your full name.");
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");
        if (!consent) throw new Error("Please agree to the privacy and data consent terms.");
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName.trim(), organization: organization.trim(), role, consent: true },
          },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Account created!");
          navigate({ to: "/dashboard" });
        } else {
          setCheckEmailMsg("Registration successful! Please check your email to verify your account before signing in.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) return toast.error(result.error.message);
    if (!result.redirected) navigate({ to: "/dashboard" });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <Link to="/" className="mb-6 text-xl font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
        Local Talent Connect
      </Link>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {mode === "login" ? "Sign in to your account" : mode === "register" ? "Create your account" : "Reset password"}
          </CardTitle>
          <CardDescription>
            {mode === "login"
              ? "Access your role dashboard, opportunities, and mentorship."
              : mode === "register"
                ? "Join as a job seeker, mentor, employer, or training partner."
                : "Enter your email and we will send you a recovery link."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {checkEmailMsg && (
            <div className="mb-4 rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-foreground">
              {checkEmailMsg}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="role">Account role</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="job_seeker">Job Seeker / Graduate / Career Returner</SelectItem>
                      <SelectItem value="mentor">Professional Mentor</SelectItem>
                      <SelectItem value="employer">Employer Partner</SelectItem>
                      <SelectItem value="training_partner">Training Partner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(role === "employer" || role === "training_partner" || role === "mentor") && (
                  <div className="space-y-1.5">
                    <Label htmlFor="org">Organisation</Label>
                    <Input id="org" value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="Company or institution name" />
                  </div>
                )}
              </>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            {mode !== "forgot" && (
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>
            )}
            {mode === "register" && (
              <div className="flex items-start gap-2 pt-1">
                <Checkbox id="consent" checked={consent} onCheckedChange={(v) => setConsent(Boolean(v))} />
                <Label htmlFor="consent" className="text-xs leading-snug text-muted-foreground">
                  I consent to Local Talent Connect storing my profile and application data for skills-based matching and anonymised SDG impact reporting.
                </Label>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Please wait..." : mode === "login" ? "Sign in" : mode === "register" ? "Create account" : "Send reset link"}
            </Button>
          </form>

          {mode !== "forgot" && (
            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogle}
                className="w-full gap-2.5 border-[#747775] bg-[#FFFFFF] text-[#1F1F1F] hover:bg-[#F2F2F2]"
              >
                <svg aria-hidden="true" width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
                  <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
                </svg>
                Continue with Google
              </Button>
            </div>
          )}

          <div className="mt-5 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
            {mode === "login" ? (
              <>
                <button type="button" onClick={() => setMode("forgot")} className="underline hover:text-foreground">
                  Forgot password?
                </button>
                <button type="button" onClick={() => setMode("register")} className="underline hover:text-foreground">
                  Need an account? Register
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setMode("login")} className="underline hover:text-foreground">
                Back to sign in
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}