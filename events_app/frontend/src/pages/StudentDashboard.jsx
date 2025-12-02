// StudentDashboard.jsx


import React, {useEffect, useState} from 'react';
import api from '../api/api'
import LoadingSpinner from '../components/common/LoadingSpinner'
import TicketCard from '../components/ui/TicketCard'


export default function StudentDashboard() {

    const [tickets, setTickets] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchTickets = async () => {
            try {
                const res = await api.get('/api/events/registered/')
                
                setTickets(res.data.results || res.data)
            } catch (err) {
                console.error("Failed to fetch tickets", err)
            } finally {
                setLoading(false)
            }
        }

        fetchTickets()
    }, [])

    if (loading) return <LoadingSpinner />

    return (

        <div className = "min-h-screen bg-[#eae5dc] p-6 md:p-12">
            <div className = "max-w-7xl mx-auto">
                <h1 className = "text-4xl md:text-5xl font-black text-[#6f2d37] font-outfit mb-2">
                    My Tickets
                </h1>

                <p className = "text-[#6f2d37]/70 mb-12">
                    Your upcoming events & QR codes.
                </p>

                {tickets.length === 0 ? (
                    <div className = "text-center py-20 bg-white/50 rounded-3xl border-2 border-dashed border-[#6f2d37]/20">
                        <h2 className = "text-2xl font-bold text-[#6f2d37]/50">
                            You haven't registered for anything yet.
                        </h2>
                    </div>
                ) : (
                    <div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {tickets.map(ticket => (
                            // We pass the whole Ticket object (which contains the event)
                            <TicketCard key = {ticket.id} ticket = {ticket} />
                        ))}
                    </div>
                )}
            </div>
        </div>

    )
}
