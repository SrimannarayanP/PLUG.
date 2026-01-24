// HostAttendeeTableSkeleton.jsx


export default function HostAttendeeTableSkeleton() {

    return (

        <div className = "w-full text-left border-collapse">
            {/* Table header */}
            <div className = "bg-zinc-900/50 border-b border-zinc-800 grid grid-cols-5 p-4 gap-4">
                {[...Array(5).map((_, i) => (
                    <div 
                        key = {i}
                        className = "h-4 bg-zinc-800 rounded animate-pulse w-24"
                    />
                ))]}
            </div>

            {/* Table rows */}
            <div className = "divide-y divide-zinc-800">
                {[...Array(5).map((_, i) => (
                    <div
                        key = {i}
                        className = "grid grid-cols-5 p-4 gap-4 items-center"
                    >
                        {/* Name column */}
                        <div className = 'space-y-2'>
                            <div className = "h-4 bg-zinc-800 rounded animate-pulse w-32" />
                            <div className = "h-3 bg-zinc-800/50 rounded animate-pulse w-40" />
                        </div>

                        {/* Status column */}
                        <div>
                            <div className = "h-6 bg-zinc-800 rounded-full animate-pulse w-24" />
                        </div>

                        {/* Contact column */}
                        <div className = 'space-y-2'>
                            <div className = "h-3 bg-zinc-800 rounded animate-pulse w-28" />
                            <div className = "h-3 bg-zinc-800 rounded animate-pulse w-20" />
                        </div>

                        {/* Transaction ID */}
                        <div>
                            <div className = "h-5 bg-zinc-800 rounded animate-pulse w-16" />
                        </div>

                        {/* Actions column */}
                        <div className = "flex justify-end gap-2">
                            <div className = "h-8 bg-zinc-800 rounded-lg animate-pulse w-20" />
                            <div className = "h-8 bg-zinc-800 rounded-lg animate-pulse w-16" />
                        </div>
                    </div>
                ))]}
            </div>
        </div>

    )

}
