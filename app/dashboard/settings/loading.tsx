export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      <div className="bg-muted h-10 w-48 animate-pulse rounded" />
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-muted h-48 animate-pulse rounded-lg" />
        ))}
      </div>
    </div>
  )
}
