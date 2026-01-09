// EventCard.jsx


import {Calendar, MapPin, User, Ticket, ExternalLink, ImageOff} from 'lucide-react'

import {getImageUrl} from '../../utils/imageHelper'


const EventCard = ({event, onRegisterClick, onDetailsClick}) => {

    const posterUrl = getImageUrl(event.poster_field)

    const festiveGradient = "from orange-500 via-pink-500 to-purple-600"

    return (

        <div
            onClick = {() => onDetailsClick(event)} 
            className = "group relative bg-[#18181b] border border-zinc-800 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-pointer h-full"
        >
            {/* Hover gradient border effect */}
            <div className = {`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl bg-gradient-to-r ${festiveGradient} -z-10 p-[1px]`}>
                <div className = "w-full h-full bg-[#18181b] rounded-2xl" />
            </div>

            {/* Image section */}
            <div className = "h-48 w-full overflow-hidden relative bg-zinc-900 border-b border-zinc-800">
                {posterUrl ? (
                    // If an image exists, render it
                    <img 
                        src = {posterUrl}
                        alt = {event.event_name}
                        className = "w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                ) : (
                    // Fallback for events with no image
                    <div className = "w-full h-full flex flex-col items-center justify-center text-zinc-700 gap-2">
                        <ImageOff className = "w-8 h-8 opacity-50" />

                        <span className = "text-xs font-mono uppercase tracking-widest opacity-50">No Poster</span>
                    </div>
                )}

                <div className = "absolute top-3 right-3 bg-black/70 backdrop-blur-md border border-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-2">
                    <Calendar className = "w-3 h-3 text-orange-500" />

                    {new Date(event.start_date).toLocaleDateString(undefined, {month : 'short', day : 'numeric'})}
                </div>
            </div>

            {/* Content section */}
            {/* 'flex-1' ensures this section expands to fill remaining space */}
            {/* "flex flex-col" ensures that button is placed at the bottom */}
            <div className = "p-5 flex flex-col justify-between flex-1 relative z-10 bg-[#18181b]">
                {/* Top half of the content */}
                <div>
                    {/* Categories */}
                    <div className = "flex flex-wrap gap-2 mb-3">
                        {event.categories.map((category) => (
                            <span
                                key = {category}
                                className = "inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border border-zinc-800 bg-zinc-900 text-zinc-400 group-hover:border-zinc-700 transition-colors"
                            >
                                {category}
                            </span>
                        ))}
                    </div>

                    {/* Event name */}
                    <h3 className = "text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-pink-500 transition-all">
                        {event.event_name}
                    </h3>

                    {/* Organiser name */}
                    <p className = "text-xs text-zinc-500 mb-4 flex items-center gap-1.5">
                        <User className = "w-3 h-3" />

                        Hosted by
                        <span className = "font-medium text-zinc-300">
                            {event.organiser || 'Unknown'}
                        </span>
                    </p>

                    {/* Location */}
                    <div className = "flex items-start gap-2 text-xs text-zinc-400 mb-6">
                        <MapPin className = "w-3 h-3 mt-0.5 text-zinc-500" />

                        <span className = 'line-clamp-1'>
                            {event.location || 'TBA'}
                        </span>
                    </div>
                </div>

                {/* Button section */}
                <div className = "mt-auto pt-4 border-t border-zinc-800/50">
                    {event.is_native ? (
                        <button
                            onClick = {(e) => {
                                e.stopPropagation();
                                onRegisterClick(event);
                            }}
                            className = "w-full px-4 py-3 rounded-xl bg-white text-black text-sm font-bold uppercase tracking-wider hover:bg-zinc-200 transition-colors duration-200 flex items-center justify-center gap-2 group/btn"
                        >
                            <Ticket className = "w-4 h-4 text-orange-600 transition-transform group-hover/btn:rotate-12" />

                            Register Now
                        </button>
                    ) : (
                        <a
                            href = {event.register_link}
                            target = '_blank'
                            rel = "noopener noreferrer"
                            onClick = {(e) => e.stopPropagation()}
                            className = "w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm font-bold uppercase tracking-wider hover:bg-zinc-700 hover:text-white transition-colors duration-200 flex items-center justify-center gap-2"
                        >
                            Register

                            <ExternalLink className = "h-3 w-3" />
                        </a>
                    )}
                </div>
            </div>
        </div>

    )
    
}


export default EventCard
