// CategoryPage.jsx


import {ArrowLeft, Calendar} from 'lucide-react'
import {useEffect, useState} from 'react'
import {useLocation, useNavigate, useParams} from 'react-router-dom'

import apiPublic from '../api/apiPublic'

import BackButton from '../components/common/BackButton'
import LoadingSpinner from '../components/common/LoadingSpinner'
import EventCard from '../components/ui/EventCard'
import EventDetails from '../components/ui/EventDetails'
import RegistrationModal from '../components/ui/RegistrationModal'


export default function CategoryPage() {

    const {id} = useParams()
    const location = useLocation()
    const navigate = useNavigate()

    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [selectedEvent, setSelectedEvent] = useState(null)
    const [isRegisterOpen, setIsRegisterOpen] = useState(false)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)

    const categoryName = location.state?.categoryName || "Category Events"

    const handleRegisterClick = async (event) => {
        if (event.is_native) {
            setSelectedEvent(event)
            setIsRegisterOpen(true)
        } else {
            window.open(event.register_link, '_blank', 'noopener,noreferrer')

            try {
                await apiPublic.post(`/api/events/${event.id}/track-click/`)
            } catch (err) {
                console.error("Failed to track click silently", err)
            }
        }
    }

    const handleDetailsClick = (event) => {
        setSelectedEvent(event)
        setIsDetailsOpen(true)
    }

    const closeModal = () => {
        setIsRegisterOpen(false)
        setIsDetailsOpen(false)
    }

    useEffect(() => {
        let isMounted = true

        const fetchEvents = async () => {
            setLoading(true)

            try {
                const res = await apiPublic.get(`/api/events/upcoming/?category_id=${id}`)

                if (isMounted) {
                    const data = res.data.results || res.data

                    setEvents(data)
                }
            } catch (err) {
                console.error("Failed to fetch category events", err)

                if (isMounted) {
                    setError("Failed to load events for this category.")
                }
            } finally {
                if (isMounted) {
                    setLoading(false)
                }
            }
        }

        if (id) {
            fetchEvents()
        }

        return () => {isMounted = false}
    }, [id])

    if (loading) return <LoadingSpinner />

    return (

        <div className = "min-h-screen bg-[#09090b] text-white font-sans selection:bg-orange-500 selection:text-white pb-24">
            {/* Background Pattern */}
            <div
                className = "fixed inset-0 opacity-[0.03] pointer-events-none z-0"
                style = {{
                    backgroundImage : "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
                    backgroundSize : "40px 40px"
                }}
            />

            <main className = "relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-12">
                <div className = "flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 border-b border-zinc-800/50 pb-6">
                    <div className = "flex items-center gap-4">
                        <button
                            onClick = {() => navigate(-1)}
                            className = "h-10 w-10 flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
                        >
                            <ArrowLeft className = "h-5 w-5" />
                        </button>

                        <h1 className = "text-2xl md:text-4xl font-black uppercase tracking-tighter text-white font-outfit">
                            {categoryName}
                        </h1>
                    </div>
                </div>

                {error && (
                    <div className = "p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl font-bold text-sm text-center">
                        {error}
                    </div>
                )}

                {!loading && !error && events.length === 0 && (
                    <div className = "flex flex-col items-center justify-center py-32 bg-[#18181b] border border-zinc-800 border-dashed rounded-3xl mx-auto max-w-2xl mt-12">
                        <div className = "h-20 w-20 bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 rounded-full shadow-inner">
                            <Calendar className = "h-8 w-8 text-zinc-600" />
                        </div>

                        <h2 className = "text-xl md:text-2xl font-bold text-zinc-400 uppercase tracking-widest text-center">
                            No Events Found
                        </h2>

                        <p className = "text-zinc-600 text-sm text-center mt-3 font-mono max-w-xs md:max-w-md px-4">
                            There are currently no upcoming events in this category. Please check back later or explore other categories to find events that interest you!
                        </p>
                    </div>
                )}

                {!loading && events.length > 0 && (
                    <div className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
                        {events.map((event) => (
                            <EventCard
                                key = {event.id}
                                event = {event}
                                onRegisterClick = {() => handleRegisterClick(event)}
                                onDetailsClick = {() => handleDetailsClick(event)}
                            />
                        ))}
                    </div>
                )}
            </main>

            {isDetailsOpen && selectedEvent && (
                <EventDetails
                    event = {selectedEvent}
                    onClose = {closeModal}
                    onRegisterClick = {() => {
                        setIsDetailsOpen(false)
                        setIsRegisterOpen(true)
                    }}
                />
            )}

            {isRegisterOpen && selectedEvent && (
                <RegistrationModal
                    event = {selectedEvent}
                    closeModal = {closeModal}
                />
            )}
        </div>

    )

}
