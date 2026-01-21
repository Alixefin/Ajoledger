import { Skeleton, SkeletonStats, SkeletonTable } from '@/components/ui/skeleton'

export default function ContributionsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-52" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>

      {/* Stats */}
      <SkeletonStats />

      {/* Bulk Action */}
      <div className="flex justify-end">
        <Skeleton className="h-10 w-48" />
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <div className="p-5 space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <SkeletonTable rows={8} />
      </div>
    </div>
  )
}
