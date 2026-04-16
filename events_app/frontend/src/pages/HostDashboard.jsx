// HostDashboard.jsx


import {ArrowLeft, Ban, Calendar, Edit, ImageOff, Layers, Loader2, MapPin, Plus, ScanLine, Trash2, Users} from 'lucide-react'
import {useCallback, useEffect, useState} from 'react'
import {toast} from 'react-hot-toast'
import {useInView} from 'react-intersection-observer'
import {useNavigate} from 'react-router-dom'

import api from '../api/api'

import {getImageUrl} from '../utils/imageHelper'

import LoadingSpinner from '../components/common/LoadingSpinner'
import ConfirmDialog from '../components/common/ConfirmDialog'
import ClubSettings from '../components/ui/ClubSettings'

import Unauthorized from './Unauthorized'


export default function HostDashboard() {

    const [activeTab, setActiveTab] = useState('events')

    const [currentUser, setCurrentUser] = useState(null)
    const [clubProfile, setClubProfile] = useState(null)
    const [profileLoading, setProfileLoading] = useState(true)

    const [events, setEvents] = useState([])
    const [eventsLoading, setEventsLoading] = useState(true)

    const [loadingMore, setLoadingMore] = useState(false)
    const [nextPage, setNextPage] = useState(null)

    const [dialogConfig, setDialogConfig] = useState({isOpen : false, actionType : null, eventId : null})

    const navigate = useNavigate()

    const {ref, inView} = useInView({threshold : 0, rootMargin : '200px'})

    const NAV_ITEMS = [
        {id : 'events', label : 'Events', icon : Calendar},
        {id : 'team', label : 'Team', icon : Users}
    ]

    const festiveGradient = "bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600"

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

    const fetchUserProfile = async () => {
        try {
            const res = await api.get('/api/user/profile/')

            setCurrentUser(res.data)
            setClubProfile(res.data.profile)
        } catch (error) {
            toast.error("Failed to load host profile")
        } finally {
            setProfileLoading(false)
        }
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
            setEventsLoading(false)
            setLoadingMore(false)
        }
    }, [loadingMore])

    useEffect(() => {
        fetchUserProfile()
        fetchEvents()
    }, [])

    // Scroll trigger
    useEffect(() => {
        if (activeTab === 'events' && inView && nextPage && !eventsLoading && !loadingMore) {
            fetchEvents(nextPage)
        }
    }, [inView, nextPage, eventsLoading, loadingMore, fetchEvents, activeTab])

    // If the card is clicked, host gets redirected to ManageAttendees
    const handleCardClick = (eventId) => {
        navigate(`/host/event/${eventId}`)
    }

    const handleEditClick = async(e, event) => {
        e.stopPropagation() // Prevents triggering handleCardClick

        navigate('/host/create-event', {state : {eventToEdit : event}})
    }

    const handleCancelEvent = async(e, eventId) => {
        e.stopPropagation()

        setDialogConfig({isOpen : true, actionType : 'cancel', eventId})
    }

    const handleDeleteEvent = async(e, eventId) => {
        e.stopPropagation()

        setDialogConfig({isOpen : true, actionType : 'delete', eventId})
    }

    const handleScanClick = (e, isCancelled) => {
        e.stopPropagation()

        if (isCancelled) {
            toast.error("Cannot scan tickets for a cancelled event.")

            return
        }

        navigate('/host/scan')
    }

    const closeDialog = () => {
        setDialogConfig({isOpen : false, actionType : null, eventId : null})
    }

    const executeConfirmedAction = async () => {
        const {actionType, eventId} = dialogConfig

        if (!eventId) return

        if (actionType === 'cancel') {
            try {
                await api.patch(`/api/host/edit/${eventId}/`, {is_cancelled : true})

                toast.success("Event cancelled successfully. Refunds initiated.")

                fetchEvents()
            } catch (err) {
                console.error("Failed to cancel event", err)

                toast.error(err.response?.data?.is_cancelled || err.response?.data?.error || "Could not cancel event.")
            }
        } else if (actionType === 'delete') {
            try {
                await api.delete(`/api/host/edit/${eventId}/`)

                toast.success("Event permanently deleted.")

                setEvents(currentEvents => currentEvents.filter(e => e.id !== eventId))
            } catch (err) {
                console.error("Failed to delete event", err)

                toast.error(err.response?.data?.error || "Could not delete the event.")
            }
        }

        closeDialog()
    }

    if (profileLoading || (eventsLoading && events.length === 0)) return <LoadingSpinner />

    if (!clubProfile?.host_type) return <Unauthorized />

    return (

        <div className = "min-h-[calc(100vh-72px)] md:min-h-[calc(100vh-96px)] bg-[#09090b] text-white font-sans flex flex-col md:flex-row relative overflow-x-hidden selection:bg-orange-500 selection:text-white pb-24 md:pb-12">
            <div 
                className = "fixed inset-0 opacity-[0.03] pointer-events-none z-0"
                style = {{
                    backgroundImage : "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
                    backgroundSize : "40px 40px"
                }}
            />

            <aside className = "hidden md:flex flex-col h-[calc(100vh-72px)] md:h-[calc(100vh-96px)] w-64 sticky top-[72px] md:top-[96px] border-r border-zinc-800/50 bg-[#09090b]/80 backdrop-blur-xl z-40 p-6">
                <div className = "flex flex-col items-start mb-10">
                    <h2 className = "text-2xl font-black text-white tracking-tighter break-words line-clamp-3 font-outfit">
                        {clubProfile.name}
                    </h2>

                    <div className = "mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-orange-500/10 border border-orange-500/20 w-fit">
                        <span className = "h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse shrink-0" />
                        
                        <span className = "text-[10px] font-bold text-orange-500 uppercase tracking-widest whitespace-nowrap">
                            Host Mode
                        </span>
                    </div>
                </div>

                <nav className = "flex-1 space-y-2">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon
                        const isActive = activeTab === item.id

                        return (

                            <button
                                key = {item.id}
                                onClick = {() => setActiveTab(item.id)}
                                className = {`
                                    w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all
                                    ${isActive
                                        ? "bg-zinc-800 text-orange-500"
                                        : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                                    }
                                `}
                            >
                                <Icon className = "h-5 w-5" />

                                {item.label}
                            </button>

                        )
                    })}
                </nav>
            </aside>

            <main className = "flex-1 min-w-0 relative z-10 pb-24 md:pb-12 px-4 sm:px-6 lg:px-8 pt-8">
                <div className = "flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-zinc-800/50 pb-6 md:border-none md:pb-0">
                    {/* Header */}
                    <div className = "md:hidden flex items-center justify-between w-full">
                        <h2 className = "text-xl font-black uppercase tracking-tighter text-white flex items-center gap-2 font-outfit">
                            <Layers className = "h-5 w-5 text-orange-500" />
                            
                            {clubProfile.name}
                        </h2>

                        <button
                            onClick = {() => navigate('/')}
                            className = "flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-800"
                        >
                            <ArrowLeft className = "h-3 w-3" />

                            Student
                        </button>
                    </div>

                    {/* Desktop Title */}
                    <h1 className = "hidden md:block text-3xl font-black uppercase tracking-tighter">
                        {NAV_ITEMS.find(i => i.id === activeTab)?.label}
                    </h1>

                    {activeTab === 'events' && (
                        <button
                            onClick = {() => navigate('/host/create-event')}
                            className = {`
                                group hidden md:flex items-center gap-2 px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-sm transition-all active:scale-95
                                shadow-lg shadow-orange-900/20 text-white ${festiveGradient} hover:brightness-110
                            `}
                        >
                            <Plus className = "h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                            
                            Create Event
                        </button>
                    )}
                </div>

                {/* Dynamic Content */}
                <div className = "animate-in fade-in duration-500">
                    {activeTab === 'team' && (
                        <ClubSettings
                            currentUser = {currentUser}
                            clubProfile = {clubProfile}
                            refreshProfile = {fetchUserProfile}
                        />
                    )}

                    {activeTab === 'events' && (
                        <>
                            {events.length === 0 && !eventsLoading ? (
                                <div className = "flex flex-col items-center justify-center py-32 bg-[#18181b] border border-zinc-800 border-dashed rounded-3xl mx-auto max-w-2xl">
                                    <div className = "h-20 w-20 bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 rounded-full shadow-inner">
                                        <Calendar className = "h-8 w-8 text-zinc-600" />
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
                                                className = {`
                                                    group bg-[#18181b] border border-zinc-800 hover:border-orange-500/50 rounded-2xl overflow-hidden flex flex-col
                                                    shadow-lg hover:shadow-orange-900/10 hover:shadow-2xl transition-all duration-300 cursor-pointer relative
                                                    active:scale-[0.98]
                                                    ${event.is_cancelled
                                                        ? "border-red-900/50 opacity-80"
                                                        : 'border-zinc-800'
                                                    }
                                                `}
                                            >
                                                {/* Poster Section */}
                                                <div className = "aspect-video w-full bg-zinc-900 relative border-b border-zinc-800 overflow-hidden">
                                                    {event.poster ? (
                                                        <>
                                                            <img 
                                                                src = {getImageUrl(event.poster)}
                                                                alt = {event.name}
                                                                className = {`
                                                                    h-full w-full object-cover group-hover:scale-105 transition-transform duration-700
                                                                    ${event.is_cancelled
                                                                        ? "grayscale contrast-125"
                                                                        : 'group-hover:scale-105'
                                                                    }
                                                                `}
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
                                                        {event.is_cancelled ? (
                                                            <span className = "px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border backdrop-blur-md shadow-sm bg-red-500/90 text-white border-red-400/20 flex items-center gap-1">
                                                                <Ban className = "h-3 w-3" />

                                                                Cancelled
                                                            </span>
                                                        ) : (
                                                            <span />
                                                        )}

                                                        <span className = {`
                                                            px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border backdrop-blur-md shadow-sm
                                                            ${event.is_native
                                                                ? "bg-orange-500/90 text-white border-orange-400/20"
                                                                : "bg-zinc-800/90 text-zinc-300 border-zinc-600"
                                                            }`}
                                                        >
                                                            {event.is_native ? "Native Event" : 'External'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Content Section */}
                                                <div className = "p-4 md:p-5 flex-1 flex flex-col justify-between">
                                                    <div>
                                                        <h3
                                                            className = {`
                                                                text-lg font-bold text-white mb-3 line-clamp-1 transition-colors
                                                                ${event.is_cancelled
                                                                    ? 'text-zinc-500'
                                                                    : "text-white group-hover:text-orange-500"
                                                                }
                                                            `}
                                                        >
                                                            {event.name}
                                                        </h3>

                                                        <div className = 'space-y-2'>
                                                            <div className = "flex items-center text-zinc-400 text-xs font-medium tracking-wide gap-2.5">
                                                                <Calendar
                                                                    className = {`
                                                                        h-4 w-4 text-orange-500 shrink-0
                                                                        ${event.is_cancelled
                                                                            ? 'text-zinc-600'
                                                                            : 'text-orange-500'
                                                                        }
                                                                    `}
                                                                />

                                                                {formatDate(event.start_date)}
                                                            </div>

                                                            <div className = "flex items-center text-zinc-500 text-xs font-medium tracking-wide gap-2.5">
                                                                <MapPin className = "h-4 w-4 shrink-0" />

                                                                <span className = 'truncate'>
                                                                    {event.location_type === 'online'
                                                                        ? (event.virtual_location || 'Online')
                                                                        : (event.physical_location || 'TBA')
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className = "mt-5 pt-4 flex items-center gap-2 border-t border-zinc-800/50">
                                                        {event.is_cancelled ? (
                                                            <div className = "flex-1 bg-red-500/5 border border-red-500/10 text-red-500/50 h-10 py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-widest flex items-center justify-center">
                                                                {!event.is_paid_event
                                                                    ? 'Cancelled'
                                                                    : event.has_pending_refunds
                                                                        ? "Refunds Processing"
                                                                        : "Refunds Complete"
                                                                }
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick = {(e) => handleScanClick(e, event.is_cancelled)}
                                                                className = "flex-1 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-white h-10 py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                                                            >
                                                                <ScanLine className = "h-4 w-4 text-orange-500" />

                                                                Scan
                                                            </button>
                                                        )}
                                                        
                                                        <div className = "flex gap-1">
                                                            {!event.is_cancelled && (
                                                                <>
                                                                    {/* Edit event button */}
                                                                    <button
                                                                        onClick = {(e) => handleEditClick(e, event)}
                                                                        title = "Edit Event"
                                                                        className = "h-10 w-10 rounded-lg border border-zinc-800 hover:border-zinc-600 bg-zinc-900 active:bg-zinc-800 text-zinc-400 hover:text-white transition-all flex items-center justify-center"
                                                                    >
                                                                        <Edit className = "h-4 w-4" />
                                                                    </button>
                                                                    
                                                                    {/* Cancel event button */}
                                                                    <button
                                                                        onClick = {(e) => handleCancelEvent(e, event.id)}
                                                                        title = "Cancel Event & Refund"
                                                                        className = "h-10 w-10 px-3 rounded-lg bg-orange-500/10-900 hover:bg-orange-500/20 active:bg-orange-500/30 border border-orange-500/20 transition-all flex items-center justify-center"
                                                                    >
                                                                        <Ban className = "h-4 w-4" />
                                                                    </button>
                                                                </>
                                                            )}

                                                            {/* Delete event button */}
                                                            <button
                                                                onClick = {(e) => handleDeleteEvent(e, event.id)}
                                                                title = "Permanently Delete"
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
                        </>
                    )}
                </div>
            </main>

            <nav className = "md:hidden fixed bottom-0 inset-x-0 bg-[#09090b]/90 backdrop-blur-xl border-t border-zinc-800/50 z-50 flex items-center justify-around px-2 pb-safe">
                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon
                    const isActive = activeTab === item.id

                    return (

                        <button
                            key = {item.id}
                            onClick = {() => setActiveTab(item.id)}
                            className = {`
                                flex flex-col items-center gap-1 p-3 flex-1
                                ${isActive
                                    ? 'text-orange-500'
                                    : "text-zinc-500 hover:text-zinc-300"
                                }
                            `}
                        >
                            <Icon className = "h-5 w-5" />

                            <span className = "text-[10px] font-bold uppercase tracking-wider">
                                {item.label}
                            </span>
                        </button>

                    )
                })}
            </nav>

            {activeTab === 'events' && (
                <button
                    onClick = {() => navigate('/host/create-event')}
                    className = {`
                        md:hidden fixed bottom-20 right-6 z-50 h-14 w-14 rounded-full ${festiveGradient} shadow-xl shadow-orange-900/30 flex items-center justify-center
                        text-white active:scale-90 transition-transform duration-300
                    `}
                >
                    <Plus className = "h-7 w-7" />
                </button>
            )}

            <ConfirmDialog
                isOpen = {dialogConfig.isOpen}
                onClose = {closeDialog}
                onConfirm = {executeConfirmedAction}
                title = {
                    dialogConfig.actionType === 'cancel'
                        ? "Cancel Event?"
                        : "Permanently Delete?"
                }
                message = {
                    dialogConfig.actionType === 'cancel'
                        ? "Are you sure you want to cancel this event? This will initiate refunds for all attendees & cannot be undone."
                        : "Are you sure you want to PERMANENTLY DELETE this event? You can only do this if 0 tickets are sold or pending. This wipes the data completely."
                }
                confirmText = {
                    dialogConfig.actionType === 'cancel'
                        ? "Cancel Event"
                        : 'Delete'
                }
                isDestructive = {dialogConfig.actionType === 'delete'}
            />
        </div>

    )

}
