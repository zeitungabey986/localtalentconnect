import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/opportunities")({
  head: () => ({
    meta: [
      { title: "Opportunities — Local Talent Connect" },
      { name: "description", content: "Browse jobs, fellowships, returnships, and training programmes." },
      { property: "og:title", content: "Opportunities — Local Talent Connect" },
      { property: "og:description", content: "Browse jobs, fellowships, returnships, and training programmes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OpportunitiesPage,
});

function OpportunitiesPage() {
  return (
    <div className="space-y-2">
      <h1 className="text-3xl font-semibold tracking-tight">Opportunities</h1>
      <p className="text-sm text-muted-foreground">
        Jobs, fellowships, internships, returnships, and training programmes will appear here.
      </p>
    </div>
  );
}