import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/network")({
  head: () => ({
    meta: [
      { title: "Network — Local Talent Connect" },
      { name: "description", content: "Join industry communities, forums, and career workshops." },
      { property: "og:title", content: "Network — Local Talent Connect" },
      { property: "og:description", content: "Join industry communities, forums, and career workshops." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NetworkPage,
});

function NetworkPage() {
  return (
    <div className="space-y-2">
      <h1 className="text-3xl font-semibold tracking-tight">Professional Network</h1>
      <p className="text-sm text-muted-foreground">
        Discussion forums, industry communities, and networking events will appear here.
      </p>
    </div>
  );
}