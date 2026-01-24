// EventDetailSkeleton.jsx
// Mirrors EventDetail


export default function EventDetailSkeleton() {

    return (

        <div className = "min-h-screen bg-[#09090b] text-white">
            {/* Banner image skeleton */}
            <div className = "h-[40vh] bg-zinc-900 animate-pulse w-full relative">
                <div className = "absolute -bottom-16 left-0 right-0 max-w-4xl mx-auto px-6">
                    {/* Floating title card skeleton */}
                    <div className = "bg-[#18181b] p-8 rounded-3xl border border-zinc-800 shadow-2xl space-y-4">
                        <div className = "h-8 w-3/4 bg-zinc-800 rounded animate-pulse" />
                        <div className = "h-4 w-1/2 bg-zinc-800 rounded animate-pulse" />
                    </div>
                </div>
            </div>

            {/* Content body skeleton */}
            <div className = "max-w-4xl mx-auto px-6 pt-24 grid grid-cols-1 md:grid-cols-3 gap-12">
                {/* Left: Description */}
                <div className = "md:col-span-2 space-y-4">
                    <div className = "h-4 w-full bg-zinc-800 rounded animate-pulse" />
                    <div className = "h-4 w-full bg-zinc-800 rounded animate-pulse" />
                    <div className = "h-4 w-2/3 bg-zinc-800 rounded animate-pulse" />
                </div>

                {/* Right: Sidebar/Ticket Box */}
                <div className = 'space-y-6'>
                    <div className = "h-64 bg-zinc-800 rounded-2xl animate-pulse" />
                </div>
            </div>
        </div>

    )

}
