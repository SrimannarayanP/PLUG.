// TicketCard.jsx


import {useState} from 'react'
import {Calendar, MapPin, Clock, CheckCircle, XCircle, Ticket, User, QrCode, ImageOff, Laptop, Layers, Archive} from 'lucide-react'

import TicketModal from './TicketModal'

import {getImageUrl} from '../../utils/imageHelper'
import {checkEventExpiry} from '../../utils/ticketHelper'


export default function TicketCard({tickets}) {

    // const {payment_status, checked_in} = ticket
    const [isModalOpen, setIsModalOpen] = useState(false)

    const primaryTicket = tickets[0]
    const event = primaryTicket.event || {}
    const ticketCount = tickets.length

    const hasUsableTicket = tickets.some(t => !t.is_cancelled && t.payment_status !== 'rejected')
    
    const posterUrl = getImageUrl(event.poster)

    const isExpired = checkEventExpiry(event.end_date)

    // const isVoid = ticket.cancelled || payment_status === 'rejected'
    // const isPending = payment_status === 'pending'
    // const isUsable = !isVoid && !isPending

    const getLocationDisplay = () => {
        if (event.location_type === 'online') {

            return (

                <span className = "flex items-center gap-1.5 truncate">
                    <Laptop className = "h-3 w-3 text-purple-400 shrink-0" />

                    <span>Online Event</span>
                </span>

            )

        }

        return (

            <span className = "flex items-center gap-1.5 truncate">
                {/* <MapPin className = "h-3 w-3 shrink-0 text-purple-500" /> */}

                <span className = 'truncate'>
                    {event.physical_location || "Venue TBA"}
                </span>
            </span>

        )
    }

    function getStatusBadge({ticket}) {
        const badgeBase = "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border backdrop-blur-md"

        if (ticket.is_cancelled) {

            return (

                <div className = {`${badgeBase} bg-red-950/80 text-red-400 border-red-500/20`}>
                    <XCircle
                        size = {12}
                        strokeWidth = {3}
                    />

                    Cancelled
                </div>

            )

        }

        // Checking payment status
        if (payment_status === 'pending') {
            
            return (

                <div className = {`${badgeBase} bg-yellow-950/80 text-yellow-400 border-yellow-500/20`}>
                    <Clock 
                        size = {12}
                        strokeWidth = {3}
                        className = 'animate-pulse'
                    />

                    Pending
                </div>
            
            )

        }

        if (payment_status === 'rejected') {

            return (

                <div className = {`${badgeBase} bg-red-950/80 text-red-400 border-red-500/20`}>
                    <XCircle 
                        size = {12}
                        strokeWidth = {3}
                    />

                    Rejected
                </div>

            )

        }

        // If paid/free, check check-in status
        if (checked_in) {

            return (

                <div className = {`${badgeBase} bg-zinc-800 text-zinc-400 border-zinc-700`}>
                    <CheckCircle 
                        size = {12}
                        strokeWidth = {3}
                    />

                    Used
                </div>

            )

        }

        if (isExpired) {

            return (

                <div className = {`${badgeBase} bg-zinc-800/80 text-zinc-500 border-zinc-700/50`}>
                    <Archive
                        size = {12}
                        strokeWidth = {3}
                    />

                    Ended
                </div>

            )

        }

        // Default valid/confirmed
        return (

            <div className = {`${badgeBase} bg-emerald-950/80 text-emerald-400 border-emerald-500/20`}>
                <Ticket 
                    size = {12}
                    strokeWidth = {3}
                />

                Valid
            </div>

        )
    }

    return (

        <>
            <div 
                className = {`
                    group relative flex flex-col h-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 transition-all duration-300
                    ${hasUsableTicket
                        ? "cursor-pointer hover:-translate-y-1 hover:border-zinc-700 hover:shadow-2xl"
                        : 'opacity-80'
                    }
                `}
                onClick = {() => hasUsableTicket && setIsModalOpen(true)}
            >
                {/* Image section */}
                <div className = "relative aspect-video w-full overflow-hidden bg-zinc-900 border-b border-zinc-800">
                    {posterUrl ? (
                        <img 
                            src = {posterUrl}
                            alt = {event.name}
                            loading = 'lazy'
                            className = "h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        />
                    ) : (
                        <div className = "flex flex-col h-full w-full items-center justify-center bg-zinc-900 text-zinc-700 font-bold gap-2">
                            <ImageOff className = "w-8 h-8 opacity-50" />

                            <span className = "text-xs uppercase tracking-widest">
                                No Poster
                            </span>
                        </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className = "absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent opacity-60" />

                    <div className = "absolute top-3 right-3 z-10">
                        {ticketCount > 1 ? (
                            <div className = "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border backdrop-blur-md bg-orange-500/10 text-orange-400 border-orange-500/20">
                                <Layers
                                    size = {12}
                                    strokeWidth = {3}
                                />

                                {ticketCount} Tickets
                            </div>
                        ) : (
                            getStatusBadge({ticket : primaryTicket})
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className = "flex flex-col flex-1 p-4 sm:p-5">
                    {/* Title */}
                    <h3 className = "mb-2 line-clamp-1 text-lg sm:text-xl font-bold text-white transition-all group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-orange-500 group-hover:to-pink-600"> {/* line-clamp will help truncate after the specified no. of lines */} 
                                                                                                        {/* leading-tight reduces the spaces b/w 2 lines  */}
                        {event.name || "Event Name"}
                    </h3>

                    {/* Hosted by */}
                    <div className = "flex items-center mb-4 gap-2 text-xs text-zinc-400">
                        <User
                            size = {14}
                            className = 'text-zinc-500'
                        />

                        <p className = 'truncate'>
                            Hosted by <span className = "text-zinc-300 font-medium">{event.organisation?.name || 'Unknown'}</span>
                        </p>
                    </div>

                    {/* Date & Location */}
                    <div className = "grid gap-2.5 mb-6">
                        {/* Date */}
                        <div className = "flex items-center gap-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/50 p-2.5 group-hover:bg-zinc-900 transition-colors">
                            <Calendar 
                                size = {16}
                                className = "text-pink-500 shrink-0"
                            />

                            <span className = "text-xs text-zinc-300 font-mono font-bold">
                                {event.start_date 
                                    ? new Date(event.start_date).toLocaleDateString('en-GB', {
                                        day : 'numeric',
                                        month : 'short',
                                        year : 'numeric',
                                        hour : '2-digit',
                                        minute : '2-digit'
                                    }) 
                                    : "Date TBA"
                                }
                            </span>
                        </div>
                        
                        {/* Location */}
                        <div className = "flex items-center gap-2.5 rounded-lg bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/50 p-2.5 transition-colors">
                            <MapPin 
                                size = {16}
                                className = "text-purple-500 shrink-0"
                            />

                            <span className = "text-xs text-zinc-300 font-mono truncate w-full">
                                {getLocationDisplay()}
                            </span>
                        </div>
                    </div>
                    
                    {/* Action Button */}
                    <div className = 'mt-auto'>
                        <button
                            onClick = {(e) => {
                                e.stopPropagation()
                                setIsModalOpen(true)
                            }}
                            className = "group/btn flex w-full items-center justify-center gap-2 rounded-xl bg-white hover:bg-zinc-200 py-3 text-xs font-bold uppercase tracking-widest text-black shadow-lg hover:shadow-white/10 transition-all active:scale-[0.98]"
                        >
                            <QrCode 
                                size = {16} 
                                className = "group-hover/btn:scale-110 transition-transform"
                            />

                            {ticketCount > 1 ? "View All Tickets" : "View Ticket"}
                        </button>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <TicketModal 
                    tickets = {tickets}
                    closeModal = {() => setIsModalOpen(false)}
                />
            )}
        </>

    )

}
