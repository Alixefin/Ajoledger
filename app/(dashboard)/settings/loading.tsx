import { Skeleton } from '@/components/ui/skeleton'

export default function SettingsLoading() {
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Skeleton className="h-7 w-7" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Form Card */}
      <div className="rounded-lg border bg-card">
        <div className="p-5 space-y-2 border-b">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="p-5 space-y-6">
          {/* Field 1 */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-3 w-48" />
          </div>

          <Skeleton className="h-px w-full" />

          {/* Field 2 */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-3 w-64" />
          </div>

          <Skeleton className="h-px w-full" />

          {/* Field 3 */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-3 w-52" />
          </div>

          <Skeleton className="h-px w-full" />

          {/* Summary */}
          <div className="p-4 bg-muted/50 rounded-md space-y-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>

          {/* Submit */}
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  )
}
