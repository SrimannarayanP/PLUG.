// HostDashboard.jsx


import {useState, useEffect, useCallback} from 'react'
import {useNavigate} from 'react-router-dom'
import {Plus, ScanLine, Edit, Calendar, ImageOff, Layers, Trash2, MapPin, Users, BarChart3, ArrowRight} from 'lucide-react'
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

    const formatDate = (dateString) => {
        if (!dateString) return "Date TBD"

        const date = new Date(dateString)

        return date.toLocaleDateString('en-US', {
            month : 'short',
            day : 'numeric',
            year : 'numeric',
            hour : 'numeric',
            minute : '2-digit',
        })
    }

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
                if (url === '/api/host/events/') return newEvents

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
            await api.delete(`/api/host/events/${eventId}/`)

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

    useEffect(() => {
        fetchEvents()
    }, [])

    // Scroll trigger
    useEffect(() => {
        if (inView && nextPage && !loading && !loadingMore) {
            fetchEvents(nextPage)
        }
    }, [inView, nextPage, loading, loadingMore, fetchEvents])

    const festiveGradient = "bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600"

    if (loading) return <LoadingSpinner />

    return (

        <div className = "min-h-screen bg-[#09090b] text-white font-sans relative overflow-x-hidden selection:bg-orange-500 selection:text-white pb-24 md:pb-12">
            <div 
                className = "fixed inset-0 opacity-[0.03] pointer-events-none z-0"
                style = {{
                    backgroundImage : "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
                    backgroundSize : "40px 40px"
                }}
            />

            <div className = "max-w-7xl mx-auto relative z-10 px-4 sm:px-6 lg:px-8 pt-8">
                {/* Header */}
                <div className = "flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-6 border-b border-zinc-800/50 pb-6">
                    <div className = 'space-y-2'>
                        <h1 className = "text-3xl md:text-5xl font-black text-white uppercase tracking-tighter flex items-center gap-3 font-outfit">
                            <Layers className = "h-8 md:h-10 w-8 md:w-10 text-orange-500" />
                            
                            Dashboard
                        </h1>

                        <p className = "text-zinc-500 mt-2 font-medium uppercase tracking-wide text-xs md:text-sm flex flex-wrap gap-2">
                            <span>Manage Events</span> • <span>Monitor Attendance</span> • <span>Scan Tickets</span>
                        </p>
                    </div>

                    <button
                        onClick = {() => navigate('/host/create-event')}
                        className = {`group hidden md:flex items-center gap-2 px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-sm transition-all active:scale-95 shadow-lg shadow-orange-900/20 text-white ${festiveGradient} hover:brightness-110`}
                    >
                        <Plus className = "h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                        
                        Create Event
                    </button>
                </div>

                {/* Events grid */}
                {events.length === 0 ? (
                    <div className = "flex flex-col items-center justify-center py-32 bg-[#18181b] border border-zinc-800 border-dashed rounded-3xl mx-auto max-w-2xl animate-in fade-in zoom-in duration-500">
                        <div className = "h-20 w-20 bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 rounded-full shadow-inner">
                            <Calendar className = "w-8 h-8 text-zinc-600" />
                        </div>

                        <h2 className = "text-xl md:text-2xl font-bold text-zinc-400 uppercase tracking-widest text-center">
                            No Active Events
                        </h2>

                        <p className = "text-zinc-600 text-sm text-center mt-3 font-mono max-w-xs md:max-w-md px-4">
                            The stage is empty. Launch your first experience now!
                        </p>
                    </div>
                ) : (
                    <>
                        <div className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {events.map(event => (
                                <div 
                                    key = {event.id}
                                    onClick = {() => handleCardClick(event.id)} 
                                    className = " group bg-[#18181b] border border-zinc-800 hover:border-orange-500/50 rounded-2xl overflow-hidden flex flex-col shadow-lg hover:shadow-orange-900/10 hover:shadow-2xl transition-all duration-300 cursor-pointer relative active:scale-[0.98]"
                                >
                                    {/* Poster Section */}
                                    <div className = "aspect-video w-full bg-zinc-900 relative border-b border-zinc-800 overflow-hidden">
                                        {event.poster ? (
                                            <>
                                                <img 
                                                    src = {getImageUrl(event.poster)}
                                                    alt = {event.name}
                                                    className = "h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                />

                                                <div className = "absolute inset-0 bg-gradient-to-t from-[#18181b] via-transparent to-transparent opacity-80" />
                                            </>
                                        ) : (
                                            <div className = "flex flex-col items-center justify-center h-full text-zinc-700 font-bold gap-2 bg-zinc-900/50">
                                                <ImageOff className = "h-8 w-8 opacity-40" />

                                                <span className = "text-[10px] uppercase tracking-widest opacity-60">
                                                    No Poster
                                                </span>
                                            </div>
                                        )}

                                        <div className = "absolute top-3 right-3">
                                            <span className = {`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border backdrop-blur-md shadow-sm border ${
                                                event.is_native
                                                    ? "bg-orange-500/90 text-white border-orange-400/20"
                                                    : "bg-zinc-800/90 text-zinc-300 border-zinc-600"
                                                }`}
                                            >
                                                {event.is_native ? "Native Event" : "External"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content Section */}
                                    <div className = "p-4 md:p-5 flex-1 flex flex-col justify-between">
                                        <div>
                                            <h3 className = "text-lg font-bold text-white mb-3 line-clamp-1 group-hover:text-orange-500 transition-colors">
                                                {event.name}
                                            </h3>

                                            <div className = 'space-y-2'>
                                                <div className = "flex items-center text-zinc-400 text-xs font-medium tracking-wide gap-2.5">
                                                    <Calendar className = "h-4 w-4 text-orange-500 shrink-0" />

                                                    {formatDate(event.start_date)}
                                                </div>

                                                <div className = "flex items-center text-zinc-500 text-xs font-medium tracking-wide gap-2.5">
                                                    <MapPin className = "h-4 w-4 shrink-0" />

                                                    <span className = 'truncate'>
                                                        {event.location_type === 'online'
                                                            ? (event.virtual_location || "Online")
                                                            : (event.physical_location || "TBA")
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className = "mt-5 pt-4 flex items-center gap-2 border-t border-zinc-800/50">
                                            {/* Scanner button */}
                                            <button
                                                onClick = {(e) => handleScanClick(e, event.id)}
                                                className = "flex-1 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-white h-10 py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                                            >
                                                <ScanLine className = "h-4 w-4 text-orange-500" />

                                                Scan
                                            </button>
                                            
                                            <div className = "flex gap-1">
                                                {/* Edit button */}
                                                <button
                                                    onClick = {(e) => handleEditClick(e, event)} 
                                                    className = "h-10 w-10 rounded-lg border border-zinc-800 hover:border-zinc-600 bg-zinc-900 active:bg-zinc-800 text-zinc-400 hover:text-white transition-all flex items-center justify-center"
                                                >
                                                    <Edit className = "h-4 w-4" />
                                                </button>
                                                
                                                {/* Trash button */}
                                                <button
                                                    onClick = {(e) => handleCancelEvent(e, event.id)}
                                                    className = "h-10 w-10 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 text-red-500 border border-red-500/20 transition-all flex items-center justify-center"
                                                >
                                                    <Trash2 className = "h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {nextPage && (
                            <div
                                ref = {ref}
                                className = "w-full flex justify-center py-12"
                            >
                                <Loader2 className = "h-8 w-8 text-orange-500 animate-spin" />
                            </div>
                        )}

                        {!nextPage && events.length > 0 && (
                            <div className = "flex items-center justify-center gap-4 py-12 opacity-40">
                                <div className = "h-px w-12 bg-zinc-800" />

                                <p className = "text-center text-zinc-700 text-xs font-mono uppercase tracking-widest py-8">
                                    End of Events
                                </p>

                                <div className = "h-px w-12 bg-zinc-800" />
                            </div>
                        )}
                    </>
                )}
            </div>

            <button
                onClick = {() => navigate('/host/create-event')}
                className = {`md:hidden fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full ${festiveGradient} shadow-xl shadow-orange-900/30 flex items-center justify-center text-white active:scale-90 transition-transform duration-300`}
                aria-label = "Create Event"
            >
                <Plus className = "h-7 w-7" />
            </button>
        </div>

    )

}
