// EventDetailBottomSheet.jsx

import React from 'react'
import DOMPurify from 'dompurify'


const API_BASE_URL = import.meta.env.VITE_API_URL


export default function EventDetailBottomSheet({event, onClose, onRegisterClick}) {
    
    if (!event) return null

    const posterUrl = event.poster_image
                        ? `${API_BASE_URL}${event.poster_image}`
                        : null;

    return (
        <div
            className = "fixed inset-0 z-40 flex items-end justify-center bg-black bg-opacity-75 backdrop-blur-sm"
            onClick = {onClose}
        >
            <div
                className = "bg-[#eae5dc] rounded-t-xl md:rounded-t-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] md:max-h-[85vh] overflow-y-auto relative animate-slide-up"
                onClick = {(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick = {onClose}
                    className = "absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/40 rounded-full p-3 md:p-2 text-[#6f2d37] font-bold transition-colors"
                >
                    <svg 
                        xmlns = "http://www.w3.org/2000/svg"
                        className = "h-5 w-5 md:h-6 md:w-6"
                        fill = 'none'
                        viewBox = "0 0 24 24"
                        stroke = 'currentColor'
                    >
                        <path
                            strokeLinecap = 'round'
                            strokeLinejoin = 'round'
                            strokeWidth = '2'
                            d = "M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>

                {/* Hero Image */}
                {posterUrl && (
                    <div className = "w-full h-48 md:h-64 overflow-hidden relative">
                        <img 
                            src = {posterUrl}
                            alt = {event.event_name}
                            className = "w-full h-full object-cover"
                        />

                        <div className = "absolute inset-0 bg-gradient-to-t from-[#eae5dc] to-transparent"></div>
                    </div>
                )}

                {/* Content Container */}
                <div className = "p-6 md:p-8">
                    {/* Header */}
                    <div className = "mb-6">
                        <span className = "inline-block bg-[#c90000]/10 text-[#c90000] text-[10px] md:text-xs font-bold px-3 py-1 rounded-full mb-2 md:mb-3 uppercase tracking-wider">
                            {event.is_native ? "Registration Open" : "External Event"}
                        </span>

                        {/* Title */}
                        <h2 className = "text-3xl md:text-4xl font-black text-[#6f2d37] mb-1 md:mb-2 font-outfit leading-tight">
                            {event.event_name}
                        </h2>

                        <p className = "text-base md:text-lg text-[#6f2d37]/70 font-medium">
                            Hosted by {event.organiser}
                        </p>

                        {/* Key Details Grid */}
                        <div className = "grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
                            <div className = "bg-white/50 p-3 md:p-4 rounded-xl border border-[#6f2d37]/10 flex flex-col justify-center">
                                <p className = "text-[10px] md:text-xs uppercase tracking-wide text-[#6f2d37]/60 font-bold mb-1">
                                    Date & Time
                                </p>
                                <p className = "text-sm md:text-base text-[#6f2d37] font-semibold">
                                    {event.start_date}
                                </p>
                            </div>
                            <div className = "bg-white/50 p-3 md:p-4 rounded-xl border border-[#6f2d37]/10 flex flex-col justify-center">
                                <p className = "text-[10px] md:text-xs uppercase tracking-wide text-[#6f2d37]/60 font-bold mb-1">
                                    Location
                                </p>
                                <p className = "text-sm md:text-base text-[#6f2d37] font-semibold">
                                    {event.location}
                                </p>
                            </div>
                        </div>

                        {/* Description */}
                        <div className = "prose prose-sm md:prose-base prose-red max-w-none mb-8 md:mb-10 text-[#6f2d37]/80 leading-relaxed">
                            <h3 className = "text-lg md:text-xl font-bold text-[#6f2d37] mb-2 md:mb-3">
                                About the Event
                            </h3>

                            <div className = "mb-10 text-[#6f2d37]/80 leading-relaxed">
                                <h3 className = "text-xl font-bold text-[#6f2d37] mb-3">
                                    About the Event
                                </h3>

                                <div 
                                    className = "prose prose-red max-w-none"
                                    dangerouslySetInnerHTML = {{
                                        __html : DOMPurify.sanitize(event.description) // Tells React "I know what I'm doing, render it as actual HTML code". It also 
                                                                                        // ensures that if someone tries to inject some suspicious script, it'll be
                                                                                        // stripped out. 
                                    }}
                                />
                            </div>
                        </div>

                        {/* Sticky Action Button */}
                        <div className = "sticky bottom-0 bg-[#eae5dc] pt-2 pb-2 md:pt-4">
                            <button
                                onClick = {() => onRegisterClick(event)}
                                className = "w-full py-3 md:py-4 rounded-xl text-white font-bold text-base md:text-lg shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
                                style = {{backgroundColor : '#c90000'}}
                            >
                                {event.is_native ? "Register Now" : "Open Registration Page"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )

}
