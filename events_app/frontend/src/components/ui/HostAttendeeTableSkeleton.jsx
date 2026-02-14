// HostAttendeeTableSkeleton.jsx


export default function HostAttendeeTableSkeleton() {

    return (
        
        <div className = 'w-full'>
            {/* Mobile Skeleton */}
            <div className = "flex flex-col gap-4 md:hidden">
                {[...Array(3)].map((_, i) => (
                    <div
                        key = {i}
                        className = "rounded-xl border border-zinc-800 bg-zinc-900 p-5 shadow-sm"
                    >   
                        {/* Header : Name & badge */}
                        <div className = "mb-4 flex items-start justify-between">
                            <div className = 'space-y-2'>
                                <div className = "h-5 w-32 rounded bg-zinc-800 animate-pulse" />
                                <div className = "h-3 w-40 rounded bg-zinc-800/50 animate-pulse" />
                            </div>

                            <div className = "h-6 w-20 rounded-full bg-zinc-800 animate-pulse" />
                        </div>

                        {/* Info rows */}
                        <div className = "mb-6 space-y-3">
                            {[1, 2, 3].map((row) => (
                                <div
                                    key = {row}
                                    className = "flex items-center justify-between"
                                >
                                    <div className = "h-3 w-16 rounded bg-zinc-800/30 animate-pulse" />
                                    <div className = "h-3 w-24 rounded bg-zinc-800/60 animate-pulse" />
                                </div>
                            ))}
                        </div>

                        {/* Action Buttons */}
                        <div className = "flex gap-2">
                            <div className = "h-10 flex-1 rounded-lg bg-zinc-800 animate-pulse" />
                            <div className = "h-10 flex-1 rounded-lg bg-zinc-800 animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop Skeleton */}
            <div className = "hidden md:block overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30">
                {/* Table header */}
                <div className = "flex bg-zinc-900/80 border-b border-zinc-800 p-4">
                    {[...Array(5).map((_, i) => (
                        <div 
                            key = {i}
                            className = 'flex-1'
                        >
                            <div className = {`h-3 w-20 rounded-bg bg-zinc-800/50 animate-pulse ${i == 4 ? 'ml-auto' : ''}`} />
                        </div>
                    ))]}
                </div>

                {/* Table Rows */}
                <div className = "divide-y divide-zinc-800">
                    {[...Array(5).map((_, i) => (
                        <div
                            key = {i}
                            className = "flex p-4 items-center"
                        >
                            {/* Details Column */}
                            <div className = "flex-1 space-y-2">
                                <div className = "h-4 w-32 bg-zinc-800 rounded animate-pulse" />
                                <div className = "h-3 w-40 bg-zinc-800/50 rounded animate-pulse" />
                            </div>

                            {/* Status Column */}
                            <div className = 'flex-1'>
                                <div className = "h-6 w-24 bg-zinc-800 rounded-full animate-pulse" />
                            </div>

                            {/* Info Column */}
                            <div className = "flex-1 space-y-2">
                                <div className = "h-3 w-28 bg-zinc-800 rounded animate-pulse" />
                                <div className = "h-3 w-20 bg-zinc-800/50 rounded animate-pulse" />
                            </div>

                            {/* Transaction ID */}
                            <div className = 'flex-1'>
                                <div className = "h-6 w-20 bg-zinc-950 border border-zinc-800 rounded animate-pulse" />
                            </div>

                            {/* Actions column */}
                            <div className = "flex flex-1 justify-end gap-2">
                                <div className = "h-8 w-20 bg-zinc-800 rounded-lg animate-pulse" />
                                <div className = "h-8 w-16 bg-zinc-800/50 rounded-lg animate-pulse" />
                            </div>
                        </div>
                    ))]}
                </div>
            </div>
        </div>

    )

}
