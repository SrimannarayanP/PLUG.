// ManageEvent.jsx


import {ArrowLeft, Calendar, MapPin, ScanLine, Search, UserCheck, Users} from 'lucide-react'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {useNavigate, useParams} from 'react-router-dom'

import api from '../api/api'

import HostAttendeeTable from '../components/ui/HostAttendeeTable'
import HostAttendeeTableSkeleton from '../components/ui/HostAttendeeTableSkeleton'
import LoadingSpinner from '../components/common/LoadingSpinner'


export default function ManageEvent() {

    const {eventId} = useParams() // Get ID from URL
    const navigate = useNavigate()

    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')

    const fetchData = useCallback(async (query = '') => {
        try {
            const endpoint = query ? `/api/host/event/${eventId}/?search=${query}` : `/api/host/event/${eventId}/`
            const res = await api.get(endpoint)

            setData(res.data)
        } catch (err) {
            console.error(err)

            setError("Failed to load event data. You may not be authorized.")
        } finally {
            setLoading(false)
        }
    }, [eventId])

    // Initial load
    useEffect(() => {
        fetchData()
    }, [fetchData])

    // Debounced (Basically slightly delayed) search effect
    useEffect(() => {
        const delayBounceFn = setTimeout(() => {
            // Only fetch if we aren't in the initial loading state to avoid double fetch on mount
            if (!loading) {
                fetchData(searchQuery)
            }
        }, 500)

        return () => clearTimeout(delayBounceFn)
    }, [searchQuery, fetchData])

    const groupedOrders = useMemo(() => {
        const attendees = data?.attendees || []

        if (attendees.length === 0) return []

        const groups = {}

        attendees.forEach(ticket => {
            const orderKey = `${ticket.buyer_email}_${ticket.created_at}` // Create a unique key for the order based on who bought & when

            if (!groups[orderKey]) {
                groups[orderKey] = {
                    id : orderKey,
                    buyer_name : `${ticket.buyer_first_name} ${ticket.buyer_last_name}`,
                    buyer_email : ticket.buyer_email,
                    created_at : ticket.created_at,
                    payment_status : ticket.payment_status,
                    razorpay_order_id : ticket.razorpay_order_id,
                    tickets : [] // Array to hold the actual guests
                }
            }

            groups[orderKey].tickets.push(ticket)
        })

        // Return as an array sorted by created_at in descending order
        return Object.values(groups).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }, [data])

    if (loading) return <LoadingSpinner />

    if (!data) return null

    // Date time helper
    const formatDateTime = (dateString) => {
        if (!dateString) return "Date TBA"

        return new Date(dateString).toLocaleString('en-US', {
            weekday : 'short',
            month : 'short',
            year : 'numeric',
            day : 'numeric',
            hour : '2-digit',
            minute : '2-digit',
        })

    }

    // Location display helper
    const getLocationDisplay = () => {
        if (event.location_type === 'online') { 
            return event.virtual_location || "Online Event"
        }

        return event.physical_location || "Venue TBA"
    }

    if (error) {

        return (

            <div className = "min-h-screen bg-[#09090b] flex items-center justify-center text-red-500 font-mono text-center p-4">
                {error}
            </div>

        )

    }

    // Use empty objs if data is null
    const {event, stats, attendees} = data || {
        event : {}, 
        stats : {total : 0, checked_in : 0}, 
        attendees : []
    }

    return (

        <div className = "min-h-[100dvh] bg-[#09090b] text-white font-sans relative overflow-x-hidden selection:bg-pink-500 selection:text-white pb-12">
            {/* Background Texture */}
            <div
                className = "fixed inset-0 opacity-[0.03] pointer-events-none z-0"
                style = {{
                    backgroundImage : "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
                    backgroundSize : "40px 40px"
                }}
            />
            
            <div className = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-6 md:pt-10">
                {/* Header section */}
                <div className = "mb-8 md:mb-12">
                    <button
                        onClick = {() => navigate('/host/dashboard')}
                        className = "text-zinc-500 hover:text-white font-bold mb-6 flex items-center gap-2 transition-colors uppercase tracking-widest text-xs p-2 -ml-2 rounded-lg hover:bg-zinc-900/50"
                    >
                        <ArrowLeft size = {16} /> 
                        
                        Back to Dashboard
                    </button>

                    <div className = "flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                        <div className = "w-full lg:w-auto">
                            {loading ? (
                                <div className = "space-y-4 animate-pulse">
                                    <div className = "h-12 bg-zinc-800 rounded-lg w-96" />
                                    <div className = "h-6 bg-zinc-800 rounded-lg w-64" />
                                </div>
                            ) : (
                                <>
                                    <h1 className = "text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tighter font-outfit mb-4 break-words leading-tight">
                                        {event.name}
                                    </h1>

                                    <div className = "flex flex-col sm:flex-row gap-3 text-zinc-400 font-medium text-xs md:text-sm">
                                        <div className = "inline-flex items-center gap-2 bg-zinc-900/80 px-4 py-2 rounded-lg border border-zinc-800">
                                            <Calendar className = "h-4 w-4 text-pink-500 shrink-0" />

                                            {formatDateTime(event.start_date)}
                                        </div>

                                        <div className = "inline-flex items-center gap-2 bg-zinc-900/80 px-4 py-2 rounded-lg border border-zinc-800 max-w-full">
                                            <MapPin className = "h-4 w-4 text-purple-500 shrink-0" />

                                            <span className = "truncate max-w-[200px] md:max-w-md">
                                                {getLocationDisplay()}
                                            </span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className = "w-full lg:w-auto">
                            <button
                                onClick = {() => navigate('/host/scan')}
                                className = "w-full lg:w-auto bg-white text-black px-8 py-4 lg:py-3 rounded-xl font-bold uppercase tracking-wider text-sm shadow-[0_0_20px_rgba(255, 255, 255, 0.1)] hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
                            >
                                <ScanLine className = "h-5 w-5 text-orange-600 group-hover:scale-110 transition-transform" />
                                
                                Launch Scanner
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Card */}
                <div className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {loading ? (
                        <>
                            <div className = "bg-[#18181b] border border-zinc-800 p-6 rounded-2xl h-32 animate-pulse" />
                            <div className = "bg-[#18181b] border border-zinc-800 p-6 rounded-2xl h-32 animate-pulse" />
                        </>
                    ) : (
                        <>
                            <div className = "bg-[#18181b] border border-zinc-800 p-5 rounded-2xl relative overflow-hidden group hover:border-zinc-700 transition-colors">
                                <div className = "absolute top-0 left-0 w-1 h-full bg-blue-500/80" />
                                
                                <div className = "flex items-center gap-2 mb-2">
                                    <Users className = "h-4 w-4 text-blue-500" />

                                    <p className = "text-zinc-500 font-bold text-[10px] uppercase tracking-widest">
                                        Total Registered
                                    </p>
                                </div>

                                <p className = "text-3xl md:text-4xl font-black text-white">
                                    {stats.total}
                                </p>
                            </div>

                            <div className = "bg-[#18181b] border border-zinc-800 p-5 rounded-2xl relative overflow-hidden group hover:border-zinc-700 transition-colors">
                                <div className = "absolute top-0 left-0 h-full w-1 bg-emerald-500/80" />

                                <div className = "flex items-center gap-2 mb-2">
                                    <UserCheck className = "h-4 w-4 text-emerald-500" />

                                    <p className = "text-zinc-500 font-bold text-[10px] uppercase tracking-widest">
                                        Checked In
                                    </p>
                                </div>

                                <p className = "text-3xl md:text-4xl font-black text-white">
                                    {stats.checked_in}
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* Attendee List */}
                <div className = "bg-[#18181b] border border-zinc-800 rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                    <div className = "p-4 md:p-6 border-b border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-900/30">
                        <h3 className = "text-lg md:text-xl font-bold text-white whitespace-nowrap">
                            Guest List
                        </h3>

                        <span className = "text-[10px] md:text-xs font-mono text-zinc-500 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                            Showing all {attendees.length} guests
                        </span>
                    </div>
                    
                    {/* Search Bar */}
                    <div className = "relative w-full md:w-72">
                        <div className = "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className = "h-4 w-4 text-zinc-500" />
                        </div>

                        <input 
                            type = 'text'
                            placeholder = "Search guests..."
                            value = {searchQuery}
                            onChange = {(e) => setSearchQuery(e.target.value)}
                            className = "block w-full pl-10 pr-3 py-2.5 md:py-2 border border-zinc-800 focus:border-orange-500/50 rounded-lg bg-zinc-950 text-zinc-200 text-sm placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all shadow-inner"
                        />
                    </div>

                    <div className = "overflow-x-auto w-full">
                        <div className = "min-w-[600px] p-2">
                            {loading ? (
                                <HostAttendeeTableSkeleton />
                            ) : (
                                <HostAttendeeTable
                                    groupedOrders = {groupedOrders}
                                    onActionComplete = {() => fetchData(searchQuery)} // Pass the refresh function
                                />
                            )}

                            {!loading && attendees.length === 0 && (
                                <div className = "flex flex-col items-center justify-center py-12 text-zinc-500 gap-2">
                                    <Search className = "h-8 w-8 opacity-20" />
                                    
                                    <p className = "text-sm font-medium">
                                        No attendees found matching "{searchQuery}"
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>

    )

}
