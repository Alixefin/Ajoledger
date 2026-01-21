import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("skeleton rounded-md bg-muted", className)}
      {...props}
    />
  )
}

/**
 * Skeleton variants for common use cases
 */
function SkeletonText({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <Skeleton className={cn("h-4 w-full", className)} {...props} />
}

function SkeletonHeading({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <Skeleton className={cn("h-7 w-48", className)} {...props} />
}

function SkeletonAvatar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <Skeleton className={cn("h-10 w-10 rounded-full", className)} {...props} />
}

function SkeletonButton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <Skeleton className={cn("h-10 w-24 rounded-md", className)} {...props} />
}

function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-lg border bg-card p-5 space-y-4", className)} {...props}>
      <div className="flex items-center gap-3">
        <SkeletonAvatar />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  )
}

function SkeletonTable({ rows = 5, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { rows?: number }) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      {/* Header */}
      <div className="flex gap-4 px-4 py-3 bg-muted/50 rounded-md">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16 ml-auto" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3 border-b">
          <SkeletonAvatar className="h-8 w-8" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-8 rounded-md ml-auto" />
        </div>
      ))}
    </div>
  )
}

function SkeletonStats({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-4", className)} {...props}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-5 space-y-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  )
}

export { 
  Skeleton, 
  SkeletonText, 
  SkeletonHeading, 
  SkeletonAvatar, 
  SkeletonButton, 
  SkeletonCard, 
  SkeletonTable,
  SkeletonStats
}
