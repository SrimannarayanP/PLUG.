// TicketModal.jsx


import {X, Loader2, CalendarDays, MapPin, ScanLine, Ticket, ExternalLink} from 'lucide-react'


export default function TicketModal({ticket, closeModal}) {

    const event = ticket.event
    const isPending = ticket.payment_status === 'pending'
    const isVerified = ticket.payment_status === 'verified'

    const festiveGradient = "bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600"
    const textGradient = "bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600"

    return (

        <div
            className = "fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
            onClick = {closeModal}
        >   
            {/* Glow effect behind the card */}
            <div className = {`absolute w-full max-w-sm h-[600px] ${festiveGradient} opacity-20 blur-[100px] rounded-full pointer-events-none`} />

            <div
                className = {`relative w-full max-w-sm rounded-3xl p-[1px] ${festiveGradient} shadow-2xl`}
                onClick = {(e) => e.stopPropagation()}
            >
                <div className = "w-full h-full bg-black rounded-3xl overflow-hidden relative">
                    {/* Top half - Event info */}
                    <div className = "bg-white/5 p-8 pb-6 text-center relative overflow-hidden">
                        {/* Header/Close */}
                        <button
                            onClick = {closeModal}
                            className = "absolute top-4 right-4 z-20 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors backdrop-blur-md border border-white/10"
                        >
                            <X size = {20} />
                        </button>

                        <div className = {`absolute top-0 right-0 w-32 h-32 ${festiveGradient} opacity-20 blur-3xl -translate-y-1/2 -translate-x-1/2`} />
                        <div className = {`absolute bottom-0 left-0 w-24 h-24 ${festiveGradient} opacity-10 blur-2xl translate-y-1/2 -translate-x-1/2`} />

                        {/* Corner cutouts */}
                        {/* <div className = "absolute -bottom-3 -left-3 w-6 h-6 bg-black rounded-full z-10 border-t border-r border-white/10" />
                        <div className = "absolute -bottom-3 -right-3 w-6 h-6 bg-black rounded-full z-10 border-t border-l border-white/10" /> */}

                        <div className = "relative z-10 flex justify-center mb-4">
                            <span className = {`inline-flex items-center gap-1 px-3 py-1 rounded-full border border-pink-500/30 bg-pink-500/10 text-[10px] font-bold uppercase tracking-widest text-pink-400`}>
                                <Ticket size = {12} />

                                {isPending ? "Reserving Spot..." : "Ticket Confirmed"}                                
                            </span>
                        </div>

                        <h2 className = {`relative text-3xl font-black mb-1 font-outfit leading-tight tracking-tight ${textGradient}`}>
                            {event.event_name}
                        </h2>
                    </div>

                    {/* Bottom half - QR code */}
                    <div className = "p-8 pt-6 flex flex-col items-center bg-black relative flex-grow">
                        {isVerified ? (
                            <div className = "relative group">
                                {/* Gradient frame around QR */}
                                <div className = {`absolute -inset-1 ${festiveGradient} rounded-2xl opacity-75 blur-sm group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt`} />

                                <div className = "relative bg-white p-3 rounded-xl">
                                    {ticket.qr_code ? (
                                        <img 
                                            src = {ticket.qr_code}
                                            alt = "Ticket QR"
                                            className = "w-48 h-48 object-contain"
                                            style = {{colorAdjust : 'exact'}}
                                        />
                                    ) : (
                                        <div className = "w-48 h-48 flex items-center justify-center text-xs text-gray-500">
                                            Error loading QR
                                        </div>
                                    )}

                                    {/* Scan me label */}
                                    <div className = "absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-black text-white px-3 py-1 rounded-full text-[10px] font-bold border border-gray-800 flex items-center gap-1 whitespace-nowrap">
                                        {/* whitespace-nowrap forces the text to continue on the same line, not allowing it to wrap into a new line. If there are multiple
                                         whitespaces, tabs etc., it'll condense them into 1 whitespace */}
                                        <ScanLine 
                                            size = {10}
                                            className = 'text-pink-500'
                                        />

                                        SCAN AT ENTRY
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Placeholder for pending state
                            <div className = "relative w-full h-52 flex flex-col items-center justify-center bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                                <div className = "absolute inset-0 bg-gradient-to-tr from-orange-500/10 to-purple-500/10 animate-pulse" />

                                <Loader2
                                    size = {40}
                                    className = "text-pink-500 animate-spin mb-3 relative z-10"
                                />

                                <p className = "text-sm font-bold text-white relative z-10">
                                    Verifying...
                                </p>
                            </div>
                        )}

                        {/* Details & status */}
                        <div className = "mt-8 w-full space-y-4">
                            {/* Date & location row */}
                            <div className = "flex justify-between items-center text-sm border-t border-white/10 pt-4">
                                <div className = "flex items-center gap-2 text-gray-300">
                                    <CalendarDays 
                                        size = {16}
                                        className = 'text-orange-500'
                                    />

                                    <span className = "font-outfit font-bold">
                                        {event.start_date}
                                    </span>
                                </div>

                                <div className = "flex items-center gap-2 text-gray-400 max-w-[50%] justify-end text-right">
                                    <MapPin 
                                        size = {16}
                                        className = "text-purple-500 shrink-0"
                                    />

                                    {event.google_maps_link ? (
                                        <a
                                            href = {event.google_maps_link}
                                            target = '_blank'
                                            rel = "noopener noreferrer"
                                            className = "font-medium text-xs hover:text-purple-400 transition-colors flex items-center gap-1 underline decoration-dashed underline-offset-4 decoration-purple-500/50"
                                            onClick = {(e) => e.stopPropagation()}
                                        >
                                            {event.location}

                                            <ExternalLink
                                                size = {10}
                                                className = 'mb-0.5'
                                            />
                                        </a>
                                    ) : (
                                        <span className = "font-medium text-xs">
                                            {event.location}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {isPending && ticket.transaction_id && (
                                <div className = 'text-center'>
                                    <p className = "text-[10px] text-gray-500 font-mono">
                                        UTR: {ticket.transaction_id}
                                    </p>
                                </div>
                            )}

                            <button
                                onClick = {closeModal}
                                className = {`w-full py-4 rounded-xl font-bold text-white shadow-lg transform transition-all active:scale-95 hover:shadow-pink-500/25 ${festiveGradient} flex items-center justify-center gap-2`}
                            >
                                {isVerified ? (
                                    <>
                                        Done
                                    </>
                                ) : (
                                    "Close"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    )

}
