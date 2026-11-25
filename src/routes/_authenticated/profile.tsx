import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { parseCommaList } from "@/lib/matching";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Talent Profile — Local Talent Connect" },
      { name: "description", content: "Manage your skills, qualifications, portfolio, and CV." },
      { property: "og:title", content: "Talent Profile — Local Talent Connect" },
      { property: "og:description", content: "Manage your skills, qualifications, portfolio, and CV." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const queryClient = useQueryClient();
  const { data: auth } = useAuth();
  const profile = auth?.profile;
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    location: "",
    gender: "",
    age_group: "",
    organization: "",
    headline: "",
    bio: "",
    education: "",
    experience: "",
    certifications: "",
    portfolio_url: "",
    preferred_employment: "",
    skills: "",
    career_interests: "",
    expertise: "",
  });

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name ?? "",
      phone: profile.phone ?? "",
      location: profile.location ?? "",
      gender: profile.gender ?? "",
      age_group: profile.age_group ?? "",
      organization: profile.organization ?? "",
      headline: profile.headline ?? "",
      bio: profile.bio ?? "",
      education: profile.education ?? "",
      experience: profile.experience ?? "",
      certifications: profile.certifications ?? "",
      portfolio_url: profile.portfolio_url ?? "",
      preferred_employment: profile.preferred_employment ?? "",
      skills: (profile.skills ?? []).join(", "),
      career_interests: (profile.career_interests ?? []).join(", "),
      expertise: (profile.expertise ?? []).join(", "),
    });
  }, [profile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!auth?.user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || null,
        location: form.location.trim() || null,
        gender: form.gender.trim() || null,
        age_group: form.age_group.trim() || null,
        organization: form.organization.trim() || null,
        headline: form.headline.trim() || null,
        bio: form.bio.trim() || null,
        education: form.education.trim() || null,
        experience: form.experience.trim() || null,
        certifications: form.certifications.trim() || null,
        portfolio_url: form.portfolio_url.trim() || null,
        preferred_employment: form.preferred_employment.trim() || null,
        skills: parseCommaList(form.skills),
        career_interests: parseCommaList(form.career_interests),
        expertise: parseCommaList(form.expertise),
      })
      .eq("id", auth.user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile saved.");
    queryClient.invalidateQueries({ queryKey: ["auth-session-profile"] });
  }

  async function handleCvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !auth?.user) return;
    setUploading(true);
    const path = `${auth.user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: upErr } = await supabase.storage.from("cvs").upload(path, file, { upsert: true });
    if (upErr) {
      setUploading(false);
      return toast.error(upErr.message);
    }
    await supabase.from("profiles").update({ cv_path: path }).eq("id", auth.user.id);
    setUploading(false);
    toast.success("CV uploaded securely.");
    queryClient.invalidateQueries({ queryKey: ["auth-session-profile"] });
  }

  const field = (key: keyof typeof form, label: string, placeholder = "") => (
    <div className="space-y-1.5">
      <Label htmlFor={key}>{label}</Label>
      <Input id={key} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} />
    </div>
  );

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Professional Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Complete your skills, portfolio, and CV to unlock transparent matching.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">CV / Resume Upload</CardTitle>
          <CardDescription>PDF or Word document (max 5 MB), stored privately.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4 text-primary" />
            <span>{profile?.cv_path ? "CV uploaded on file" : "No CV uploaded yet"}</span>
          </div>
          <Label htmlFor="cv-upload" className="cursor-pointer">
            <span className="inline-flex items-center gap-2 rounded-md border bg-secondary px-3 py-2 text-sm font-medium hover:bg-secondary/80">
              <Upload className="h-4 w-4" /> {uploading ? "Uploading..." : "Upload CV"}
            </span>
            <input id="cv-upload" type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleCvUpload} disabled={uploading} />
          </Label>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {field("full_name", "Full Name")}
              {field("phone", "Phone Number", "+254 ...")}
              {field("location", "City / Region", "Nairobi, Kenya")}
              {field("organization", "Organisation / University")}
              {field("gender", "Gender (optional, for SDG reporting)", "Female / Male / Non-binary")}
              {field("age_group", "Age Group (optional)", "18–24 / 25–34 / 35+")}
            </div>
            {field("headline", "Professional Headline", "Junior Data Analyst | Python & SQL")}
            <div className="space-y-1.5">
              <Label htmlFor="bio">Bio / Summary</Label>
              <Textarea id="bio" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            </div>
            {field("skills", "Technical & Soft Skills (comma-separated)", "Python, SQL, Communication, Project Management")}
            {field("career_interests", "Career Interests (comma-separated)", "Data Science, FinTech, Renewable Energy")}
            {field("expertise", "Mentor Expertise (if Mentor, comma-separated)", "Software Engineering, Career Transitions")}
            {field("education", "Education & Qualifications", "BSc Computer Science, University of Nairobi")}
            {field("experience", "Work Experience", "Intern at TechHub (6 months)")}
            {field("certifications", "Certifications", "Google Data Analytics, AWS Cloud Practitioner")}
            <div className="grid gap-4 sm:grid-cols-2">
              {field("portfolio_url", "Portfolio / GitHub URL", "https://...")}
              {field("preferred_employment", "Preferred Opportunities", "Fellowship, Full-time, Returnship")}
            </div>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Profile"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}