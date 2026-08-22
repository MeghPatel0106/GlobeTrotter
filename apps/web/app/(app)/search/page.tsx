import { Card, CardHeader, CardTitle, CardDescription } from "@globetrotter/ui";

export default function SearchPlaceholder() {
  return (
    <div className="space-y-4">
      <Card className="border-slate-500/20 bg-ink-900">
        <CardHeader>
          <CardTitle>Explore Cities & Activities</CardTitle>
          <CardDescription>
            City & activity search shell (Planned for Phase 5).
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
