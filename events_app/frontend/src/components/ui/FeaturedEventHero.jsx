// FeaturedEventHero.jsx


import {Sparkles, Calendar, ArrowRight, ImageOff} from 'lucide-react'

import {getImageUrl} from '../../utils/imageHelper'


const FeaturedEventHero = ({event, onRegisterClick, onDetailsClick}) => {

    // We use a helper func. to help us fetch the images to be displayed in the event card.
    const posterUrl = getImageUrl(event.poster_field)

    return (

        // 'relative' : This is the parent container. We set this so that the text overlay (which is 'absolute') will adjust itself within the container.
        // 'overflow-hidden' : So that the image's rounded corners can be clipped.
        <div 
            className = "group relative w-full h-[500px] md:h-[600px] rounded-3xl shadow-2xl shadow-purple-900/20 overflow-hidden border border-zinc-800 cursor-pointer"
            onClick = {() => onDetailsClick(event)}
        >
            {/* Background Image */}
            {/* "w-full h-96" sets a fixed height for the hero-section */}
            {/* 'object-cover' ensures that the image fills the container without stretching */}
            {/* 'opacity-50' makes the image semi-transparent so that the text can be placed on top of it */}
            <div className = "absolute inset-0 bg-zinc-900">
                {posterUrl ? (
                    <img
                        src = {posterUrl}
                        alt = {event.event_name}
                        className = "w-full h-full object-cover opacity-80 transition-transform duration-1000 ease-out group-hover:scale-105"
                    />
                ) : (
                    <div className = "w-full h-full flex flex-col items-center justify-center opacity-30">
                        <ImageOff className = "w-16 h-16 text-zinc-500 mb-4" />

                        <span className = "text-zinc-500 font-bold uppercase tracking-widest">
                            Featured Event
                        </span>
                    </div>
                )}
            </div>
            
            {/* Gradient Overlay - This gradient fades from transparent at the top to black at the bottom. It ensures the White text is readable regardless of the
            image brightness. */}
            <div className = "absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/60 to-transparent opacity-90"></div>

            {/* Text Overlay */}
            {/* "absolute top-0 left-0 w-full h-full" stretches the overlay to be the exact same size as the parent, sitting on top of the image.*/}
            {/* "flex flex-col justify-end" is a flex container that aligns all the text content to the bottom-left corner */}
            <div className = "absolute inset-0 p-6 md:p-12 flex flex-col justify-end items-start z-10">

                {/* Featured Badge */}
                <div className = "animate-in slide-in-from-bottom-4 fade-in duration-700 delay-100 mb-4">
                    <div className = "relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/80 backdrop-blur-md border border-transparent group-hover:border-orange-500/50 transition-all overflow-hidden">
                        <div className = "absolute inset-0 rounded-full p-[1px] bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 -z-10 opacity-70" />
                        
                        <Sparkles className = "w-3 h-3 text-orange-400 fill-orange-400" />

                        <span className = "text-xs font-bold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-orange-200 to-pink-200">
                            Premier Event
                        </span>
                    </div>
                </div>

                {/* Event Title */}
                <h1 className = "text-4xl md:text-7xl font-black text-white mb-4 uppercase tracking-tighter leading-[0.9] drop-shadow-lg max-w-4xl animate-in slide-in-from-bottom-4 fade-in duration-700 delay-200">
                    {event.event_name}
                </h1>

                {/* The event date */}
                <p className = "md:hidden text-sm text-gray-200 mb-4 font-mono">
                    {event.start_date}
                </p>
                
                {/* Metadata Row */}
                <div className = "hidden md:flex flex-wrap items-center gap-6 text-zinc-300 mb-8 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-300">
                    <div className = "flex items-center gap-2 text-base font-mono">
                        <Calendar className = "w-4 h-4 text-purple-400" />

                        <span className = "uppercase tracking-wide">
                            {event.start_date}
                        </span>
                    </div>

                    {/* Category Tags */}
                    <div className = "flex gap-2">
                        {event.categories && event.categories.slice(0, 2).map(cat => (
                            <span
                                key = {cat}
                                className = "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:text-white hover:border-purple-500/50 transition-colors"
                            >
                                {cat}
                            </span>
                        ))}
                    </div>
                </div>
                
                {/* Action Button */}
                <button
                    onClick = {(e) => {
                        e.stopPropagation() 
                        onRegisterClick(event)
                    }}
                    className = "group/btn relative px-8 py-4 bg-white text-black rounded-xl font-bold uppercase tracking-widest text-sm md:text-base shadow-[0_0_20px_rgba(168, 85, 247, 0.2)] hover:shadow-[0_0_30px_rgba(249, 115, 22, 0.4)] hover:bg-gradient-to-r hover:from-white hover:to-orange-50 transition-all active:scale-95 flex items-center gap-3 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-500"
                >
                    Register Now

                    <ArrowRight className = "w-4 h-4 text-orange-600 transition-transform group-hover/btn:translate-x-1" />
                </button>
            </div>
        </div>
        
    )

}


export default FeaturedEventHero
