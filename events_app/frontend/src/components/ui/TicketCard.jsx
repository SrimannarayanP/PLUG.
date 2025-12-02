// TicketCard.jsx


import React, {useState} from 'react'
import TicketModal from './TicketModal'


const API_BASE_URL = import.meta.env.VITE_API_URL


export default function TicketCard({ticket}) {

    const event = ticket.event
    const [isModalOpen, setIsModalOpen] = useState(false)
    
    const posterUrl = event.poster_image
        ? `${API_BASE_URL}${event.poster_image}`
        : null

    return (

        <>
            <div className = "bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col hover:shadow-2xl transition-all duration-300 border border-[#6f2d37]/10">
                {/* Image section */}
                <div className = "h-40 w-full bg-gray-200 relative">
                    {posterUrl && (
                        <img 
                            src = {posterUrl} 
                            alt = {event.event_name} 
                            className = "w-full h-full object-cover" 
                        />
                    )}

                    <div className = "absolute top-3 right-3 bg-white/90 px-3 py-1 rounded-full text-xs font-bold text-[#6f2d37]">
                        {ticket.checked_in ? 'USED' : 'VALID'}
                    </div>
                </div>

                {/* Content */}
                <div className = "p-6 flex-1 flex flex-col">
                    <h3 className = "text-xl font-bold text-[#6f2d37] mb-1 line-clamp-1"> {/* line-clamp will help truncate after the specified no. of lines */} 
                        {event.event_name}
                    </h3>

                    <p className = "text-xs text-[#6f2d37]/60 font-bold uppercase mb-4">
                        {event.start_date}
                    </p>

                    <button
                        onClick = {() => setIsModalOpen(true)}
                        className = "mt-auto w-full py-3 bg-[#6f2d37] text-white font-bold rounded-lg hover:bg-[#8a3844] transition-colors flex items-center justify-center gap-2"
                    >
                        <svg
                            xmlns = 'http://www.w3.org/2000/svg'
                            className = "h-5 w-5"
                            fill = 'none'
                            viewBox = "0 0 24 24"
                            stroke = 'currentColor'
                        >
                            <path
                                strokeLinecap = 'round'
                                strokeLinejoin = 'round'
                                strokeWidth = {2}
                                d = "M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                            ></path>
                        </svg>
                        View Tickets
                    </button>
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
