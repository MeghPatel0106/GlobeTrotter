import { Card, CardHeader, CardTitle, CardDescription } from "@globetrotter/ui";

export default function CommunityPlaceholder() {
  return (
    <div className="space-y-4">
      <Card className="border-slate-500/20 bg-ink-900">
        <CardHeader>
          <CardTitle>Community Logbook</CardTitle>
          <CardDescription>
            Community travel feed and stories shell (Planned for Phase 8).
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
