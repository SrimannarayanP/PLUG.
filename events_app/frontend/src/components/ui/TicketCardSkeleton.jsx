// TicketCardSkeleton.jsx
// Mirrors TicketCard


export default function TicketCardSkeleton() {

    return (

        <div className = "rounded-2xl border border-zinc-800 bg-[#18181b] overflow-hidden h-full flex flex-col">
            {/* Image placeholder */}
            <div className = "h-40 bg-zinc-900 animate-pulse w-full" />

            {/* Content placeholder */}
            <div className = "p-5 space-y-4 flex-1 flex flex-col">
                <div className = 'space-y-2'>
                    <div className = "h-6 bg-zinc-800 rounded-w-3/4 animate-pulse" /> {/* Title */}
                    <div className = "h-6 bg-zinc-800 rounded-w-1/3 animate-pulse" /> {/* Host */}
                </div>

                <div className = "space-y-3 pt-2">
                    <div className = "h-8 bg-zinc-800/50 rounded-lg animate-pulse" /> {/* Date */}
                    <div className = "h-8 bg-zinc-800/50 rounded-lg animate-pulse" /> {/* Location */}
                </div>

                <div className = "mt-auto pt-4">
                    <div className = "h-10 bg-zinc-800 rounded-xl animate-pulse" /> {/* Button */}
                </div>
            </div>
        </div>

    )

}
