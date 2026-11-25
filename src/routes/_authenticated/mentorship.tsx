import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/mentorship")({
  head: () => ({
    meta: [
      { title: "Mentorship — Local Talent Connect" },
      { name: "description", content: "Connect with mentors, schedule sessions, and track progress." },
      { property: "og:title", content: "Mentorship — Local Talent Connect" },
      { property: "og:description", content: "Connect with mentors, schedule sessions, and track progress." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MentorshipPage,
});

function MentorshipPage() {
  return (
    <div className="space-y-2">
      <h1 className="text-3xl font-semibold tracking-tight">Mentorship</h1>
      <p className="text-sm text-muted-foreground">
        Mentor matching, session scheduling, and progress tracking will appear here.
      </p>
    </div>
  );
}