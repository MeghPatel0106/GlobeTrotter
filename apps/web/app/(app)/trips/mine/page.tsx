import { Card, CardHeader, CardTitle, CardDescription } from "@globetrotter/ui";

export default function MyTripsPlaceholder() {
  return (
    <div className="space-y-4">
      <Card className="border-slate-500/20 bg-ink-900">
        <CardHeader>
          <CardTitle>My Trips</CardTitle>
          <CardDescription>
            Trip listing shell (Planned for Phase 6).
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
