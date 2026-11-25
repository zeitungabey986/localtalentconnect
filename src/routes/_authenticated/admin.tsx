import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin & M&E — Local Talent Connect" },
      { name: "description", content: "Manage users, verify accounts, and track SDG impact targets." },
      { property: "og:title", content: "Admin & M&E — Local Talent Connect" },
      { property: "og:description", content: "Manage users, verify accounts, and track SDG impact targets." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  return (
    <div className="space-y-2">
      <h1 className="text-3xl font-semibold tracking-tight">Administrator &amp; M&amp;E Dashboard</h1>
      <p className="text-sm text-muted-foreground">
        User verification, SDG impact indicators, and downloadable reports will appear here.
      </p>
    </div>
  );
}