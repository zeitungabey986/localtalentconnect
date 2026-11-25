import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Briefcase, Users, Award, Compass, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import heroImg from "@/assets/hero-talent.jpg";
import mentorImg from "@/assets/mentor.jpg";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Local Talent Connect — Bridging the Experience & Referral Gap" },
      {
        name: "description",
        content:
          "Connecting graduates, career returners, mentors, employers, and training partners for decent work and inclusive economic growth.",
      },
      { property: "og:title", content: "Local Talent Connect" },
      {
        property: "og:description",
        content: "Bridging the local experience and referral gap through mentorship, fellowships, and skills-based matching.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const STORIES = [
  {
    name: "Amina Ochieng",
    role: "Data Fellow → Junior Analyst, FinServe Africa",
    quote:
      "I had strong Python projects but zero referrals. My mentor helped me refine my portfolio and I landed a 6-month fellowship that turned full-time.",
  },
  {
    name: "David Mensah",
    role: "Career Returner → Operations Lead, GreenGrid",
    quote:
      "After three years away caring for family, the returnship programme gave me a structured runway back into leadership.",
  },
  {
    name: "Grace Wanjiku",
    role: "Mentor & Engineering Manager",
    quote:
      "Structured session goals and skills matching let me guide four graduates this year with real, measurable progress.",
  },
];

const SDGS = [
  {
    code: "SDG 8",
    title: "Decent Work & Economic Growth",
    desc: "Structured fellowships, returnships, and fair skills-first hiring that lead to sustainable employment.",
  },
  {
    code: "SDG 10",
    title: "Reduced Inequalities",
    desc: "Replacing informal referral barriers with transparent skills matching and verified portfolios.",
  },
  {
    code: "SDG 17",
    title: "Partnerships for the Goals",
    desc: "Uniting employers, mentors, training partners, and development organisations around shared M&E targets.",
  },
];

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight text-foreground">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
              LT
            </span>
            <span className="text-lg" style={{ fontFamily: "var(--font-display)" }}>
              Local Talent Connect
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#about" className="hover:text-foreground">About</a>
            <a href="#mentorship" className="hover:text-foreground">Mentorship</a>
            <a href="#fellowships" className="hover:text-foreground">Fellowships</a>
            <a href="#employers" className="hover:text-foreground">Employers</a>
            <a href="#sdg" className="hover:text-foreground">Impact</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth" search={{ mode: "login" }}>Log in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth" search={{ mode: "register" }}>Join Platform</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative isolate overflow-hidden">
        <img
          src={heroImg}
          alt="African professionals collaborating in a bright Nairobi workspace"
          width={1600}
          height={1104}
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-foreground/85 via-foreground/65 to-foreground/30" />
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 md:py-32">
          <div className="max-w-2xl text-primary-foreground">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent/90 px-3.5 py-1 text-xs font-medium tracking-wide text-accent-foreground uppercase">
              SDG 8 · SDG 10 · SDG 17 Initiative
            </p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
              Bridging the local experience and referral gap.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-primary-foreground/90 sm:text-lg">
              Local Talent Connect links graduates, career returners, professional mentors, employers, and training
              partners through skills-based matching, structured fellowships, and measurable career outcomes.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/auth" search={{ mode: "register" }}>
                  Create Free Account <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link to="/dashboard">Open Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight">How Local Talent Connect Works</h2>
          <p className="mt-3 text-muted-foreground">
            Designed for equitable access — replacing closed referral circles with demonstrated skills, mentorship, and
            verified pathways into decent work.
          </p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Compass,
              title: "1. Build a Skills Profile",
              desc: "Showcase education, certifications, CV, and portfolio projects. Our transparent matcher scores opportunities by real capability.",
            },
            {
              icon: Users,
              title: "2. Pair with a Mentor",
              desc: "Connect with experienced professionals in your field for structured sessions, career guidance, and interview readiness.",
            },
            {
              icon: Briefcase,
              title: "3. Step into Fellowships & Roles",
              desc: "Apply to paid fellowships, returnships, training programmes, and vacancies from verified employer partners.",
            },
          ].map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <item.icon className="mb-2 h-6 w-6 text-primary" />
                <CardTitle className="text-lg">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{item.desc}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="mentorship" className="border-y bg-secondary/50">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2">
          <div>
            <Badge variant="outline" className="mb-3">Mentorship Programme</Badge>
            <h2 className="text-3xl font-semibold tracking-tight">Guided by professionals who open doors</h2>
            <p className="mt-4 text-muted-foreground">
              Whether you are a recent graduate navigating your first role or a career returner re-entering the
              workforce, our mentorship module pairs you with vetted industry mentors, tracks session milestones, and
              captures structured feedback.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/auth" search={{ mode: "register" }}>Find a Mentor</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/auth" search={{ mode: "register" }}>Become a Mentor</Link>
              </Button>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border bg-card">
            <img
              src={mentorImg}
              alt="African mentor guiding a recent graduate"
              loading="lazy"
              width={1008}
              height={1104}
              className="h-80 w-full object-cover md:h-96"
            />
          </div>
        </div>
      </section>

      <section id="fellowships" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <Badge variant="outline" className="mb-3">Fellowships & Returnships</Badge>
            <h2 className="text-3xl font-semibold tracking-tight">Structured experience that counts</h2>
            <p className="mt-4 text-muted-foreground">
              Employers and training partners publish fellowships, internships, returnships, and accredited training
              cohorts with clear skills criteria — giving talent a fair shot without needing insider referrals.
            </p>
            <div className="mt-6">
              <Button asChild variant="outline">
                <Link to="/auth" search={{ mode: "register" }}>Browse Open Opportunities</Link>
              </Button>
            </div>
          </div>
          <div id="employers" className="rounded-xl border bg-card p-6">
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck className="h-5 w-5" />
              <span className="text-sm font-semibold">For Employer & Training Partners</span>
            </div>
            <h3 className="mt-2 text-2xl font-semibold">Hire by demonstrated skill, not who they know</h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Post vacancies and fellowships, search verified talent profiles ranked with transparent skill-match
              explanations, and track placement progress from application to hire.
            </p>
            <div className="mt-5">
              <Button asChild>
                <Link to="/auth" search={{ mode: "register" }}>Partner as an Employer</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight">Success Stories</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {STORIES.map((s) => (
              <Card key={s.name}>
                <CardContent className="pt-6">
                  <p className="text-sm leading-relaxed text-muted-foreground">“{s.quote}”</p>
                  <div className="mt-5 border-t pt-4">
                    <p className="font-semibold text-foreground">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="sdg" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex items-center gap-2 text-primary">
          <Award className="h-5 w-5" />
          <span className="text-sm font-semibold">Measurable Social Impact</span>
        </div>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">Aligned with the UN Sustainable Development Goals</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {SDGS.map((g) => (
            <Card key={g.code}>
              <CardHeader>
                <Badge className="w-fit bg-primary text-primary-foreground">{g.code}</Badge>
                <CardTitle className="mt-2 text-lg">{g.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{g.desc}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t bg-card">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
          <div>
            <p className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              Local Talent Connect
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Bridging the local experience and referral gap for graduates, career returners, and inclusive employers.
            </p>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Contact</p>
            <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> hello@localtalentconnect.org</p>
            <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> +254 700 123 456</p>
            <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Nairobi & Regional Hubs</p>
          </div>
          <div className="flex flex-col items-start gap-2 md:items-end">
            <Button asChild size="sm">
              <Link to="/auth" search={{ mode: "register" }}>Get Started</Link>
            </Button>
            <p className="mt-auto text-xs text-muted-foreground">© 2026 Local Talent Connect. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
