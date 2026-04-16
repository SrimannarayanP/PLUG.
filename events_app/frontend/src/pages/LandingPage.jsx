// LandingPage.jsx


import {CalendarX, Zap, Loader2} from 'lucide-react'
import React, {Suspense, useEffect, useState} from 'react' // useState holds data. useEffect runs code when the component is loaded
import {useInView} from 'react-intersection-observer'
import {useLocation, useNavigate} from 'react-router-dom'

import {useEvents} from '../hooks/useEvents'

import apiPublic from '../api/apiPublic' // Public API instance. Used for non-authenticated calls to the backend

import {useAuth} from '../context/AuthContext'

// Components
import CategoryRow from '../components/ui/CategoryRow'
import EventCard from '../components/ui/EventCard'
import EventCardSkeleton from '../components/ui/EventCardSkeleton'
import EventDetailSkeleton from '../components/ui/EventDetailSkeleton'
import FeaturedEventHero from '../components/ui/FeaturedEventHero'
import RegistrationModal from '../components/ui/RegistrationModal'

// Lazy load
const EventDetails = React.lazy(() => import('../components/ui/EventDetails'))


export default function LandingPage() {

    const {featuredEvents, upcomingEvents, loading, error, fetchInitial, fetchMoreUpcomingEvents, nextPage, totalEvents} = useEvents()
    const {isAuthenticated} = useAuth()

    const navigate = useNavigate()
    const location = useLocation()

    const [margin, setMargin] = useState(window.innerWidth > 768 ? '800px' : '200px')

    // Infinite scroll trigger
    const {ref, inView} = useInView({
        threshold : 0,
        rootMargin : margin
    })

    // If registeringEvent is not null, modal will open.
    const [registeringEvent, setRegisteringEvent] = useState(null)
    // If viewingEvent is not null, the detail sheet will open.
    const [viewingEvent, setViewingEvent] = useState(null)

    const [categories, setCategories] = useState([])

    const handleRegisterClick = (event) => {
        if (!isAuthenticated) {
            navigate('/login', {state : {from : location, targetEventId : event.id, action : 'register'}})

            return
        }
        
        setRegisteringEvent(event)
    }

    useEffect(() => {
        fetchInitial()
    }, [fetchInitial])

    // Infinite scroll effect, trigger fetch when ref is visible
    useEffect(() => {
        if (inView && nextPage) fetchMoreUpcomingEvents()
    }, [inView, nextPage, fetchMoreUpcomingEvents])

    useEffect(() => {
        if (location.state?.targetEventId && location.state?.action === 'register' && upcomingEvents.length > 0) {
            const targetEvent = upcomingEvents.find(e => e.id === location.state.targetEventId) || featuredEvents.find(e => e.id === location.state.targetEventId)

            if (targetEvent) {
                setRegisteringEvent(targetEvent)

                window.history.replaceState({}, document.title)
            }
        }
    }, [location.state, upcomingEvents, featuredEvents])

    useEffect(() => {
        const fetchCats = async () => {
            try {
                const res = await apiPublic.get('/api/data/categories/')

                setCategories(res.data)
            } catch (e) {
                console.error(e)
            }
        }

        fetchCats()
    }, [])

    if (error & upcomingEvents.length === 0) {

        return (

            <div className = "min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-red-500 font-mono gap-4 p-4 text-center">
                <CalendarX className = "h-12 w-12 opacity-50" />
                
                <p>{error}</p>

                <button
                    onClick = {() => window.location.reload()}
                    className = "px-4 py-2 bg-zinc-800 rounded-lg text-white text-xs uppercase tracking-widest hover:bg-zinc-700 transition-colors"
                >
                    Retry Connection
                </button>
            </div>

        )

    }

    const festiveGradient = "bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600"

    // If it is not loading & has no error, then the page is rendered.
    return (

        <div className = "min-h-screen bg-[#09090b] text-white font-sans selection:bg-pink-500 selection:text-white relative overflow-x-hidden">
            {/* Background Texture */}
            <div
                className = "fixed inset-0 opacity-[0.03] pointer-events-none z-0 transform-gpu"
                style = {{
                    backgroundImage : "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
                    backgroundSize : "40px 40px"
                }}
            />

            {/* Subtle ambient glow at the top */}
            <div className = "absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 sm:h-96 bg-orange-500/10 blur-[80px] sm:blur-[120px] rounded-full pointer-events-none z-0 transform-gpu will-change-transform" />

            <div className = "relative z-10 max-w-7xl w-full mx-auto p-4 sm:px-6 lg:px-8 pb-32">
                {/* --- Featured Events --- */}
                {/* This section is rendered if 'featuredEvents' has 1 or more items */}
                {loading && featuredEvents.length === 0 ? (
                    // Placeholder to prevent layout distortion while it loads
                    <div className = "lg:h-[600px] w-full aspect-[4/5] sm:aspect-video bg-zinc-900/50 animate-pulse rounded-3xl mb-12 border border-zinc-800/50" />
                ) : featuredEvents.length > 0 && (
                    <div className = "mb-12 sm:mb-20 animate-in fade-in slide-in-from-bottom-6 duration-1000 ease-out">
                        {/* First featured event is passed into here */}
                        <FeaturedEventHero 
                            event = {featuredEvents[0]}
                            onRegisterClick = {handleRegisterClick}
                            onDetailsClick = {setViewingEvent}    
                        />
                    </div>
                )}

                {/* --- Upcoming Events --- */}
                {/* Header for upcoming events */}
                <div className = "flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-10 border-b border-zinc-800 pb-6 gap-4">
                    <div className = 'space-y-2'>
                        <h2 className = "text-3xl sm:text-4xl md:text-5xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                            <span className = {`h-8 sm:h-10 w-8 sm:w-10 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 ${festiveGradient}`}>
                                <Zap className = "text-white h-4 sm:h-4 w-4 sm:w-6 fill-current" />
                            </span>

                            Upcoming Events
                        </h2>

                        <p className = "text-zinc-500 text-[10px] sm:text-xs font-mono uppercase tracking-widest pl-1 flex items-center gap-2">
                            <span className = "h-2 w-2 rounded-full bg-green-500 animate-pulse" />

                            Live Feed | Discover & Connect
                        </p>
                    </div>
                </div>

                {categories.length > 0 && (
                    <div className = "mb-8 sm:mb-12 border-b border-zinc-800/50 pb-4">
                        {categories.slice(0, 5).map((category) => (
                            <CategoryRow 
                                key = {category.id}
                                category = {category}
                                onRegisterClick = {handleRegisterClick}
                                onDetailsClick = {setViewingEvent}
                            />
                        ))}
                    </div>
                )}

                <div className = "flex items-center justify-between mb-6 sm:mb-10 border-b border-zinc-800 pb-4">
                    <h3 className = "text-lg sm:text-xl font-bold text-white uppercase tracking-widest">
                        All Events
                    </h3>

                    {totalEvents > 0 && (
                        <div className = "flex items-center gap-2.5 bg-zinc-900/50 border border-zinc-800 px-4 py-2 sm:py-2.5 rounded-2xl shadow-inner backdrop-blur-sm animate-in fade-in duration-500">
                            <span className = "text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500 font-black text-lg sm:text-xl leading-none">
                                {totalEvents}
                            </span>

                            <span className = "text-zinc-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest leading-none pt-0.5">
                                Events to Explore
                            </span>
                        </div>
                    )}
                </div>

                {/* Check if there are no upcoming events, if so, display a message */}
                {loading && upcomingEvents.length === 0 ? (
                    <div className = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                        {[...Array(6)].map((_, i) => <EventCardSkeleton key = {i} />)}
                    </div>
                ) : upcomingEvents.length === 0 ? (
                    <div className = "flex flex-col items-center justify-center py-24 sm:py-32 bg-[#18181b]/30 border-2 border-dashed border-zinc-800 rounded-3xl backdrop-blur-sm mx-auto max-w-2xl animate-in zoom-in duration-500">
                        <div className = "h-16 sm:h-20 w-16 sm:w-20 bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 rounded-full shadow-inner">
                            <CalendarX className = "h-8 sm:h-10 w-8 sm:w-10 text-zinc-700" />
                        </div>

                        <h3 className = "text-lg sm:text-xl font-bold text-zinc-400 uppercase tracking-widest text-center">
                            The stage is quiet
                        </h3>

                        <p className = "text-zinc-600 text-xs sm:text-sm mt-2 font-mono text-center max-w-xs sm:max-w-md px-4">
                            No upcoming events found. Check back soon for new experiences.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* If we have events, display them in a grid */}
                        <div className = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                            {/* Map over the array & if there are events, display each 1 of them in their card */}
                            {upcomingEvents.map((event, index) => (
                                <div
                                    key = {event.id}
                                    className = "animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-backwards"
                                >
                                    <EventCard
                                        event = {event}
                                        onRegisterClick = {handleRegisterClick}
                                        onDetailsClick = {setViewingEvent}
                                    />
                                </div>
                            ))}
                        </div>
                        
                        {/* Loading spinner for infinite scroll */}
                        {nextPage && (
                            <div
                                ref = {ref}
                                className = "flex justify-center py-16 w-full"
                            >
                                <Loader2 className = "h-8 w-8 text-orange-500 animate-spin opacity-80" />
                            </div>
                        )}

                        {/* End of list indicator */}
                        {!nextPage && upcomingEvents.length > 0 && (
                            <div className = "flex items-center justify-center gap-4 py-20 opacity-40">
                                <div className = "h-px w-12 bg-zinc-700" />
                                
                                <span className = "text-zinc-500 text-[10px] font-mono uppercase tracking-widest">
                                    End of Feed
                                </span>

                                <div className = "h-px w-12 bg-zinc-700" />
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Registration modal */}
            {registeringEvent && (
                <RegistrationModal 
                    event = {registeringEvent}
                    closeModal = {() => setRegisteringEvent(null)}
                />
            )}

            {/* Bottom sheet brochure */}
            {viewingEvent && (
                <Suspense 
                    fallback = {
                        <div className = "fixed inset-0 z-[60] bg-[#09090b]"> {/* EventDetails launches a full-screen overlay that sits on top of everything. z-60 will ensure that
                                                                the skeleton immediately covers the screen just like the real one will, so while EventDetails loads, it'll
                                                                ensure a seamless transition */}
                            <EventDetailSkeleton />
                        </div>
                    }
                >
                    <EventDetails 
                        event = {viewingEvent}
                        onClose = {() => setViewingEvent(null)}
                        onRegisterClick = {handleRegisterClick}
                    />
                </Suspense>
            )}
        </div>

    )

}
