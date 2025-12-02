// TicketModal.jsx


import React from 'react'


export default function TicketModal({ticket, closeModal}) {

    const event = ticket.event

    return (

        <div
            className = "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm"
            onClick = {closeModal}
        >
            <div
                className = "relative w-full max-w-sm bg-[#eae5dc] rounded-3xl shadow-2xl overflow-hidden transform transition-all"
                onClick = {(e) => e.stopPropagation()}
            >
                {/* Header/Close */}
                <button
                    onClick = {closeModal}
                    className = "absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/40 text-[#6f2d37] rounded-full p-2 font-bold transition-colors"
                >
                    &times; {/* HTML property that represents the multiplication sign */}
                </button>

                {/* Top half - Event info */}
                <div className = "bg-[#6f2d37] p-8 text-center relative overflow-hidden">
                    <div className = "absolute -bottom-3 -left-3 w-6 h-6 bg-[#eae5dc] rounded-full"></div>
                    <div className = "absolute -bottom-3 -right-3 w-6 h-6 bg-[#eae5dc] rounded-full"></div>

                    <h2 className = "text-2xl font-black text-[#eae5dc] mb-2 font-outfit leading-tight">
                        {event.event_name}
                    </h2>

                    <p className = "text-[#eae5dc]/70 text-sm font-medium uppercase tracking-widest">
                        Admit One
                    </p>
                </div>

                {/* Bottom half - QR code */}
                <div className = "p-8 flex flex-col items-center">
                    <div className = "bg-white p-3 rounded-xl shadow-inner border-2 border-[#6f2d37]/10 mb-6">
                        {/* The image string from the backend */}
                        <img 
                            src = {ticket.qr_code}
                            alt = "Ticket QR"
                            className = "w-48 h-48 object-contain"
                        />
                    </div>

                    <div className = "text-center space-y-1">
                        <p className = "text-[#6f2d37] font-bold text-lg">
                            {ticket.checked_in ? (
                                <span className = "text-red-600 bg-red-100 px-3 py-1 rounded-full text-xs uppercase">
                                    Already Checked In
                                </span>
                            ) : (
                                "Scan at Entry"
                            )}
                        </p>

                        <p className = "text-[#6f2d37]/50 text-xs">
                            {event.start_date} • {event.location}
                        </p>
                    </div>

                    <button
                        onClick = {closeModal}
                        className = "mt-8 w-full py-3 rounded-xl font-bold text-white shadow-lg transform transition-transform active:scale-95"
                        style = {{backgroundColor : '#c90000'}}
                    >
                        Close Ticket
                    </button>
                </div>
            </div>
        </div>

    )

}
