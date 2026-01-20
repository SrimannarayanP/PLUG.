// HostDashboard.jsx


import {useState, useEffect, useCallback} from 'react'
import {useNavigate, Link} from 'react-router-dom'
import {Plus, ScanLine, Edit, Calendar, ImageOff, Layers, Trash2} from 'lucide-react'
import {toast} from 'react-hot-toast'
import {useInView} from 'react-intersection-observer'

import api from '../api/api'

import {getImageUrl} from '../utils/imageHelper'

import LoadingSpinner from '../components/common/LoadingSpinner'


export default function HostDashboard() {

    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(true)

    const [loadingMore, setLoadingMore] = useState(false)
    const [nextPage, setNextPage] = useState(null)

    const navigate = useNavigate()

    const {ref, inView} = useInView({
        threshold : 0,
        rootMargin : '200px',
    })

    const fetchEvents = useCallback(async (url = '/api/host/events/') => {
        // Prevent double-fetching
        if (loadingMore) return

        // Only set loadingMore if it's not the 1st load
        if (url !== '/api/host/events/') setLoadingMore(true)

        try {
            const res = await api.get(url)
            const data = res.data
            const newEvents = data.results || data
            const nextLink = data.next || null

            setEvents(prev => {
                // If page 1, replace everything
                if (url === '/api/host/events/') {

                    return newEvents

                }

                // If page 2+, append unique/non-duplicate events
                const existingIds = new Set(prev.map(e => e.id))
                const uniqueNew = newEvents.filter(e => !existingIds.has(e.id))

                return [...prev, ...uniqueNew]
            })

            setNextPage(nextLink)
        } catch (err) {
            console.error("Failed to fetch host events", err)

            toast.error("Failed to load events")
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }, [loadingMore])

    useEffect(() => {
        fetchEvents()
    }, [])

    // Scroll trigger
    useEffect(() => {
        if (inView && nextPage && !loading && !loadingMore) {
            fetchEvents(nextPage)
        }
    }, [inView, nextPage, loading, loadingMore, fetchEvents])

    // If the card is clicked, host gets redirected to ManageAttendees
    const handleCardClick = (eventId) => {
        navigate(`/host/event/${eventId}/`)
    }

    const handleEditClick = async(e, event) => {
        e.stopPropagation() // Prevents triggering handleCardClick

        navigate('/host/create-event', {state : {eventToEdit : event}})
    }

    const handleCancelEvent = async(e, eventId) => {
        e.stopPropagation()

        if (!window.confirm("Are you sure you want to cancel this event? This action cannot be undone.")) return

        try {
            await api.delete(`/api/events/${eventId}/`)

            toast.success("Event cancelled successfully")

            setEvents(currentEvents => currentEvents.filter(e => e.id !== eventId))
        } catch (err) {
            console.error("Failed to cancel event", err)

            toast.error("Could not cancel event")
        }
    }

    const handleScanClick = (e) => {
        e.stopPropagation()

        navigate('/host/scan')
    }

    // const handleApprove = async (regId) => {
    //     try {
    //         await api.post('/api/host/process-payment/', {
    //             registration_id : regId,
    //             action : 'approve'
    //         })

    //         alert("Verified! Ticket sent.")
    //     } catch (err) {
    //         console.error(err)
    //     }
    // }

    if (loading) return <LoadingSpinner />

    return (

        <div className = "min-h-screen bg-[#09090b] text-white p-6 md:p-12 font-sans relative overflow-hidden selection:bg-orange-500 selection:text-white">
            <div 
                className = "absolute inset-0 opacity-[0.03] pointer-events-none"
                style = {{
                    backgroundImage : "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)"
                }}
            ></div>

            <div className = "max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className = "flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6 border-b border-zinc-800 pb-8">
                    <div>
                        <h1 className = "text-4xl md:text-5xl font-black text-white uppercase tracking-tighter flex items-center gap-3 font-outfit">
                            <Layers className = "w-8 h-8 md:w-10 md:h-10 text-orange-500" />
                            
                            Host Dashboard
                        </h1>

                        <p className = "text-zinc-500 mt-2 font-medium uppercase tracking-wide text-xs md:text-sm">
                            Manage Events | Monitor Attendance | Scan Tickets
                        </p>
                    </div>

                    <button
                        onClick = {() => navigate('/host/create-event')}
                        className = "group flex items-center gap-2 bg-white text-black px-6 py-3 uppercase font-bold tracking-widest text-sm hover:bg-zinc-200 transition-all active:scale-95"
                    >
                        <Plus className = "w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                        
                        Create Event
                    </button>
                </div>

                {/* Events grid */}
                {events.length === 0 ? (
                    <div className = "flex flex-col items-center justify-center py-32 bg-[#18181b] border border-zinc-800 border-dashed">
                        <div className = "w-16 h-16 bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 rounded-full">
                            <Calendar className = "w-8 h-8 text-zinc-600" />
                        </div>

                        <h2 className = "text-xl font-bold text-zinc-500 uppercase tracking-widest">
                            No Active Events
                        </h2>

                        <p className = "text-zinc-600 text-xs mt-2 font-mono">
                            You haven't created any events yet.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {events.map(event => (
                                <div 
                                    key = {event.id}
                                    onClick = {() => handleCardClick(event.id)} 
                                    className = " group bg-[#18181b] border border-zinc-800 hover:border-orange-400 flex flex-col shadow-2xl transition-colors duration-300"
                                >
                                    {/* Event Image */}
                                    <div className = "h-48 w-full bg-zinc-900 relative border-b border-zinc-800 overflow-hidden">
                                        {event.poster_field ? (
                                            <img 
                                                src = {getImageUrl(event.poster_field)}
                                                alt = {event.event_name}
                                                className = "w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity grayscale group-hover:grayscale-0 duration-500"
                                            />
                                        ) : (
                                            <div className = "flex flex-col items-center justify-center h-full text-zinc-700 font-bold gap-2">
                                                <ImageOff className = "w-8 h-8 opacity-50" />

                                                <span className = "text-xs uppercase tracking-widest">
                                                    No Poster
                                                </span>
                                            </div>
                                        )}

                                        <div className = "absolute top-4 right-4">
                                            <span className = {`px-3 py-1 text-[10px] font-bold uppercase tracking-widest border backdrop-blur-md ${
                                                event.is_native
                                                    ? "bg-orange-500/10 border-orange-500/20 text-orange-500"
                                                    : "bg-zinc-800/80 border-zinc-700 text-zinc-400"
                                                }`}
                                            >
                                                {event.is_native ? "Native Event" : "External Link"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className = "p-6 flex-1 flex flex-col">
                                        <div className = 'mb-4'>
                                            <h3 className = "text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-orange-500 transition-colors">
                                                {event.event_name}
                                            </h3>

                                            <div className = "flex items-center text-zinc-500 text-xs font-mono uppercase tracking-wide gap-2">
                                                <Calendar className = "w-3 h-3" />

                                                {event.start_date}
                                            </div>
                                        </div>

                                        <div className = "mt-auto pt-4 flex gap-2">
                                            {/* Scanner button */}
                                            <button
                                                onClick = {handleScanClick}
                                                className = "flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-2 font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-zinc-700 hover:border-zinc-500"
                                            >
                                                <ScanLine className = "w-4 h-4" />

                                                Scan
                                            </button>

                                            {/* Edit button */}
                                            <button
                                                onClick = {(e) => handleEditClick(e, event)} 
                                                className = "px-3 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 hover:bg-zinc-800 transition-all flex items-center justify-center"
                                            >
                                                <Edit className = "w-4 h-4" />
                                            </button>

                                            <button
                                                onClick = {(e) => handleCancelEvent(e, event.id)}
                                                className = "px-3 bg-red-900/10 hover:bg-red-900/30 text-red-500 border border-red-900/20 hover:border-red-500/50 transition-all flex items-center justify-center"
                                            >
                                                <Trash2 className = "w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {nextPage && (
                            <div
                                ref = {ref}
                                className = "w-full flex justify-center py-8"
                            >
                                <Loader2 className = "w-8 h-8 text-orange-500 animate-spin" />
                            </div>
                        )}

                        {!nextPage && events.length > 0 && (
                            <p className = "text-center text-zinc-700 text-xs font-mono uppercase tracking-widest py-8">
                                - End of Events -
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>

    )

}
