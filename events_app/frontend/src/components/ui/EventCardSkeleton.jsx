// EventCardSkeleton.jsx
// Mirrors EventCard


export default function EventCardSkeleton() {

    return (

        <div className = "rounded-2xl border border-zinc-800 bg-[#18181b] overflow-hidden h-full flex flex-col">
            {/* Poster placeholder */}
            <div className = "h-48 bg-zinc-900 animate-pulse w-full" />

            {/* Content section */}
            <div className = "p-5 flex-1 flex-col space-y-4">
                {/* Categories */}
                <div className = "flex gap-2">
                    <div className = "h-5 w-16 bg-zinc-800 rounded animate-pulse" />
                    <div className = "h-5 w-12 bg-zinc-800 rounded animate-pulse" />
                </div>

                {/* Title & host */}
                <div className = 'space-y-2'>
                    <div className = "h-6 w-3/4 bg-zinc-800 rounded animate-pulse" />
                    <div className = "h-6 w-1/2 bg-zinc-800 rounded animate-pulse" />
                </div>

                {/* Location */}
                <div className = "h-4 w-1/3 bg-zinc-800 rounded animate-pulse mt-2" />

                {/* Button */}
                <div className = "mt-auto pt-4 border-t border-zinc-800/50">
                    <div className = "h-10 w-full bg-zinc-800 rounded-xl animate-pulse" />
                </div>
            </div>
        </div>

    )

}
