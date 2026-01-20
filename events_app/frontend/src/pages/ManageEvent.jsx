// ManageEvent.jsx


import {useState, useEffect, useCallback} from 'react'
import {useParams, useNavigate} from 'react-router-dom'
import {ScanLine, ArrowLeft, Users, UserCheck, Calendar, MapPin} from 'lucide-react'

import api from '../api/api'

import LoadingSpinner from '../components/common/LoadingSpinner'
import HostAttendeeTable from '../components/ui/HostAttendeeTable'


export default function ManageEvent() {
    
    const {eventId} = useParams() // Get ID from URL
    const navigate = useNavigate()

    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchData = useCallback(async () => {
        try {
            const res = await api.get(`/api/host/event/${eventId}/`)

            setData(res.data)
        } catch (err) {
            console.error(err)

            setError("Failed to load event data. You may not be authorized.")
        } finally {
            setLoading(false)
        }
    }, [eventId])

    // Date time helper
    const formatDateTime = (dateString) => {

        return new Date(dateString).toLocaleString('en-US', {
            weekday : 'short',
            year : 'numeric',
            month : 'short',
            day : 'numeric',
            hour : '2-digit',
            minute : '2-digit',
        })

    }

    // Location display helper
    const getLocationDisplay = () => {
        if (event.location_type === 'online') return "Online Event"

        return event.physical_location || "Venue TBA"

    }

    // Initial load
    useEffect(() => {
        fetchData()
    }, [fetchData])

    if (loading) return <LoadingSpinner />

    if (error) {

        return (

            <div className = "min-h-screen bg-[#09090b] flex items-center justify-center text-red-500 font-mono">
                {error}
            </div>

        )

    }

    if (!data) return null

    const {event, stats, attendees} = data
    
    const festiveGradient = "bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600"

    return (

        <div className = "min-h-screen bg-[#09090b] text-white p-6 md:p-12 font-sans relative overflow-x-hidden selection:bg-pink-500 selection:text-white pt-24 md:pt-12">
            {/* Background Texture */}
            <div
                className = "fixed inset-0 opacity-[0.03] pointer-events-none z-0"
                style = {{
                    backgroundImage : "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
                    backgroundSize : "40px 40px"
                }}
            />
            
            <div className = "max-w-7xl mx-auto relative z-10">
                {/* Header section */}
                <div className = 'mb-12'>
                    <button
                        onClick = {() => navigate('/host/dashboard')}
                        className = "text-zinc-500 hover:text-white font-bold mb-6 flex items-center gap-2 transition-colors uppercase tracking-widest text-xs"
                    >
                        <ArrowLeft size = {16} /> Back to Dashboard
                    </button>

                    <div className = "flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h1 className = "text-4xl md:text-5xl font-black text-white tracking-tighter font-outfit mb-2">
                                {event.event_name}
                            </h1>

                            <div className = "flex flex-wrap gap-4 text-zinc-400 font-medium text-sm">
                                <div className = "flex items-center gap-2 bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-zinc-800">
                                    <Calendar className = "w-4 h-4 text-pink-500" />

                                    {formatDateTime(event.start_date)}
                                </div>

                                <div className = "flex items-center gap-2 bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-zinc-800">
                                    <MapPin className = "w-4 h-4 text-purple-500" />

                                    {getLocationDisplay()}
                                </div>
                            </div>
                        </div>

                        <div className = "flex gap-3">
                            <button
                                onClick = {() => navigate('/host/scan')}
                                className = "bg-white text-black px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-sm shadow-[0_0_20px_rgba(255, 255, 255, 0.1)] hover:bg-zinc-200 transition-all flex items-center gap-2 group"
                            >
                                <ScanLine className = "w-5 h-5 text-orange-600 group-hover:scale-110 transition-transform" />
                                
                                Launch Scanner
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Card */}
                <div className = "grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                    <div className = "bg-[#18181b] border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group hover:border-zinc-700 transition-colors">
                        <div className = "absolute top-0 left-0 w-1 h-full bg-blue-500" />
                        
                        <div className = "flex items-center gap-2 mb-2">
                            <Users className = "w-4 h-4 text-blue-500" />

                            <p className = "text-zinc-500 font-bold text-[10px] uppercase tracking-widest">
                                Total Registered
                            </p>
                        </div>

                        <p className = "text-4xl font-black text-white">
                            {stats.total}
                        </p>
                    </div>

                    <div className = "bg-[#18181b] border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group hover:border-zinc-700 transition-colors">
                        <div className = "absolute top-0 left-0 w-1 h-full bg-emerald-500" />

                        <div className = "text-zinc-500 font-bold text-[10px] uppercase tracking-widest">
                            <UserCheck className = "w-4 h-4 text-emerald-500" />

                            <p className = "text-zinc-500 font-bold text-[10px] uppercase tracking-widest">
                                Checked In
                            </p>
                        </div>

                        <p className = "text-4xl font-black text-white">
                            {stats.checked_in}
                        </p>
                    </div>
                </div>

                {/* Attendee List */}
                <div className = "bg-[#18181b] border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden">
                    <div className = "p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                        <h3 className = "text-xl font-bold text-white flex items-center gap-2">
                            Guest List
                        </h3>

                        <span className = "text-xs font-mono text-zinc-500 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
                            Showing all {attendees.length} guests
                        </span>
                    </div>

                    <div className = 'p-2'>
                        <HostAttendeeTable 
                            attendees = {attendees}
                            onActionComplete = {fetchData} // Pass the refresh function
                        />
                    </div>
                </div>
            </div>
        </div>

    )

}
