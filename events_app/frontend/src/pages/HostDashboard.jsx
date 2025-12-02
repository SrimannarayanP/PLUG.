// HostDashboard.jsx


import React, {useState, useEffect} from 'react'
import {useNavigate} from 'react-router-dom'
import api from '../api/api'
import LoadingSpinner from '../components/common/LoadingSpinner'


const API_BASE_URL = import.meta.env.VITE_API_URL


export default function HostDashboard() {

    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        const fetchMyEvents = async () => {
            try {
                const res = await api.get('/api/host/events/')
                
                console.log("HOST EVENTS DATA:", res.data)

                setEvents(res.data.results || res.data)
            } catch (err) {
                console.error("Failed to fetch host events", err)
            } finally {
                setLoading(false)
            }
        }

        fetchMyEvents()
    }, [])

    if (loading) return <LoadingSpinner />

    return (

        <div className = "min-h-screen bg-[#eae5dc] p-6 md:p-12">
            <div className = "max-w-7xl mx-auto">
                {/* Header */}
                <div className = "flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
                    <div>
                        <h1 className = "text-4xl md:text-5xl font-black text-[#6f2d37] font-outfit">
                            Host Dashboard
                        </h1>

                        <p className = "text-[#6f2d37]/70 mt-2">
                            Manage your events & check in attendees.
                        </p>
                    </div>

                    <button
                        onClick = {() => navigate('/host/create-event')}
                        className = "bg-[#c90000] text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:brightness-110 transition-all active:scale-95"
                    >
                        + Create New Event
                    </button>
                </div>

                {/* Events grid */}
                {events.length === 0 ? (
                    <div className = "text-center py-20 bg-white/50 rounded-3xl border-2 border-dashed border-[#6f2d37]/20">
                        <h2 className = "text-2xl font-bold text-[#6f2d37]/50">No events created yet.</h2>
                    </div>
                ) : (
                    <div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {events.map(event => (
                            <div key = {event.id} className = "bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col hover:shadow-2xl transition-shadow duration-300">
                                {/* Event Image */}
                                <div className = "h-48 w-full bg-gray-200 relative">
                                    {event.poster_image ? (
                                        <img 
                                            src = {`${API_BASE_URL}${event.poster_image}`}
                                            alt = {event.event_name}
                                            className = "w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className = "flex items-center justify-center h-full text-[#6f2d37]/40 font-bold">
                                            No Poster
                                        </div>
                                    )}

                                    <div className = "absolute top-4 right-4 bg-white/90 px-3 py-1 rounded-full text-xs font-bold text-[#6f2d37] shadow-sm">
                                        {event.is_native ? 'Native' : 'External'}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className = "p-6 flex-1 flex flex-col">
                                    <h3 className = "text-2xl font-bold text-[#6f2d37] mb-1 line-clamp-1">
                                        {event.event_name}
                                    </h3>

                                    <p className = "text-sm text-[#6f2d37]/60 font-medium mb-4">
                                        {event.start_date}
                                    </p>

                                    <div className = "mt-auto pt-4 flex gap-3">
                                        {/* Scanner button */}
                                        <button
                                            onClick = {() => navigate('/scan')}
                                            className = "flex-1 bg-[#265742] text-white py-3 rounded-lg font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2"
                                        >
                                            <svg
                                                xmlns = 'http://www.w3.org/2000/svg'
                                                className = "h-5 w-5"
                                                fill = 'none'
                                                viewBox = "0 0 24 24"
                                                stroke = 'currentColor'
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                            </svg>
                                        </button>

                                        {/* Edit button (Abhi ke liye placeholder hai ye) */}
                                        <button className = "px-4 py-3 rounded-lg border-2 border-[#6f2d37]/20 text-[#6f2d37] font-bold hover:bg-[#6f2d37]/5 transition-colors">
                                            Edit
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

    )

}
