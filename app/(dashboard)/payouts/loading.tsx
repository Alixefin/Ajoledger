import { Skeleton, SkeletonStats, SkeletonTable } from '@/components/ui/skeleton'

export default function PayoutsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Stats */}
      <SkeletonStats />

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <div className="p-5 space-y-2">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-44" />
        </div>
        <SkeletonTable rows={6} />
      </div>
    </div>
  )
}
