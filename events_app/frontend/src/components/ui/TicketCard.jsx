// TicketCard.jsx


import {useState} from 'react'
import {Calendar, MapPin, Clock, CheckCircle, XCircle, Ticket, User, QrCode, ImageOff, Laptop} from 'lucide-react'

import TicketModal from './TicketModal'

import {getImageUrl} from '../../utils/imageHelper'


export default function TicketCard({ticket}) {

    const event = ticket.event || {}
    const {payment_status, checked_in} = ticket
    const [isModalOpen, setIsModalOpen] = useState(false)
    
    const posterUrl = getImageUrl(event.poster_field)

    const getLocationDisplay = () => {
        if (event.location_type === 'online') {

            return (

                <span className = "flex items-center gap-1">
                    <Laptop className = "w-3 h-3 text-purple-400" />

                    <span>Online</span>
                </span>

            )

        }

        return (

            <span className = "flex items-center gap-1">
                <MapPin className = "w-3 h-3 text-purple-500" />

                <span className = 'truncate'>
                    {event.physical_location || "Venue TBA"}
                </span>
            </span>

        )
    }

    const getStatusBadge = () => {
        const badgeBase = "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border backdrop-blur-md"

        if (ticket.cancelled) {

            return (

                <div className = {`${badgeBase} bg-red-500/10 text-red-500 border-red-500/20`}>
                    <XCircle
                        size = {12}
                        strokeWidth = {3}
                    />

                    <span>Cancelled</span>
                </div>

            )

        }

        // Checking payment status
        if (payment_status === 'pending') {
            
            return (

                <div className = {`${badgeBase} bg-yellow-500/10 text-yellow-500 border-yellow-500/20`}>
                    <Clock 
                        size = {12}
                        strokeWidth = {3}
                    />

                    <span>Pending</span>
                </div>
            
            )

        }

        if (payment_status === 'rejected') {

            return (

                <div className = {`${badgeBase} bg-red-500/10 text-red-500 border-red-500/20`}>
                    <XCircle 
                        size = {12}
                        strokeWidth = {3}
                    />

                    <span>Rejected</span>
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

                    <span>Used</span>
                </div>

            )

        }

        // Default valid/confirmed
        return (

            <div className = {`${badgeBase} bg-emerald-500/10 text-emerald-500 border-emerald-500/20`}>
                <Ticket 
                    size = {12}
                    strokeWidth = {3}
                />

                <span>Valid</span>
            </div>

        )
    }

    return (

        <>
            <div className = "group bg-[#18181b] rounded-2xl overflow-hidden flex flex-col transition-all duration-300 border border-zinc-800 hover:border-zinc-700 hover:shadow-2xl hover:-translate-y-1 h-full relative cursor-default">
                {/* Image section */}
                <div className = "h-40 w-full bg-zinc-900 relative overflow-hidden border-b border-zinc-800">
                    {posterUrl ? (
                        <img 
                            src = {posterUrl}
                            alt = {event.event_name}
                            loading = 'lazy'
                            className = "w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100" 
                        />
                    ) : (
                        <div className = "w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-700 font-bold gap-2">
                            <ImageOff className = "w-8 h-8 opacity-50" />

                            <span className = "text-xs uppercase tracking-widest">
                                No Poster
                            </span>
                        </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className = "absolute inset-0 bg-gradient-to-t from-[#18181b] to-transparent opacity-60" />

                    <div className = "absolute top-3 right-3 z-10">
                        {getStatusBadge()}
                    </div>
                </div>

                {/* Content */}
                <div className = "p-5 flex-1 flex flex-col relative z-10 -mt-2">
                    {/* Title */}
                    <h3 className = "text-xl font-bold text-white mb-2 line-clamp-1 leading-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-orange-500 group-hover:to-pink-600 transition-all"> {/* line-clamp will help truncate after the specified no. of lines */} 
                                                                                                        {/* leading-tight reduces the spaces b/w 2 lines  */}
                        {event.event_name || "Event Name"}
                    </h3>

                    {/* Hosted by */}
                    <div className = "flex items-center gap-2 mb-5">
                        <User
                            size = {14}
                            className = 'text-orange-500'
                        />

                        <p className = "text-xs text-zinc-400 font-medium truncate">
                            Hosted by <span className = "text-zinc-200">{event.organisation?.name || 'Unknown'}</span>
                        </p>
                    </div>

                    {/* Date & Location */}
                    <div className = "grid gap-3 mb-6">
                        {/* Date */}
                        <div className = "flex items-center gap-3 p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800/50 hover:bg-zinc-900 transition-colors">
                            <Calendar 
                                size = {16}
                                className = "text-pink-500 shrink-0"
                            />

                            <span className = "text-xs text-zinc-300 font-mono">
                                {event.start_date ? new Date(event.start_date).toLocaleDateString('en-GB', {
                                    day : 'numeric',
                                    month : 'short',
                                    year : 'numeric',
                                    hour : '2-digit',
                                    minute : '2-digit'
                                }) : "Date TBA"}
                            </span>
                        </div>
                        
                        {/* Location */}
                        <div className = "flex items-center gap-3 p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800/50 hover:bg-zinc-900 transiton-colors">
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
                        {(!ticket.cancelled && payment_status !== 'rejected' && payment_status !== 'pending') ? (
                            <button
                                onClick = {() => setIsModalOpen(true)}
                                className = "w-full py-3 bg-white text-black text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 group/btn shadow-[0_0_15px_rgba(255, 255, 255, 0.05)] hover:shadow-[0_0_20px_rgba(255, 255, 255, 0.15)] active:scale-[0.98]"
                            >
                                <QrCode 
                                    size = {16} 
                                    className = "group=hover/btn:scale-110 transition-transform"
                                />

                                View Ticket
                            </button>
                        ) : (
                            <button
                                disabled
                                className = "w-full py-3 bg-zinc-800/50 text-zinc-500 text-xs font-bold uppercase tracking-widest rounded-xl border border-zinc-700/50 cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {payment_status === 'pending' ? (
                                    <>
                                        <Clock 
                                            size = {16} 
                                            className = "animate-pulse text-yellow-500"   
                                        />

                                        <span className = 'text-yellow-500/80'>
                                            Processing...
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <XCircle size = {16} />
                                        
                                        <span>Ticket Void</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <TicketModal 
                    ticket = {ticket}
                    closeModal = {() => setIsModalOpen(false)}
                />
            )}
        </>

    )

}
