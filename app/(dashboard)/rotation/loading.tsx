import { Skeleton, SkeletonStats } from '@/components/ui/skeleton'

export default function RotationLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>

      {/* Stats */}
      <SkeletonStats />

      {/* Progress */}
      <div className="rounded-lg border bg-card p-5 space-y-3">
        <Skeleton className="h-5 w-32" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-3 flex-1" />
          <Skeleton className="h-6 w-12" />
        </div>
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Rotation List */}
      <div className="rounded-lg border bg-card">
        <div className="p-5 space-y-2">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="p-5 pt-0 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border rounded-md">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="hidden sm:flex flex-col items-end space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
