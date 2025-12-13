export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-10 bg-muted animate-pulse rounded w-48" />
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    </div>
  )
}
