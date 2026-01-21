import { Skeleton, SkeletonStats, SkeletonTable } from '@/components/ui/skeleton'

export default function MembersLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Stats */}
      <SkeletonStats />

      {/* Search */}
      <Skeleton className="h-10 w-72" />

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <SkeletonTable rows={6} />
      </div>
    </div>
  )
}
