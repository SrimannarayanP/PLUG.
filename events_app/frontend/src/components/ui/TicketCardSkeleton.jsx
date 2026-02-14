// TicketCardSkeleton.jsx
// Mirrors TicketCard


export default function TicketCardSkeleton() {

    return (

        <div className = "flex flex-col h-full rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden">
            {/* Image placeholder */}
            <div className = "relative aspect-video w-full bg-zinc-900 animate-pulse border-b border-zinc-800">
                {/* Status Badge Placeholder */}
                <div className = "absolute top-3 right-3 h-6 w-20 rounded-full bg-zinc-800/80 animate-pulse" />
            </div>

            {/* Content placeholder */}
            <div className = "flex flex-1 flex-col p-4 sm:p-5">
                <div className = "mb-6 space-y-3">
                    {/* Title Bar */}
                    <div className = "h-7 w-3/4 bg-zinc-800 rounded-md animate-pulse" />

                    {/* Host Line */}
                    <div className = "flex items-center gap-2">
                        <div className = "h-4 w-4 bg-zinc-900 rounded-full animate-pulse" />
                        <div className = "h-3 w-1/2 rounded bg-zinc-900 animate-pulse" />
                    </div>
                </div>

                {/* Date & Location */}
                <div className = "space-y-2.5 mb-6">
                    <div className = "h-10 w-full bg-zinc-900/50 border border-zinc-800/50 rounded-lg animate-pulse" /> {/* Date */}
                    <div className = "h-10 w-full bg-zinc-900/50 border border-zinc-800/50 rounded-lg animate-pulse" /> {/* Location */}
                </div>

                {/* Action Button */}
                <div className = 'mt-auto'>
                    <div className = "h-11 w-full bg-zinc-800 rounded-xl animate-pulse" /> {/* Button */}
                </div>
            </div>
        </div>

    )

}
