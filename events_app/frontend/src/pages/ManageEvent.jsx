// ManageEvent.jsx


import {ArrowLeft, BarChart3, Calendar, ListOrdered, MapPin, ScanLine, Search, UserCheck, Users} from 'lucide-react'
import {useCallback, useEffect, useRef, useState} from 'react'
import {useNavigate, useParams} from 'react-router-dom'

import api from '../api/api'

import HostAttendeeTable from '../components/ui/HostAttendeeTable'
import HostAttendeeTableSkeleton from '../components/ui/HostAttendeeTableSkeleton'
import HostEventStats from '../components/ui/HostEventStats'
import SearchBar from '../components/ui/SearchBar'
import LoadingSpinner from '../components/common/LoadingSpinner'


export default function ManageEvent() {

    const {eventId} = useParams() // Get ID from URL
    const navigate = useNavigate()
    
    const [activeTab, setActiveTab] = useState('attendees') // 'attendees' or 'analytics'

    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [currentQuery, setCurrentQuery] = useState('')

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

    const handleSearch = useCallback((query) => {
        setCurrentQuery(query)

        fetchData(query)
    }, [fetchData])

    if (loading && !data) return <LoadingSpinner />

    if (error) {

        return (

            <div className = "min-h-screen bg-[#09090b] flex items-center justify-center text-red-500 font-mono text-center p-4">
                {error}
            </div>

        )

    }

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
        if (data.event.location_type === 'online') return data.event.virtual_location || "Online Event"

        return data.event.physical_location || "Venue TBA"
    }

    // Use empty objs if data is null
    const {event, stats, attendees} = data || {event : {}, stats : {total : 0, checked_in : 0}, attendees : []}

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
                            {loading || !event ? (
                                <div className = "space-y-4 animate-pulse">
                                    <div className = "h-10 md:h-14 w-3/4 max-w-lg bg-zinc-800 rounded-xl" />

                                    <div className = "flex flex-col sm:flex-row gap-3">
                                        <div className = "h-9 w-40 bg-zinc-800 rounded-lg" />
                                        <div className = "h-9 w-48 bg-zinc-800 rounded-lg" />
                                    </div>
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
                                disabled = {loading}
                                className = "w-full lg:w-auto bg-white disabled:bg-zinc-800 disabled:text-zinc-500 text-black px-8 py-4 lg:py-3 rounded-xl font-bold uppercase tracking-wider text-sm shadow-[0_0_20px_rgba(255, 255, 255, 0.1)] hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
                            >
                                <ScanLine className = "h-5 w-5 text-orange-600 group-hover:scale-110 transition-transform" />
                                
                                Launch Scanner
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className = "flex border-b border-zinc-800/80 mb-8 overflow-x-auto no-scrollbar">
                    <button
                        onClick = {() => setActiveTab('analytics')}
                        className = {`
                            flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all whitespace-nowrap
                            ${activeTab === 'analytics'
                                ? "border-orange-500 text-white bg-orange-500/5"
                                : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"
                            }
                        `}
                    >
                        <BarChart3
                            className = {`
                                h-4 w-4
                                ${activeTab === 'analytics'
                                    ? 'text-orange-500'
                                    : ''
                                }
                            `}
                        />

                        Analytics
                    </button>

                    <button
                        onClick = {() => setActiveTab('attendees')}
                        className = {`
                            flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all whitespace-nowrap
                            ${activeTab === 'attendees'
                                ? "border-pink-500 text-white bg-pink-500/5"
                                : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"
                            }
                        `}
                    >
                        <ListOrdered
                            className = {`
                                h-4 w-4
                                ${activeTab === 'attendees'
                                    ? 'text-pink-500'
                                    : ''
                                }
                            `}
                        />

                        Guest List
                    </button>
                </div>
                
                <div>
                    {activeTab === 'analytics' && <HostEventStats />}

                    {activeTab === 'attendees' && (
                        <div className = "animate-in fade-in duration-500">
                            {/* Stats Card */}
                            <div className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                {loading && !data ? (
                                    <>
                                        <div className = "bg-[#18181b] border border-zinc-800 p-6 rounded-2xl h-[104px] animate-pulse" />
                                        <div className = "bg-[#18181b] border border-zinc-800 p-6 rounded-2xl h-[104px] animate-pulse" />
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
                                <div className = "p-4 md:px-6 md:py-4 bg-zinc-900/10 border-b border-zinc-800/50">
                                    <SearchBar onSearch = {handleSearch} />
                                </div>

                                <div className = "overflow-x-auto w-full">
                                    <div className = "min-w-[600px] p-2">
                                        {loading && !data ? (
                                            <HostAttendeeTableSkeleton />
                                        ) : (
                                            <HostAttendeeTable
                                                groupedOrders = {attendees}
                                                onActionComplete = {() => fetchData(currentQuery)} // Pass the refresh function
                                            />
                                        )}

                                        {!loading && attendees.length === 0 && (
                                            <div className = "flex flex-col items-center justify-center py-12 text-zinc-500 gap-2">
                                                <Search className = "h-8 w-8 opacity-20" />
                                                
                                                <p className = "text-sm font-medium">
                                                    No attendees found matching your search
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

    )

}
