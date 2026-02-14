// EventDetailSkeleton.jsx
// Mirrors EventDetail


export default function EventDetailSkeleton() {

    return (

        <div className = "fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-6 backdrop-blur-sm">
            {/* Banner image skeleton */}
            <div className = "relative flex h-[85vh] sm:h-auto w-full max-w-3xl sm:max-w-[90vh] flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl">
                {/* Close button placeholder */}
                <div className = "absolute right-4 top-4 z-30 h-10 w-10 rounded-full bg-zinc-900 animate-pulse" />

                {/* Scrollable content area */}
                <div className = "flex-1 overflow-y-auto overflow-x-hidden">
                    {/* Header image skeleton */}
                    <div className = "h-56 sm:h-80 w-full shrink-0 bg-zinc-900 animate-pulse">
                        {/* Status badge placeholder */}
                        <div className = "absolute left-6 top-6 h-6 w-32 rounded-full bg-zinc-800/50" />
                    </div>

                    {/* Content body */}
                    <div className = "px-4 sm:px-10 pb-8">
                        {/* Title block */}
                        <div className = "relative -mt-12 mb-8 space-y-4">
                            {/* Title lines */}
                            <div className = "h-10 sm:h-12 w-3/4 rounded-lg bg-zinc-800 animate-pulse" />
                            <div className = "h-10 sm:h-12 w-1/2 rounded-lg bg-zinc-800 animate-pulse" />
                        </div>

                        {/* Host line */}
                        <div className = 'pt-2'>
                            <div className = "h-4 w-48 rounded bg-zinc-900 animate-pulse" />
                        </div>
                    </div>

                    {/* Date & Location */}
                    <div className = "mb-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className = "flex h-20 items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4">
                            <div className = "h-10 w-10 rounded-full bg-zinc-800 animate-pulse" />

                            <div className = 'space-y-2'>
                                <div className = "h-3 w-16 rounded bg-zinc-800 animate-pulse" />
                                <div className = "h-4 w-32 rounded bg-zinc-800 animate-pulse" />
                            </div>
                        </div>
                    </div>

                    {/* Description Text Lines */}
                    <div className = "space-y-3 mb-8">
                        <div className = "h-4 w-1/3 bg-zinc-800 rounded-mb-4" />

                        <div className = "h-3 w-full rounded bg-zinc-900 animate-pulse" />
                        <div className = "h-3 w-full rounded bg-zinc-900 animate-pulse" />
                        <div className = "h-3 w-5/6 rounded bg-zinc-900 animate-pulse" />
                        <div className = "h-3 w-full rounded bg-zinc-900 animate-pulse" />
                        <div className = "h-3 w-4/6 rounded bg-zinc-900 animate-pulse" />
                    </div>

                    {/* Brochure placeholder */}
                    <div className = "h-16 w-full rounded-xl bg-zinc-900/50 border border-zinc-800 animate-pulse" />
                </div>
            </div>

            {/* Sticky Footer */}
            <div className = "shrink-0 border-t border-zinc-800 bg-zinc-950 p-4 pb-safe sm:px-10 sm:py-6">
                <div className = "flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                    {/* Timer Skeleton */}
                    <div className = "flex gap-4">
                        <div className = "h-8 w-8 bg-zinc-900 rounded animate-pulse" />
                        <div className = "h-8 w-8 bg-zinc-900 rounded animate-pulse" />
                        <div className = "h-8 w-8 bg-zinc-900 rounded animate-pulse" />
                    </div>

                    {/* Button Skeleton */}
                    <div className = "h-12 w-full sm:w-48 rounded-xl bg-zinc-800 animate-pulse" />
                </div>
            </div>
        </div>

    )

}
