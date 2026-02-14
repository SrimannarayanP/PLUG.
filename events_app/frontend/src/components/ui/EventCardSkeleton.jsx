// EventCardSkeleton.jsx
// Mirrors EventCard


export default function EventCardSkeleton() {

    return (

        <div className = "flex flex-col h-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
            {/* Poster placeholder */}
            <div className = "aspect-video bg-zinc-900 animate-pulse w-full" />

            {/* Content section */}
            <div className = "flex flex-1 flex-col p-4 sm:p-5">
                {/* Categories */}
                <div className = "mb-3 flex gap-2">
                    <div className = "h-4 w-16 bg-zinc-800/60 rounded animate-pulse" />
                    <div className = "h-4 w-12 bg-zinc-800/60 rounded animate-pulse" />
                </div>

                {/* Title */}
                <div className = "mb-4 space-y-2">
                    <div className = "h-6 w-3/4 bg-zinc-800 rounded animate-pulse" />
                    <div className = "h-6 w-1/2 bg-zinc-800 rounded animate-pulse" />
                </div>

                {/* Location & Host */}
                <div className = "mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                    <div className = "h-3 w-24 bg-zinc-800/40 rounded animate-pulse" />
                    <div className = "h-3 w-20 bg-zinc-800/40 rounded animate-pulse" />
                </div>

                {/* Button */}
                <div className = "mt-auto pt-4">
                    <div className = "h-11 w-full bg-zinc-800 rounded-xl animate-pulse" />
                </div>
            </div>
        </div>

    )

}
