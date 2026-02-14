// FeaturedEventHero.jsx


import {useRef, useMemo} from 'react'
import {motion, useScroll, useTransform} from 'framer-motion'
import {Calendar, MapPin, ArrowRight} from 'lucide-react'

import {getImageUrl} from '../../utils/imageHelper'
import {stripHtml} from '../../utils/textHelper'


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
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
    // Smooth zoom out effect on scroll
    const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1])

    // We use a helper func. to help us fetch the images to be displayed in the event card.
    const posterUrl = getImageUrl(event.poster)

    const cleanDescription = useMemo(() => {

        return stripHtml(event.description)
    
    }, [event.description])

    return (

        // 'relative' : This is the parent container. We set this so that the text overlay (which is 'absolute') will adjust itself within the container.
        // 'overflow-hidden' : So that the image's rounded corners can be clipped.
        <div
            ref = {ref}
            className = "group relative w-full h-[85svh] min-h-[600px] overflow-hidden rounded-2xl md:rounded-[2rem] border border-zinc-800 bg-[#050505] cursor-pointer"
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
                        alt = {event.name}
                        loading = 'eager'
                        fetchPriority = 'high'
                        className = "h-full w-full object-cover transition-transform duration-700"
                    />
                ) : (
                    // Fallback for no image
                    <div className = "h-full w-full bg-[radial-gradient(ellipse_at_center, _var(--tw-gradient-stops))] from-zinc-800 via-zinc-950 to-black" />
                )}
            </motion.div>

            {/* Base tint - Lowers the brightness of the whole image*/}
            <div className = "absolute inset-0 bg-black/20 z-0 pointer-events-none" />

            {/* Gradient overlay - For the main text. Taller & smoother. */}
            <div className = "absolute inset-0 bg-gradient-to-t from-black via-black/80 via-30% to-transparent z-0 pointer-events-none" />
            
            {/* Glass badge */}
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
                    duration : 0.6,
                    delay : 0.2
                }}
                className = "absolute top-6 left-6 md:top-10 md:left-10 z-20"
            >
                <div className = "inline-flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 bg-black/40 backdrop-blur-md shadow-2xl">
                    <span className = "relative flex h-2 w-2">
                        <span className = "absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />

                        <span className = "relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
                    </span>

                    <span className = "font-mono text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-white/90">
                        Featured
                    </span>
                </div>
            </motion.div>

            {/* Content Layer */}
            <div className = "relative z-10 flex flex-col h-full justify-end px-6 md:px-12 lg:px-16 pb-8 md:pb-12 lg:pb-16 pt-32">
                <div className = "w-full max-w-[95rem]">
                    {/* Title */}
                    <div className = "overflow-hidden mb-6 md:mb-8">
                        <motion.h1
                            initial = {{y : '100%'}}
                            animate = {{y : 0}}
                            transition = {{
                                duration : 0.8,
                                ease : [0.22, 1, 0.36, 1]
                            }}
                            className = "text-balance text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black uppercase leading-[0.9] tracking-tighter text-white drop-shadow-2xl break-words"
                        >
                            {event.name}
                        </motion.h1>
                    </div>

                    {/* Description/Stats */}
                    <div className = "grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-8 md:gap-16 items-end">
                        <div className = 'space-y-6'>
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
                                    duration : 0.8,
                                    delay : 0.2,
                                }}
                                className = "line-clamp-3 md:line-clamp-4 max-w-2xl text-base md:text-lg lg:text-xl font-light leading-relaxed text-zinc-300"
                            >
                                {cleanDescription || "Experience the ultimate student gathering! Join us for an unforgettable experience!"}
                            </motion.p>

                            {/* Action area */}    
                            <motion.div
                                initial = {{opacity : 0}}
                                animate = {{opacity : 1}}
                                transition = {{
                                    duration : 0.8,
                                    delay : 0.4
                                }}
                                className = "flex flex-wrap items-center gap-6 text-xs font-bold uppercase tracking-widest text-zinc-400"
                            >
                                <div className = "flex items-center gap-2">
                                    <Calendar className = "h-4 w-4 text-orange-500" />

                                    <span>{new Date(event.start_date).toLocaleDateString(undefined, {month : 'long', day : 'numeric'})}</span>
                                </div>

                                <div className = "h-1 w-1 rounded-full bg-zinc-700" />

                                <div className = "flex items-center gap-2">
                                    <MapPin className = "h-4 w-4 text-pink-500" />

                                    <span className = "truncate max-w-[200px]">
                                        {event.location_type === 'online' 
                                            ? "Online Event"
                                            : (event.physical_location || "Location TBA")
                                        }
                                    </span>
                                </div>
                            </motion.div>
                        </div>
                        
                        <div className = "flex flex-col md:items-end">
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
                                    delay : 0.5
                                }}
                                className = "w-full md:w-auto"
                            >
                                <button
                                    onClick = {(e) => {
                                        e.stopPropagation()

                                        onRegisterClick(event)
                                    }}
                                    className = "group relative w-full md:w-auto overflow-hidden bg-white px-8 md:px-10 py-5 md:py-6 transition-transform active:scale-[0.98]"
                                >
                                    <div className = "relative z-10 flex items-center justify-center gap-3 font-bold uppercase tracking-[0.2em] text-black transition-colors duration-300 group-hover:text-white">
                                        <span>Secure Ticket</span>

                                        <ArrowRight className = "h-4 w-4" />
                                    </div>

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
