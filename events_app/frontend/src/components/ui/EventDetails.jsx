// EventDetails.jsx


import DOMPurify from 'dompurify'
import {AlertCircle, Calendar, Clock, Download, ExternalLink, FileText, Laptop, MapPin, Mail, Phone, TicketIcon, User, X} from 'lucide-react'
import {useEffect, useState} from 'react'

import apiPublic from '../../api/apiPublic'

import {getImageUrl} from '../../utils/imageHelper'
import {getScarcityState} from '../../utils/ticketHelper'


const CountdownTimer = ({deadline, onExpire}) => {
    const [timeLeft, setTimeLeft] = useState({
        days : 0,
        hours : 0, 
        minutes : 0
    })

    useEffect(() => {
        const calculate = () => {
            const diff = new Date(deadline) - new Date()

            if (diff <= 0) {
                onExpire()

                return {days : 0, hours : 0, minutes : 0}
            }

            return {

                days : Math.floor(diff / (1000 * 60 * 60 *24)),
                hours : Math.floor((diff / (1000 * 60 * 60)) % 24),
                minutes : Math.floor((diff / 1000 / 60) % 60)
            
            }
        }

        setTimeLeft(calculate())

        const timer = setInterval(() => {
            setTimeLeft(calculate())
        }, 1000 * 60) // Update every minute

        return () => clearInterval(timer)
    }, [deadline, onExpire])

    return (

        <div className = "flex items-center gap-3">
            <div className = "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-orange-500">
                <Clock className = "h-5 w-5" />
            </div>

            <div className = "flex gap-3 text-center">
                {[
                    {label : 'Days', val : timeLeft.days},
                    {label : 'Hrs', val : timeLeft.hours},
                    {label : 'Mins', val : timeLeft.minutes}
                ].map((item) => (
                    <div
                        key = {item.label}
                        className = "flex flex-col"
                    >
                        <span className = "font-mono text-lg font-bold leading-none text-white">
                            {item.val}
                        </span>

                        <span className = "text-[9px] uppercase tracking-wider text-zinc-500">
                            {item.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>

    )
}


export default function EventDetails({event, onClose, onRegisterClick}) {
    
    // Scroll locking
    useEffect(() => {
        document.body.style.overflow = 'hidden'

        return (() => {
            document.body.style.overflow = 'unset'
        })
    }, [])

    const [isRegistrationClosed, setIsRegistrationClosed] = useState(
        event?.registration_deadline && new Date(event.registration_deadline) < new Date()
    )

    const locationDisplay = event.location_type === 'online'
        ? (event.virtual_location || "Online Event")
        : (event.physical_location || 'TBA')

    const hostName = event.host?.name || "Unknown Host"

    const formattedDate = event.start_date
        ? new Date(event.start_date).toLocaleDateString('en-US', {
            weekday : 'short',
            month : 'short',
            day : 'numeric',
            hour : '2-digit',
            minute : '2-digit'
        })
        : 'TBA'
    
    const formattedRegDeadline = event.registration_deadline
        ? new Date(event.registration_deadline).toLocaleDateString('en-US', {
            weekday : 'short',
            month : 'short',
            day : 'numeric',
            hour : '2-digit',
            minute : '2-digit'
        })
        : null

    const handleActionClick = async () => {
        if (event.is_native) {
            onRegisterClick(event)
        } else {
            window.open(event.register_link, '_blank', 'noopener,noreferrer')

            try {
                await apiPublic.post(`/api/events/${event.id}/track-click/`)
            } catch (err) {
                console.error("Failed to track click silently", err)
            }
        }
    }

    if (!event) return null

    const posterUrl = getImageUrl(event.poster)
    const scarcity = getScarcityState(event)

    const festiveGradient = "bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600"
    const scarcityStyles = {
        SOLD_OUT : "bg-red-500/20 text-red-400 border-red-500/30",
        CRITICAL : "bg-orange-500/20 text-orange-400 border-orange-500/30",
        WARNING : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    }
    
    const isSoldOut = event.is_sold_out

    return (

        <div 
            className = "fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-6 backdrop-blur-sm transition-all duration-300"
            onClick = {onClose}
            role = 'dialog'
        >
            <div 
                className = "relative flex flex-col max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-t-3xl border border-zinc-800 bg-zinc-950 shadow-2xl animate-in slide-in-from-bottom-10 sm:rounded-3xl"
                onClick = {(e) => e.stopPropagation()}
            >
                {/* flex-1 & overflow-y-auto makes the footer sticky */}
                <div className = "flex-1 overflow-y-auto custom-scrollbar">
                    {/* Close button */}
                    <button
                        onClick = {onClose}
                        className = "absolute top-4 right-4 z-30 rounded-full bg-black/50 p-2 text-white backdrop-blur-md transition-colors hover:bg-zinc-800"
                    >
                        <X className = "h-5 w-5" />
                    </button>

                    <div className = "flex-1 overflow-y-auto overflow-x-hidden">
                        {/* Event Poster */}
                        <div className = "relative h-56 sm:h-80 w-full overflow-hidden shrink-0">
                            {posterUrl ? (
                                <img 
                                    src = {posterUrl}
                                    alt = {event.name}
                                    className = "h-full w-full object-cover"
                                />
                            ) : (
                                <div className = "flex h-full w-full items-center justify-center bg-zinc-900">
                                    <span className = "text-zinc-700 font-bold uppercase tracking-widest text-xs">
                                        No Poster Available
                                    </span>
                                </div>
                            )}

                            {/* Gradient Fade */}
                            <div className = "absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

                            {/* Badge */}
                            <div className = "absolute top-6 left-6 flex flex-col items-start gap-2">
                                <span
                                    className = {`
                                        inline-flex items-center rounded-full border border-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white
                                        backdrop-blur-md
                                        ${!event.is_native 
                                            ? 'bg-blue-500/20' 
                                            : isSoldOut
                                                ? "bg-orange-500/20 border-orange-500/30"
                                                : isRegistrationClosed
                                                    ? "bg-red-500/20 border-red-500/30"
                                                    : 'bg-orange-500/20'
                                        }
                                    `}
                                >
                                    {!event.is_native
                                        ? "External Event"
                                        : isSoldOut
                                            ? "Sold Out"
                                            : isRegistrationClosed
                                                ? "Registration Closed"
                                                : "Registration Open"
                                    }
                                </span>
                            </div>
                        </div>

                        {/* Text Content */}
                        <div className = "px-5 sm:px-10 pb-8">
                            {/* Title Section */}
                            <div className = "relative -mt-12 mb-8">
                                <h2 className = "mb-2 break-words font-black uppercase leading-none tracking-tighter text-white drop-shadow-xl text-3xl sm:text-5xl">
                                    {event.name}
                                </h2>

                                <p className = "flex flex-wrap items-center gap-2 text-sm sm:text-base font-medium text-zinc-400">
                                    Hosted by <span className = "text-white border-b border-orange-500/50 pb-0.5">{hostName}</span>
                                </p>
                            </div>

                            {/* Info grid */}
                            <div className = "mb-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className = "flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3 sm:p-4">
                                    <div className = "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-orange-500">
                                        <Calendar className = "h-5 w-5" />
                                    </div>

                                    <div className = 'min-w-0'>
                                        <p className = "text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                                            Date & Time
                                        </p>

                                        <p className = "text-zinc-200 font-bold text-sm truncate">
                                            {formattedDate}
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Location */}
                                <div className = "bg-zinc-900/50 p-3 md:p-4 rounded-2xl border border-zinc-800 flex items-center gap-3">
                                    <div className = "flex h-10 w-10 shrink-0 rounded-full bg-zinc-800 items-center justify-center text-pink-500">
                                        {event.location_type === 'online' ? (
                                            <Laptop className = "h-5 w-5" />
                                        ) : (
                                            <MapPin className = "h-5 w-5" />
                                        )}
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
                                                className = "group flex items-center gap-2 text-zinc-200 font-bold text-sm hover:text-pink-500"
                                            >
                                                <span className = 'truncate'>
                                                    {locationDisplay}
                                                </span>

                                                <ExternalLink className = "h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
                                            </a>
                                        ) : (
                                            <p className = "text-zinc-200 font-bold text-sm truncate">
                                                {locationDisplay}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {event.event_contacts && event.event_contacts.map((contact, index) => (
                                    <div
                                        key = {`poc-${index}`}
                                        className = "flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3 sm:p-4"
                                    >
                                        <div className = "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-indigo-400">
                                            <User className = "h-5 w-5" />
                                        </div>

                                        <div className = "min-w-0 flex-1 flex justify-between items-center">
                                            <div className = "min-w-0 pr-2">
                                                <p className = "text-[10px] font-bold uppercase tracking-wide text-zinc-500 truncate">
                                                    {contact.role || 'Contact'}
                                                </p>

                                                <p className = "text-zinc-200 font-bold text-sm truncate">
                                                    {contact.name}
                                                </p>
                                            </div>

                                            {(contact.phone || contact.email) && (
                                                <div className = "flex items-center gap-2 shrink-0 border-l border-zinc-800 pl-3">
                                                    {contact.phone && (
                                                        <a
                                                            href = {`tel:${contact.phone}`}
                                                            className = "flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
                                                            title = {`Call ${contact.phone}`}
                                                        >
                                                            <Phone className = "h-3.5 w-3.5" />
                                                        </a>
                                                    )}

                                                    {contact.email && (
                                                        <a
                                                            href = {`mailto:${contact.email}`}
                                                            className = "flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
                                                            title = {`Email ${contact.email}`}
                                                        >
                                                            <Mail className = "h-3.5 w-3.5" />
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Description */}
                            <div className = 'mb-8'>
                                <h3 className = "text-lg font-bold text-white mb-3 flex">
                                    Event Details
                                </h3>

                                <div 
                                    className = "prose prose-invert prose-sm max-w-none text-zinc-400"
                                    dangerouslySetInnerHTML = {{
                                        __html : DOMPurify.sanitize(event.description)
                                    }}
                                />
                            </div>

                            {/* Brochure */}
                            {event.documents && event.documents.length > 0 && (
                                <div className = 'mb-4'>
                                    <h3 className = "text-lg font-bold text-white mb-3">
                                        Resources
                                    </h3>

                                    <div className = "grid gap-2">
                                        {event.documents.map((doc) => (
                                            <a
                                                key = {doc.id}
                                                href = {getImageUrl(doc.file)}
                                                target = '_blank'
                                                rel = "noopener noreferrer"
                                                className = "flex items-center gap-3 p-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl border-zinc-800 hover:border-zinc-600 transition-all group cursor-pointer"
                                            >
                                                <div className = "bg-zinc-800 p-2.5 rounded-lg group-hover:bg-zinc-700 transition-colors text-zinc-300 group-hover:text-white">
                                                    <FileText className = "h-5 w-5" />
                                                </div>

                                                <div className = "flex-1 min-w-0">
                                                    <p className = "font-bold text-white text-sm group-hover:text-orange-500 transition-colors truncate">
                                                        {doc.name || (doc.file ? doc.file.split('/').pop() : "Event Document")}
                                                    </p>

                                                    <p className = "text-[10px] text-zinc-500">
                                                        View Document
                                                    </p>
                                                </div>

                                                <Download className = "h-4 w-4 text-zinc-600 group-hover:text-white transition-colors" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}


                        </div>
                    </div>
                </div>

                {/* Sticky Footer Area */}
                <div className = "shrink-0 border-t border-zinc-800 bg-zinc-950 p-4 pb-safe sm:px-10 sm:py-6">
                    {isRegistrationClosed || isSoldOut ? (
                        <div
                            className = {`
                                flex w-full items-center justify-between rounded-xl p-4 border
                                ${isSoldOut
                                    ? "bg-orange-950/30 border-orange-900/50 text-orange-400"
                                    : "bg-red-950/30 border-red-900/50 text-red-400"
                                }
                            `}
                        >
                            <div className = "flex items-center gap-3">
                                <AlertCircle className = "h-5 w-5" />

                                <div>
                                    <p className = "font-bold text-sm">
                                        {isSoldOut ? "Event Sold Out" : "Registration Closed"}
                                    </p>

                                    <p className = "text-[10px] text-red-400/60">
                                        {isSoldOut ? "All tickets have been sold" : "Deadline Passed"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className = "flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                            {/* Timer Display */}
                            {event.registration_deadline && (
                                <div className = "flex flex-col gap-1.5">
                                    <CountdownTimer
                                        deadline = {event.registration_deadline}
                                        onExpire = {() => setIsRegistrationClosed(true)}
                                    />

                                    <span className = "text-xs sm:text-sm text-zinc-400 font-semibold tracking-wide mt-1.5">
                                        Closes: {formattedRegDeadline}
                                    </span>

                                    {scarcity && (
                                        <span className = {`inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${scarcityStyles[scarcity.status] || ''}`}>
                                            {scarcity.text}
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Register Button */}
                            <button
                                onClick = {handleActionClick}
                                className = {`group relative flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl ${festiveGradient} px-8 py-3.5 text-sm font-black uppercase tracking-widest text-white shadow-lg transition-all active:scale-95 hover:shadow-[0_0_20px_rgba(236, 72, 153, 0.4)]`}
                            >
                                {event.is_native ? "Register Now" : "External Link"}

                                <TicketIcon className = "h-4 w-4 transition-transform group-hover:-rotate-12" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>

    )

}
