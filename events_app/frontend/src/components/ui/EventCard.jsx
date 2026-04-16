// EventCard.jsx


import {Calendar, ExternalLink, ImageOff, IndianRupee, Laptop, MapPin, Ticket, User} from 'lucide-react'

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

    return (

        <article
            className = "group relative h-full flex flex-col overflow-hidden rounded-[20px] bg-[#0c0c0e] border border-zinc-800/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-orange-900/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 cursor-pointer"
            onClick = {() => onDetailsClick(event)}
            onKeyDown = {handleKeyDown}
            role = 'button'
            tabIndex = '0'
        >
            {/* Poster section */}
            <div className = "relative aspect-[4/5] w-full overflow-hidden bg-zinc-900">
                {posterUrl ? (
                    <img
                        src = {posterUrl}
                        alt = {event.name}
                        loading = 'lazy'
                        decoding = 'async'
                        className = "h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <div className = "flex h-full w-full flex-col items-center justify-center gap-2 bg-zinc-900/50 text-zinc-700">
                        <ImageOff className = "h-8 w-8 opacity-40" />

                        <span className = "font-mono text-xs uppercase tracking-widest opacity-60">
                            No Poster
                        </span>
                    </div>
                )}

                <div className = "absolute inset-0 bg-gradient-to-t from-[#0c0c0e] via-[#0c0c0e]/80 via-15% to-transparent pointer-events-none" />

                {/* Badges container */}
                <div className = "absolute top-3 right-3 flex flex-col items-end gap-2 z-50">
                    {/* Date badge */}
                    <div className = "flex items-center gap-2 rounded-lg border border-white/10 bg-black/60 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md">
                        <Calendar className = "h-3 w-3 text-orange-500" />

                        {formatDate(event.start_date)}
                    </div>

                    {/* Price badge */}
                    {event.is_paid_event && (
                        <div className = "flex items-center gap-1 rounded-md border border-emerald-400/20 bg-emerald-950/80 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-md">
                            <IndianRupee className = "h-2.5 w-2.5 text-emerald-400" />

                            {event.ticket_price}
                        </div>
                    )}

                    {scarcity && (
                        <span
                            className = {`
                                inline-flex items-center rounded-md border px-2 py-1 text-[9px] font-black uppercase tracking-widest shadow-lg
                                ${scarcityStyles[scarcity.status] || ''}
                            `}
                        >
                            {scarcity.text}
                        </span>
                    )}
                </div>

                {/* Details section */}
                <div className = "absolute bottom-0 left-0 w-full p-4 z-20">
                    {/* Categories */}
                    <div className = "mb-2 flex flex-wrap gap-1.5">
                        {event.categories?.slice(0, 2).map((category) => (
                            <span
                                key = {category.id}
                                className = "rounded-[4px] border border-zinc-700 bg-black/50 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-zinc-300 backdrop-blur-sm"
                            >
                                {category.name}
                            </span>
                        ))}
                    </div>

                    {/* Title */}
                    <h3 className = "line-clamp-2 text-lg font-black leading-tight text-white tracking-tight group-hover:text-orange-500 transition-colors drop-shadow-md">
                        {event.name}
                    </h3>
                    
                    <p className = "mt-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-zinc-400">
                        <User className = "h-3 w-3 shrink-0 text-zinc-500" />

                        <span className = 'truncate'>
                            By {event.host?.name || 'Unknown'}
                        </span>
                    </p>
                </div>
            </div>

            <div className = "flex flex-col p-4 pt-2">
                <div className = "mb-4 flex items-center gap-1.5 text-xs text-zinc-400">
                    <MapPin className = "h-3.5 w-3.5 shrink-0 text-pink-500" />

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

                <div className = 'mt-auto'>
                    {event.is_native ? (
                        <button
                            onClick = {(e) => {
                                e.stopPropagation()

                                if (!event.is_sold_out && event.is_registration_open) onRegisterClick(event)
                            }}
                            disabled = {event.is_sold_out || !event.is_registration_open}
                            className = {`
                                group/btn flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all
                                ${(event.is_sold_out || !event.is_registration_open)
                                    ? "bg-zinc-900 text-zinc-500 cursor-not-allowed border border-zinc-800"
                                    : "bg-white text-black hover:bg-zinc-200 hover:scale-[0.98]"
                                }
                            `}
                        >
                            <Ticket
                                className = {`
                                    h-4 w-4
                                    ${(event.is_sold_out || !event.is_registration_open)
                                        ? 'text-zinc-600'
                                        : "text-orange-600 group-hover/btn:-rotate-12 transition-transform"
                                    }
                                `}
                            />

                            {event.is_sold_out
                                ? "Sold Out"
                                : (!event.is_registration_open ? 'Closed' : 'Register')
                            }
                        </button>
                    ) : (
                        <a
                            href = {event.register_link}
                            target = '_blank'
                            rel = "noopener noreferrer"
                            onClick = {(e) => e.stopPropagation()}
                            className = "flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 text-xs font-bold uppercase tracking-widest text-zinc-300 transition-all hover:bg-zinc-700 hover:text-white active:scale-95"
                        >
                            External <ExternalLink className = "h-3 w-3" />
                        </a>
                    )}
                </div>
            </div>
        </article>

    )
    
}


export default EventCard
