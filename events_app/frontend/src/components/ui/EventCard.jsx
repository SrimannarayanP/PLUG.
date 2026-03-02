// EventCard.jsx


import {Calendar, MapPin, User, Ticket, ExternalLink, ImageOff, Laptop, IndianRupee} from 'lucide-react'

import {getImageUrl} from '../../utils/imageHelper'
import {getScarcityState} from '../../utils/ticketHelper'


const formatDate = (dateString) => {
    if (!dateString) return 'TBA'
    
    return new Date(dateString).toLocaleDateString('en-US', {
        month : 'short',
        day : 'numeric'
    })
}


const EventCard = ({event, onRegisterClick, onDetailsClick}) => {

    const posterUrl = getImageUrl(event.poster)
    const scarcity = getScarcityState(event)

    const festiveGradient = "bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600"
    const scarcityStyles = {
        SOLD_OUT : "bg-red-500/20 text-red-400 border-red-500/30",
        CRITICAL : "bg-orange-500/20 text-orange-400 border-orange-500/30",
        WARNING : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()

            onDetailsClick(event)
        }
    }

    const getLocationDisplay = () => {
        if (event.location_type === 'online') {

            return (

                <span className = "flex items-center gap-1 truncate">
                    <Laptop className = "w-3 h-3" />

                    <span className = 'truncate'>
                        {event.virtual_location || "Online Event"}
                    </span>
                </span>

            )

        }

        return (

            <span className = 'truncate'>
                {event.physical_location || "Venue TBA"}
            </span>

        )
    }

    return (

        <article
            className = "group relative h-full flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-orange-900/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            onClick = {() => onDetailsClick(event)}
            onKeyDown = {handleKeyDown}
            role = 'button'
            tabIndex = '0'
        >
            {/* Hover gradient border effect */}
            <div className = {`absolute inset-0 pointer-events-none rounded-2xl ${festiveGradient} opacity-0 transition-opacity duration-500 group-hover:opacity-100`} />

            <div className = "absolute inset-[1px] rounded-2xl bg-zinc-950 pointer-events-none" />

            {/* Content container */}
            <div className = "relative z-10 flex flex-col h-full">
                {/* Image section */}
                <div className = "relative aspect-video w-full overflow-hidden border-b border-zinc-800 bg-zinc-900">
                    {posterUrl ? (
                        <img 
                            src = {posterUrl}
                            alt = {event.name}
                            loading = 'lazy'
                            decoding = 'async'
                            className = "h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                    ) : (
                        <div className = "flex h-full w-full flex-col items-center justify-center gap-2 bg-zinc-900/50 text-zinc-700">
                            <ImageOff className = "h-8 w-8 opacity-40" />

                            <span className = "font-mono text-xs uppercase tracking-widest opacity-60">
                                No Poster
                            </span>
                        </div>
                    )}

                    {scarcity && (
                        <div className = "absolute top-3 left-3 z-20">
                            <span className = {`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${scarcityStyles[scarcity.status] || ''}`}>
                                {scarcity.text}
                            </span>
                        </div>
                    )}

                    {/* Badges container */}
                    <div className = "absolute top-3 right-3 flex flex-col items-end gap-2">
                        {/* Date badge */}
                        <div className = "flex items-center gap-2 rounded-lg border border-white/10 bg-black/70 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md">
                            <Calendar className = "h-3 w-3 text-orange-500" />

                            {formatDate(event.start_date)}
                        </div>

                        {/* Price badge */}
                        {event.is_paid_event && (
                            <div className = "flex items-center gap-1 rounded-md border border-emerald-400/20 bg-emerald-950/80 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-md">
                                <IndianRupee className = "h-3 w-3 text-emerald-400" />

                                {event.ticket_price}
                            </div>
                        )}
                    </div>
                </div>

                {/* Details section */}
                <div className = "flex flex-1 flex-col p-4 sm:p-5">
                    {/* Categories */}
                    <div className = "mb-3 flex flex-wrap gap-2">
                        {event.categories?.slice(0, 3).map((category) => (
                            <span
                                key = {category.id}
                                className = "rounded-md border border-zinc-800 bg-zinc-900/50 px-2 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400"
                            >
                                {category.name}
                            </span>
                        ))}
                    </div>

                    {/* Title */}
                    <h3 className = "mb-2 line-clamp-1 text-base font-bold text-white transition-colors group-hover:text-orange-500 sm:text-lg">
                        {event.name}
                    </h3>

                    <div className = "mb-4 flex flex-col gap-2 text-xs text-zinc-400 sm:flex-row sm:items-center sm:gap-4">
                        <p className = "flex items-center gap-1.5 truncate">
                            <User className = "h-3 w-3 shrink-0 text-zinc-500" />

                            <span className = 'truncate'>
                                By {event.organisation?.name || 'Unknown'}
                            </span>
                        </p>

                        <div className = "flex items-center gap-1.5 truncate">
                            <MapPin className = "h-3 w-3 shrink-0 text-zinc-500" />

                            {event.location_type === 'online' ? (
                                <span className = "flex items-center gap-1 truncate">
                                    <Laptop className = "h-3 w-3" />

                                    {event.virtual_location || 'Online'}
                                </span>
                            ) : (
                                <span className = 'truncate'>
                                    {event.physical_location || 'TBA'}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Action button */}
                    <div className = "mt-auto pt-4">
                        {event.is_native ? (
                            <button
                                onClick = {(e) => {
                                    e.stopPropagation()

                                    if (!event.is_sold_out) onRegisterClick(event)
                                }}
                                className = {`
                                    group/btn flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-bold uppercase tracking-wider shadow-lg transition-all
                                    ${event.is_sold_out
                                        ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50"
                                        : "bg-white text-black hover:bg-zinc-200 hover:shadow-white/10 active:scale-95"
                                    }
                                `}
                            >
                                <Ticket 
                                    className = {`
                                        h-4 w-4
                                        ${event.is_sold_out
                                            ? 'text-zinc-600'
                                            : "text-orange-600 transition-transform group-hover/btn:rotate-12"
                                        }
                                    `}
                                />

                                {event.is_sold_out ? "Sold Out" : 'Register'}
                            </button>
                        ) : (
                            <a
                                href = {event.register_link}
                                target = '_blank'
                                rel = "noopener noreferrer"
                                onClick = {(e) => e.stopPropagation()}
                                className = "flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 text-sm font-bold uppercase tracking-wider text-zinc-300 transition-all hover:bg-zinc-700 hover:text-white active:scale-95"
                            >
                                Register

                                <ExternalLink className = "h-3 w-3" />
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </article>

    )
    
}


export default EventCard
