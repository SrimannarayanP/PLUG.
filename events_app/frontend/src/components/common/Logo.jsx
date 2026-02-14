// Logo.jsx


import {useId} from 'react'


export default function Logo({className = "h-8 w-8 md:h-10 md:w-10", showText = true, textSize = "text-2xl md:text-3xl"}) {

    const gradientId = useId()

    return (

        <div className = "flex items-center gap-2.5 md:gap-3 select-none">
            <div className = {`relative ${className} flex-shrink-0`}>
                {/* Outer glow */}
                <div className = "absolute inset-0 bg-gradient-to-br from-orange-500 to-pink-600 rounded-xl blur-lg opacity-40 animate-pulse" />

                {/* Main shape */}
                <div className = "relative h-full w-full bg-[#09090b] border border-zinc-700 rounded-xl overflow-hidden flex items-center justify-center shadow-2xl">
                    {/* Inner gradient */}
                    <div className = "absolute inset-0 bg-gradient-to-br from-orange-500/20 to-pink-600/20" />

                    <svg
                        viewBox = "0 0 24 24"
                        className = "h-2/3 w-2/3 drop-shadow-md"
                        fill = 'none'
                        stroke = {`url(#${gradientId})`}
                        strokeWidth = '3.5'
                        strokeLinecap = 'round'
                        strokeLinejoin = 'round'
                    >
                        <defs>
                            <linearGradient
                                id = {gradientId}
                                x1 = '0'
                                y1 = '0'
                                x2 = '100%'
                                y2 = '100%'
                            >
                                <stop
                                    offset = '0%'
                                    stopColor = '#f97316'
                                />

                                <stop 
                                    offset = '100%'
                                    stopColor = '#db2777'
                                />
                            </linearGradient>
                        </defs>

                        <path d = "M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                </div>
            </div>

            {/* Text */}
            {showText && (
                <h1 className = {`${textSize} font-black text-white uppercase tracking-tighter leading-none`}>
                    PLUG

                    <span className = 'text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-600'>.</span>
                </h1>
            )}
        </div>

    )

}
