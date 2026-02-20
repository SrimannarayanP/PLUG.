// TicketModal.jsx


import {useEffect, useState} from 'react'
import {X, Loader2, CalendarDays, MapPin, ExternalLink, ChevronLeft, ChevronRight, User, Ban, Archive, Send, RefreshCw} from 'lucide-react'
import {toast} from 'react-hot-toast'

import api from '../../api/api'

import {checkEventExpiry} from '../../utils/ticketHelper'


export default function TicketModal({tickets : initialTickets, closeModal}) {

    const [tickets, setTickets] = useState(initialTickets)
    const [activeIndex, setActiveIndex] = useState(0)
    const [cancelling, setCancelling] = useState(false)
    const [resending, setResending] = useState(false)
    const [isFlipped, setIsFlipped] = useState(false)

    const currentTicket = tickets[activeIndex]
    const event = currentTicket.event

    const isPending = currentTicket.payment_status === 'pending'
    const isRefundPending = currentTicket.payment_status === 'refund_pending'
    const isVerified = currentTicket.payment_status === 'verified' || currentTicket.checked_in
    const isCancelled = currentTicket.is_cancelled
    const isExpired = checkEventExpiry(event.end_date)

    const festiveGradient = "bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600"
    const textGradient = "bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600"

    // Lock body scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden'

        return () => {document.body.style.overflow = 'unset'}
    }, [])

    const nextTicket = (e) => {
        e.stopPropagation()

        setActiveIndex((prev) => (prev + 1) % tickets.length)
    }

    const prevTicket = (e) => {
        e.stopPropagation()

        setActiveIndex((prev) => (prev - 1 + tickets.length) % tickets.length)
    }

    const handleCancelTicket = async () => {
        if (!window.confirm("Are you sure you want to cancel this ticket? This action cannot be undone.")) return

        setCancelling(true)

        try {
            const res = await api.post(`/api/ticket/cancel/${currentTicket.id}`)

            toast.success(res.data.message || "Ticket Cancelled")

            setTickets(prev => {
                const newTickets = [...prev]
                const updatedTicket = {...newTickets[activeIndex]}

                updatedTicket.is_cancelled = true

                if (updatedTicket.payment_status === 'verified') {
                    updatedTicket.payment_status = 'refund_pending'
                } else if (updatedTicket.payment_status === 'pending') {
                    updatedTicket.payment_status = 'rejected'
                }

                newTickets[activeIndex] = updatedTicket

                return newTickets
            })

            setIsFlipped(false)
        } catch (err) {
            console.error(err)

            toast.error(err.response?.data?.error || "Failed to cancel ticket")
        } finally {
            setCancelling(false)
        }
    }

    const handleResendTicket = async () => {
        if (resending) return

        setResending(true)

        try {
            await api.post(`/api/ticket/resend/${currentTicket.id}`)
            
            toast.success(`Ticket sent to ${currentTicket.email}`)
        } catch (err) {
            console.error(err)

            toast.error(err.response?.data?.error || "Failed to resend ticket")
        } finally {
            setResending(false)
        }
    }

    return (

        <div
            className = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
            onClick = {closeModal}
        >   
            {/* Glow effect behind the card */}
            <div className = {`absolute w-full max-w-sm aspect-[3/4] ${festiveGradient} opacity-20 blur-[60px] rounded-full pointer-events-none`} />

            <div
                className = "relative w-full max-w-xs sm:max-w-sm h-[650px] sm:h-[700px] perspective-1000"
                onClick = {(e) => e.stopPropagation()}
            >
                <div 
                    className = {`
                        relative w-full h-full transition-transform duration-700 transform-style-3d
                        ${isFlipped
                            ? 'rotate-y-180'
                            : ''
                        }
                    `}
                >
                    <div className = "absolute inset-0 backface-hidden bg-zinc-950 rounded-3xl p-[1px] shadow-2xl flex flex-col overflow-hidden">
                        <div className = {`absolute inset-0 ${festiveGradient} z-0 opacity-100 pointer-events-none`} />

                        <div className = "relative z-10 flex flex-col h-full w-full bg-zinc-950 rounded-[23px] overflow-hidden">
                            {/* Top half - Event info */}
                            <div className = "relative bg-white/5 p-6 pb-4 text-center shrink-0 border-b border-zinc-900">
                                {/* Header/Close */}
                                <button
                                    onClick = {closeModal}
                                    className = "absolute top-4 right-4 z-20 bg-black/20 hover:bg-black/40 text-white rounded-full p-2 transition-colors border border-white/10"
                                >
                                    <X size = {18} />
                                </button>

                                {/* Subtle background blurs */}
                                <div className = {`absolute top-0 right-0 h-24 w-24 ${festiveGradient} opacity-20 blur-2xl -translate-x-1/2 -translate-y-1/2 pointer-events-none`} />

                                {tickets.length > 1 && (
                                    <div className = "flex justify-center mb-4">
                                        <div className = "flex items-center bg-black/40 backdrop-blur-md rounded-full p-1 border border-white/10">
                                            <button
                                                onClick = {prevTicket}
                                                className = "p-1 hover:bg-white/10 rounded-full transition-colors"
                                            >
                                                <ChevronLeft size = {14} />
                                            </button>

                                            <span className = "text-[10px] font-bold font-mono px-3 text-zinc-300">
                                                {activeIndex + 1} / {tickets.length}
                                            </span>

                                            <button
                                                onClick = {nextTicket}
                                                className = "p-1 hover:bg-white/10 rounded-full transition-colors"
                                            >
                                                <ChevronRight size = {14} />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <h2 className = {`relative text-2xl font-black mb-1 font-outfit leading-tight tracking-tight ${textGradient} break-words`}>
                                    {event.name}
                                </h2>

                                <div className = "mt-3 flex items-center justify-center gap-2 text-sm font-medium text-white bg-white/5 px-4 py-1.5 rounded-lg mx-auto w-fit border border-white/5">
                                    <User
                                        size = {14}
                                        className = 'text-orange-500'
                                    />

                                    {currentTicket.attendee_name || 'Guest'}
                                </div>

                                {/* Corner cutouts */}
                                {/* <div className = "absolute -bottom-3 -left-3 w-6 h-6 bg-black rounded-full z-10 border-t border-r border-white/10" />
                                <div className = "absolute -bottom-3 -right-3 w-6 h-6 bg-black rounded-full z-10 border-t border-l border-white/10" /> */}
                            </div>

                            {/* Bottom half - QR code */}
                            <div className = "flex flex-col flex-1 overflow-y-auto p-6 items-center bg-black relative">
                                {/* Status Badges */}
                                <div className = 'mb-6'>
                                    {isCancelled ? (
                                        <span className = "text-red-500 text-xs font-bold flex items-center gap-2 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                                            <Ban size = {10}/>

                                            Ticket Cancelled
                                        </span>
                                    ) : isRefundPending ? (
                                        <span className = "text-yellow-500 text-xs font-bold flex items-center gap-2 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
                                            <Loader2 
                                                className = 'animate-spin' 
                                                size = {12}
                                            />

                                            Refund Processing
                                        </span>
                                    ) : isPending ? (
                                        <span className = "text-yellow-500 text-xs font-bold flex items-center gap-2">
                                            <Loader2 
                                                className = 'animate-spin'
                                                size = {12}
                                            />

                                            Payment Pending
                                        </span>
                                    ) : currentTicket.is_checked_in ? (
                                        <span className = "text-zinc-500 text-xs font-bold flex items-center gap-2">
                                            Ticket Used
                                        </span>
                                    ) : isExpired ? (
                                        <span className = "text-zinc-600 text-xs font-bold flex items-center gap-2 border border-zinc-800 px-3 py-1 rounded-full">
                                            <CalendarDays size = {12} />

                                            Event Ended
                                        </span>
                                    ) : (
                                        <span className = "text-emerald-500 text-xs font-bold flex items-center gap-2 animate-pulse">
                                            Live Ticket
                                        </span>
                                    )}
                                </div>

                                <div className = "relative group mb-6 shrink-0 transition-all duration-300">
                                    {!isCancelled && !isRefundPending && !isExpired && (
                                        // Gradient frame around QR
                                        <div className = {`absolute -inset-1 ${festiveGradient} rounded-2xl opacity-75 blur-sm transition duration-500`} />
                                    )}
                                    
                                    <div 
                                        className = {`
                                            relative bg-white p-3 rounded-xl
                                            ${isCancelled || isRefundPending || isExpired
                                                ? "opacity-50 grayscale"
                                                : ''
                                            }
                                        `}
                                    >
                                        {(isVerified && !isCancelled && !isRefundPending && !isExpired) ? (
                                            <img
                                                key = {currentTicket.id} 
                                                src = {currentTicket.qr_code}
                                                alt = "Ticket QR"
                                                className = "h-40 sm:h-48 w-40 sm:w-48 object-contain mix-blend-multiply"
                                                style = {{colorAdjust : 'exact'}}
                                            />
                                        ) : (
                                            <div className = "h-40 sm:h-48 w-40 sm:w-48 flex flex-col items-center justify-center text-xs text-gray-500 text-center font-mono p-4 border-2 border-dashed border-gray-300 rounded-lg">
                                                {isCancelled ? (
                                                    <>
                                                        <Ban className = "h-8 w-8 mb-2 opacity-50" />

                                                        <span>INVALID</span>
                                                    </>
                                                ) : isRefundPending ? (
                                                    <>
                                                        <Loader2 className = "h-8 w-8 mb-2 animate-spin opacity-50" />

                                                        <span>REFUND<br />IN PROGRESS</span>
                                                    </>
                                                ) : isExpired ? (
                                                    <>
                                                        <Archive className = "h-8 w-8 mb-2 opacity-50" />

                                                        <span>EVENT<br />ENDED</span>
                                                    </>
                                                ) : isPending ? 'Verifying...' : 'Void'}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Manual code fallback */}
                                {(isVerified && !isCancelled && !isRefundPending && !isExpired) && (
                                    <div className = "flex flex-col items-center gap-1.5 animate-in fade-in duration-500">
                                        <span className = "text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                                            Manual Entry Code
                                        </span>

                                        <div className = "bg-zinc-900 border border-zinc-800 px-6 py-2 rounded-xl shadow-inner">
                                            <span className = "font-mono text-2xl tracking-[0.25em] text-white font-black">
                                                {currentTicket.ticket_code}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className = 'mt-auto'>
                                <button
                                    onClick = {() => setIsFlipped(true)}
                                    className = "w-full py-4 bg-zinc-900 hover:bg-zinc-800 border-t border-zinc-800 flex items-center justify-center gap-2 text-zinc-400 hover:text-white uppercase tracking-widest text-xs font-bold transition-colors"
                                >
                                    <RefreshCw size = {14} />
                                
                                    View Details & Actions
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className = "absolute inset-0 backface-hidden rotate-y-180 bg-zinc-950 rounded-3xl p-[1px] shadow-2xl flex flex-col overflow-hidden">
                        <div className = {`absolute inset-0 ${festiveGradient} z-0 opacity-100 pointer-events-none`} />
                        {/* Details & status */}
                        <div className = "relative z-10 flex flex-col h-full w-full bg-black rounded-[23px] overflow-hidden">
                            {/* Header */}
                            <div className = "p-6 text-center border-b border-zinc-900 shrink-0 relative">
                                <button
                                    onClick = {closeModal}
                                    className = "absolute top-4 right-4 z-20 bg-white/5 hover:bg-white/10 text-white rounded-full p-2 transition-colors"
                                >
                                    <X size = {18} />
                                </button>

                                <h3 className = "text-xl font-bold text-white uppercase tracking-widest mt-2">
                                    Details & Settings
                                </h3>
                            </div>

                            {/* Date */}
                            <div className = "flex flex-col flex-1 p-6 space-y-6 overflow-y-auto">
                                <span className = "text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                                    Date & Time
                                </span>

                                <div className = "flex items-center gap-3 text-zinc-300 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
                                    <CalendarDays 
                                        size = {18}
                                        className = "text-orange-500 shrink-0"
                                    />

                                    <span className = "font-mono font-bold text-sm">
                                        {event.start_date
                                            ? new Date(event.start_date).toLocaleDateString('en-GB', {
                                                weekday : 'long',
                                                day : 'numeric',
                                                month : 'short',
                                                year : 'numeric',
                                                hour : '2-digit',
                                                minute : '2-digit'
                                            })
                                            : 'TBA'
                                        }
                                    </span>
                                </div>
                            </div>

                            {/* Location */}
                            <div className = "flex flex-col gap-2">
                                <span className = "text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                                    Location
                                </span>
                                
                                <div className = "flex items-center gap-3 text-zinc-300 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
                                    {event.location_type === 'online' ? (
                                        <Laptop
                                            size = {18}
                                            className = "text-purple-500 shrink-0"
                                        />
                                    ) : (
                                        <MapPin
                                            size = {18}
                                            className = "text-purple-500 shrink-0"
                                        />
                                    )}

                                    <div className = "flex flex-col">
                                        <span className = "font-medium text-sm">
                                            {event.physical_location || (event.location_type === 'online' ? 'Online' : 'TBA')}
                                        </span>

                                        {event.google_maps_link && event.location_type !== 'online' && (
                                            <a
                                                href = {event.google_maps_link}
                                                target = '_blank'
                                                rel = 'noreferrer'
                                                className = "text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 mt-1 underline decoration-dashed underline-offset-2"
                                            >
                                                Open in Maps <ExternalLink size = {10}/>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Action Button */}
                            <div className = "p-6 bg-zinc-950 border-t border-zinc-900 space-y-3 mt-auto shrink-0">
                                {!isCancelled && !currentTicket.is_checked_in && !isRefundPending && !isExpired && (
                                    <button
                                        onClick = {handleCancelTicket}
                                        disabled = {cancelling}
                                        className = "w-full py-3 rounded-xl font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                                    >
                                        {cancelling
                                            ? <Loader2 className = "h-4 w-4 animate-spin" />
                                            : <Ban size = {16} />
                                        }

                                        {cancelling ? 'Cancelling...' : "Cancel Ticket"}
                                    </button>
                                )}

                                {!isCancelled && !isRefundPending && !isExpired && (
                                    <button
                                        onClick = {handleResendTicket}
                                        disabled = {resending}
                                        className = "w-full py-3 rounded-xl font-bold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-xs upppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                                    >
                                        {resending ? (
                                            <>
                                                <Loader2 className = "h-4 w-4 animate-spin" />

                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send size = {16} />

                                                Resend Ticket
                                            </>
                                        )}
                                    </button>
                                )}

                                <button
                                    onClick = {() => setIsFlipped(false)}
                                    className = "w-full py-3 mt-2 flex items-center justify-center gap-2 text-zinc-400 hover:text-white uppercase tracking-widest text-xs font-bold transition-colors"
                                >
                                    <RefreshCw size = {14} />

                                    Back to QR Code
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    )
}
