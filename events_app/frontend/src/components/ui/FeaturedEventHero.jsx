// FeaturedEventHero.jsx


import {useRef} from 'react'
import {motion, useScroll, useTransform} from 'framer-motion'

import {getImageUrl} from '../../utils/imageHelper'


export default function FeaturedEventHero({event, onRegisterClick, onDetailsClick}) {

    const ref = useRef(null)
    // Parallax logic: Tracks the scroll progress of this component
    const {scrollYProgress} = useScroll({
        target : ref,
        offset : ["start start", "end start"]
    })

    // Moves the background down at 50% speed of scroll
    const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
    // Reduces the opacity as you scroll more
    const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])
    // Smooth zoom out effect on scroll
    const scale = useTransform(scrollYProgress, [0, 1], [1.1, 1])

    // We use a helper func. to help us fetch the images to be displayed in the event card.
    const posterUrl = getImageUrl(event.poster_field)

    const stripHtml = (html) => {
        if (!html) return ''

        const tmp = document.createElement('DIV')

        tmp.innerHTML = html

        return tmp.textContent || tmp.innerText || ''

    }

    const cleanDescription = stripHtml(event.description)

    return (

        // 'relative' : This is the parent container. We set this so that the text overlay (which is 'absolute') will adjust itself within the container.
        // 'overflow-hidden' : So that the image's rounded corners can be clipped.
        <div
            ref = {ref}
            className = "group relative w-full h-[80vh] md:h-[90vh] overflow-hidden rounded-2xl md:rounded-[2rem] border border-zinc-800 bg-[#050505] cursor-pointer"
            onClick = {() => onDetailsClick(event)}
        >
            {/* Background Image */}
            {/* "w-full h-96" sets a fixed height for the hero-section */}
            {/* 'object-cover' ensures that the image fills the container without stretching */}
            {/* 'opacity-50' makes the image semi-transparent so that the text can be placed on top of it */}
            <motion.div 
                style = {{
                    y, 
                    opacity,
                    scale
                }}
                className = "absolute inset-0 z-0"
            >
                {posterUrl ? (
                    <motion.img
                        src = {posterUrl}
                        alt = {event.event_name}
                        className = "w-full h-full object-cover"
                        initial = {{scale : 1.15}}
                        animate = {{scale : 1}}
                        transition = {{
                            duration : 3,
                            ease : [0.22, 1, 0.36, 1]
                        }}
                    />
                ) : (
                    // Fallback for no image
                    <div className = "w-full h-full bg-[radial-gradient(ellipse_at_center, _var(--tw-gradient-stops))] from-zinc-800 via-zinc-950 to-black" />
                )}
            </motion.div>

            {/* Base tint - Lowers the brightness of the whole image*/}
            <div className = "absolute inset-0 bg-black/40 z-0 pointer-events-none" />

            {/* Gradient overlay - For the main text. Taller & smoother. */}
            <div className = "absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/90 via-25% to-transparent z-0 pointer-events-none" />

            {/* Vignette - Darkens corners to focus attention */}
            <div className = "absolute inset-0 bg-[radial_gradient(circle_at_center, transparent_0%, rgba(0, 0, 0, 0.4)_100%)] z-0 pointer-events-none " />
            
            {/* Glass badge */}
            <div className = "absolute top-6 left-6 md:top-10 md:left-10 z-20">
                <motion.div
                    initial = {{
                        y : -20,
                        opacity : 0
                    }}
                    animate = {{
                        y : 0,
                        opacity : 1
                    }}
                    transition = {{
                        duration : 1,
                        delay : 0.5
                    }}
                    className = "inline-flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 bg-black/40 backdrop-blur-md shadow-2xl"
                >
                    <span className = "relative flex h-2 w-2">
                        <span className = "animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />

                        <span className = "relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
                    </span>

                    <span className = "text-white/90 font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold">
                        Featured
                    </span>
                </motion.div>
            </div>

            {/* Content Layer */}
            <div className = "relative z-10 flex flex-col h-full justify-end px-6 pb-8 pt-32 md:px-12 md:pb-12 lg:px-16 lg:pb-16">
                <div className = "max-w-[90rem] w-full">
                    {/* Title */}
                    <div className = "overflow-hidden -ml-1 mb-4 md:mb-6">
                        <motion.h1
                            initial = {{y : '110%'}}
                            animate = {{y : 0}}
                            transition = {{
                                duration : 1,
                                delay : 0.1,
                                ease : [0.22, 1, 0.36, 1]
                            }}
                            className = "text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-white uppercase tracking-tighter leading-[0.85] break-words hyphens-auto mix-blend-screen drop-shadow-2xl"
                        >
                            {event.event_name}
                        </motion.h1>
                    </div>

                    {/* Description/Stats */}
                    <div className = "grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-8 md:gap-16 items-end">
                        {/* Description */}
                        <motion.p
                            initial = {{
                                opacity : 0, 
                                y : 20
                            }}
                            animate = {{
                                opacity : 1,
                                y : 0
                            }}
                            transition = {{
                                duration : 1,
                                delay : 0.3,
                            }}
                            className = "text-zinc-400 text-sm md:text-lg lg:text-xl font-light leading-relaxed max-w-xl line-clamp-3 md:line-clamp-4"
                        >
                            {cleanDescription || "Experience the ultimate student gathering! Join us for an unforgettable experience!"}
                        </motion.p>

                        {/* Action area */}
                        <div className = "flex flex-col md:items-end gap-6">    
                            <motion.div
                                initial = {{opacity : 0}}
                                animate = {{opacity : 1}}
                                transition = {{
                                    duration : 1,
                                    delay : 0.5
                                }}
                                className = "flex flex-wrap items-center gap-4 md:gap-8 text-xs font-mono text-zinc-500 uppercase tracking-widest"
                            >
                                <span className = "text-zinc-300 border-b border-zinc-800 pb-1">
                                    {new Date(event.start_date).toLocaleDateString()}
                                </span>

                                <span className = "text-zinc-300 border-b border-zinc-800 pb-1">
                                    {event.location_type === 'online' 
                                        ? "Online Event"
                                        : (event.physical_location || "Location TBA")
                                    }
                                </span>
                            </motion.div>

                            {/* Action buttons */}
                            <motion.div
                                initial = {{
                                    opacity : 0,
                                    y : 20
                                }}
                                animate = {{
                                    opacity : 1,
                                    y : 0
                                }}
                                transition = {{
                                    duration : 0.8,
                                    delay : 0.6
                                }}
                                className = "w-full md:w-auto"
                            >
                                <button
                                    onClick = {(e) => {
                                        e.stopPropagation()

                                        onRegisterClick(event)
                                    }}
                                    className = "group relative w-full md:w-auto px-8 py-4 md:px-12 md:py-6 bg-white text-black overflow-hidden active:scale-[0.98] transition-transform duration-200"
                                >
                                    <span className = "relative z-10 font-bold uppercase tracking-[0.2em] text-xs md:text-sm group-hover:text-white transition-colors duration-300">
                                        Secure Ticket
                                    </span>

                                    {/* Diagonal slide effect */}
                                    <div className = "absolute inset-0 bg-orange-600 transform translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[0.22, 1, 0.36, 1]" />
                                </button>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
    )

}
