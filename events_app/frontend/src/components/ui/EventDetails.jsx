// EventDetails.jsx


import {useState} from 'react'
import DOMPurify from 'dompurify'
import {X, Calendar, MapPin, FileText, Clock, ExternalLink, AlertCircle} from 'lucide-react'

import {getImageUrl} from '../../utils/imageHelper'


export default function EventDetails({event, onClose, onRegisterClick}) {
    
    if (!event) return null

    const calculateTimeLeft = () => {
        if (!event.registration_deadline) {

            return {days : 0, hours : 0, minutes : 0, seconds : 0, total : 0}

        }

        const deadline =  new Date(event.registration_deadline)
        const now = new Date()
        const difference = deadline - now

        if (difference <= 0) {

            return {days : 0, hours : 0, minutes : 0, seconds : 0, total : 0}

        }

        return {
            days : Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours : Math.floor(difference / (1000 * 60 * 60) % 24),
            minutes : Math.floor((difference / 1000 / 60) % 60),
            seconds : Math.floor((difference / 1000) % 60),
            total : difference
        }
    }

    // Set this state immediately so it's never null after execution
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft())

    // Set closed state immediately after calculating time left
    const [isRegistrationClosed, setIsRegistrationClosed] = useState(
        (event.registration_deadline && new Date(event.registration_deadline) - new Date() <= 0)
            ? true
            : false
    )

    useState(() => {
        const timer = setInterval(() => {
            const newTime = calculateTimeLeft()

            setTimeLeft(newTime)

            // Update in real time
            if (newTime.total <= 0 && event.registration_deadline) {
                setIsRegistrationClosed(true)
            }
        }, 1000)

        return () => clearInterval(timer)
    }, [event])

    const posterUrl = getImageUrl(event.poster_field)

    const festiveGradient = "bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600"

    return (

        <div 
            className = "fixed inset-0 z-60 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-6 transition-all duration-300"
            onClick = {onClose}
        >
            <div 
                className = "bg-[#18181b] w-full max-w-3xl h-[85vh] md:h-auto md:max-h-[90vh] rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden relative animate-in slide-in-from-bottom-10 duration-300 border border-zinc-800 flex flex-col"
                onClick = {(e) => e.stopPropagation()}
            >
                {/* flex-1 & overflow-y-auto makes the footer sticky */}
                <div className = "flex-1 overflow-y-auto custom-scrollbar">
                    {/* Close button */}
                    <button
                        onClick = {onClose}
                        className = "absolute top-4 right-4 z-30 bg-black/40 hover:bg-zinc-800 text-white rounded-full p-2 border border-white/10 transition-all backdrop-blur-md"
                    >
                        <X className = "w-5 h-5" />
                    </button>

                    {/* Event Poster */}
                    <div className = "w-full h-56 md:h-80 overflow-hidden relative shrink-0">
                        {posterUrl ? (
                            <img 
                                src = {posterUrl}
                                alt = {event.event_name}
                                className = "w-full h-full object-cover"
                            />
                        ) : (
                            <div className = "w-full h-full bg-zinc-900 flex items-center justify-center">
                                <span className = "text-zinc-700 font-bold uppercase tracking-widest text-xs md:text-sm">
                                    No Poster Available
                                </span>
                            </div>
                        )}

                        {/* Gradient Fade */}
                        <div className = "absolute inset-0 bg-gradient-to-t from-[#18181b] via-[#18181b]/50 to-transparent" />

                        {/* Badge */}
                        <div className = "absolute top-6 left-6 z-20">
                            <span className = {`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white border border-white/10 backdrop-blur-md ${event.is_native ? 'bg-orange-500/20' : 'bg-zinc-800/80'}`}>
                                {event.is_native ? "Registration Open" : "External Event"}
                            </span>
                        </div> 
                    </div>

                    {/* Text Content */}
                    <div className = "px-5 md:px-10 pb-6">
                        {/* Title Section */}
                        <div className = "-mt-12 relative z-10 mb-8">
                            <h2 className = "text-3xl md:text-5xl font-black text-white mb-2 uppercase tracking-tighter leading-none drop-shadow-xl break-words">
                                {event.event_name}
                            </h2>

                            <p className = "text-zinc-400 font-medium flex flex-wrap items-center gap-2 text-sm md:text-base">
                                Hosted by <span className = "text-white border-b border-orange-500/50 pb-0.5">{event.organiser}</span>
                            </p>
                        </div>

                        {/* Info grid */}
                        <div className = "grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                            <div className = "bg-zinc-900/50 p-3 md:p-4 rounded-2xl border border-zinc-800 flex items-center gap-3">
                                <div className = "w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-orange-500 shrink-0">
                                    <Calendar className = "w-5 h-5" />
                                </div>

                                <div className = "min-w-0">
                                    <p className = "text-[10px] uppercase tracking-wide text-zinc-500 font-bold">
                                        Date & Time
                                    </p>

                                    <p className = "text-zinc-200 font-bold text-sm truncate">
                                        {event.start_date}
                                    </p>
                                </div>
                            </div>

                            <div className = "bg-zinc-900/50 p-3 md:p-4 rounded-2xl border border-zinc-800 flex items-center gap-3">
                                <div className = "w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-pink-500 shrink-0">
                                    <MapPin className = "w-5 h-5" />
                                </div>

                                <div className = "min-w-0 flex-1">
                                    <p className = "text-[10px] uppercase tracking-wide text-zinc-500 font-bold">
                                        Location
                                    </p>

                                    {event.google_maps_link ? (
                                        <a
                                            href = {event.google_maps_link}
                                            target = '_blank'
                                            rel = "noopener noreferrer"
                                            className = "group flex items-center gap-2 text-zinc-200 font-bold text-sm hover:text-pink-500 transition-colors w-full"
                                        >
                                            <span className = 'truncate'>
                                                {event.location}
                                            </span>

                                            <ExternalLink className = "w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
                                        </a>
                                    ) : (
                                        <p className = "text-zinc-200 font-bold text-sm truncate">
                                            {event.location}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className = 'mb-8'>
                            <h3 className = "text-lg font-bold text-white mb-3 flex items-center gap-2">
                                Event Details
                            </h3>

                            <div 
                                className = "prose prose-invert prose-sm max-w-none text-zinc-400 leading-relaxed"
                                dangerouslySetInnerHTML = {{
                                    __html : DOMPurify.sanitize(event.description)
                                }}
                            />
                        </div>

                        {/* Brochure */}
                        {event.brochure && (
                            <div className = 'mb-4'>
                                <h3 className = "text-lg font-bold text-white mb-3">
                                    Resources
                                </h3>

                                <a
                                    href = {event.brochure.startsWith('http') ? event.brochure : getImageUrl(event.brochure)}
                                    target = '_blank'
                                    rel = "noopener noreferrer"
                                    className = "flex items-center gap-3 p-3 bg-zinc-900 rounded-xl border-zinc-800 hover:border-zinc-600 transition-all group cursor-pointer no-underline"
                                >
                                    <div className = "bg-zinc-800 p-2.5 rounded-lg group-hover:bg-zinc-700 transition-colors">
                                        <FileText className = "w-5 h-5 text-zinc-300" />
                                    </div>

                                    <div className = "flex-1 min-w-0">
                                        <p className = "font-bold text-white text-sm group-hover:text-orange-500 transition-colors truncate">
                                            Event Brochure
                                        </p>

                                        <p className = "text-[10px] text-zinc-500">
                                            PDF Document
                                        </p>
                                    </div>

                                    <ExternalLink className = "w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sticky Footer Area */}
                <div className = "bg-[#18181b] border-t border-zinc-800 p-4 md:px-10 md:py-6 shrink-0 z-20 pb-safe">
                    {isRegistrationClosed ? (
                        <div className = "flex items-center justify-between gap-4">
                            <div className = "flex items-center gap-3 text-red-400">
                                <AlertCircle className = "w-5 h-5" />

                                <div>
                                    <p className = "font-bold text-sm">
                                        Registration Closed
                                    </p>

                                    <p className = "text-[10px] text-red-400/60">
                                        Deadline passed
                                    </p>
                                </div>
                            </div>

                            <button
                                disabled
                                className = "px-6 py-3 rounded-xl bg-zinc-800 text-zinc-500 font-bold text-sm cursor-not-allowed"
                            >
                                Closed
                            </button>
                        </div>
                    ) : (
                        <div className = "flex flex-col md:flex-row md:items-center justify-between gap-4">
                            {/* Timer Display */}
                            {timeLeft && (
                                <div className = "flex items-center justify-center md:justify-start gap-3 w-full md:w-auto">
                                    <div className = "p-2 bg-zinc-900 rounded-lg text-orange-500 shrink-0">
                                        <Clock className = "w-5 h-5" />
                                    </div>

                                    <div className = "flex gap-2 md:gap-3 text-center">
                                        {[
                                            {label : 'Days', val : timeLeft.days},
                                            {label : 'Hrs', val : timeLeft.hours},
                                            {label : 'Mins', val : timeLeft.minutes}
                                        ].map(item => (
                                            <div
                                                key = {item.label}
                                                className = 'min-w-[40px]'
                                            >
                                                <p className = "font-mono font-bold text-white text-lg leading-none">
                                                    {item.val}
                                                </p>

                                                <p className = "text-[9px] md:text-[10px] text-zinc-500 uppercase tracking-wider">
                                                    {item.label}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Register Button */}
                            <button
                                onClick = {() => onRegisterClick(event)}
                                className = {`w-full md:w-auto px-8 py-3.5 rounded-xl text-white font-black uppercase tracking-widest text-sm shadow-lg hover:shadow-orange-500/20 transition-transform active:scale-95 ${festiveGradient}`}
                            >
                                {event.is_native ? "Register Now" : "External Link"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>

    )

}
