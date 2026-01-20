// LandingPage.jsx


import React, {useState, useEffect, useCallback, Suspense} from 'react' // useState holds data. useEffect runs code when the component is loaded
import {CalendarOff, Zap} from 'lucide-react'
import {useInView} from 'react-intersection-observer'

import apiPublic from '../api/apiPublic.js' // Public API instance. Used for non-authenticated calls to the backend

import EventCard from '../components/ui/EventCard'
import FeaturedEventHero from '../components/ui/FeaturedEventHero'
import RegistrationModal from '../components/ui/RegistrationModal'
import EventSkeleton from '../components/ui/EventSkeleton.jsx'
import EventDetailSkeleton from '../components/ui/EventDetailSkeleton.jsx'
import Header from '../components/layout/Header'

const EventDetails = React.lazy(() => import('../components/ui/EventDetails'))


export default function LandingPage() {

    const [featuredEvents, setFeaturedEvents] = useState([]) // Holds data from the /api/events/featured/ endpoint 
    const [upcomingEvents, setUpcomingEvents] = useState([]) // Holds data from the /api/events/upcoming/ endpoint

    const [nextPage, setNextPage] = useState(null)
    const [loadingMore, setLoadingMore] = useState(false)

    const [loading, setLoading] = useState(true) // Boolean value that will tell if API calls are completed or not
    const [error, setError] = useState(null) // 'error' Will hold error message if API call fails

    const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false) // Checks if the modal is open
    const [selectedEventForRegistration, setSelectedEventForRegistration] = useState(null) // Tracks which event the user is trying to register for

    const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false) // Tracks if the 'Brochure' bottom sheet is open
    const [selectedEventForDetails, setSelectedEventForDetails] = useState(null) // Tracks which event's details to show in the brochure

    const {ref, inView} = useInView({
        threshold : 0,
        rootMargin : '200px'
    })

    const handleOpenRegistrationModal = (event) => {
        setSelectedEventForRegistration(event) // Save the event data so the modal knows what to display
        setIsRegistrationModalOpen(true) // Show the modal
        setIsBottomSheetOpen(false) // If the brochure was open, close it. De-clutters the UI
    }

    // When user clicks on the 'X' or the background of the Registration modal
    const handleCloseRegistrationModal = () => {
        setSelectedEventForRegistration(null) // Clear data
        setIsRegistrationModalOpen(false) // Hide modal
    }

    // When the user wants to view the brochure (they click on the event card)
    const handleOpenBottomSheet = (event) => {
        setSelectedEventForDetails(event) // Save event data
        setIsBottomSheetOpen(true) // Show brochure
    }

    // User clicks 'X' or background of brochure
    const handleCloseBottomSheet = () => {
        setSelectedEventForDetails(null)
        setIsBottomSheetOpen(false)
    }

    // Runs when the component is mounted  
    useEffect(() => {
        const fetchAllData = async() => {
            try {
                setLoading(true)

                // We use Promise.all here because we want to call both the APIs at the same time, making it much faster.
                const [featuredRes, upcomingRes] = await Promise.all([
                    apiPublic.get('/api/events/featured/'),
                    apiPublic.get('/api/events/upcoming/')
                ])

                const featuredData = featuredRes.data.results || featuredRes.data
                const upcomingData = upcomingRes.data.results || upcomingRes.data

                setFeaturedEvents(featuredData)
                setUpcomingEvents(upcomingData)

                setNextPage(upcomingRes.data.next || null)
            } catch (err) {
                // If any API call fails, we catch the error here
                console.error("Failed to fetch events:", err)

                setError("Failed to load events. Please try again later.")
            } finally {
                // Finally, no matter what happens, we are done loading. So set it to false.
                setLoading(false)
            }
        }
        
        fetchAllData()
    }, []) // [] refers to dependency array which means run this effect if & when the dependency has changed. For str, int, bool this is fine. But if you pass an obj/
            // array, it might go into an infinite loop. Every time the component renders (a state update elsewhere), React will compare the old dependency with the new
            // dependency & they'll never be equal. Therefore, the component will re-render & again the old dependency won't match with the new dependency & it'll keep
            // going on. This is because JS creates a brand new obj in memory every single time. 

    const fetchMoreUpcoming = useCallback(async () => {
        if (!nextPage || loadingMore) return

        setLoadingMore(true)

        try {
            const res = await apiPublic.get(nextPage)
            const data = res.data
            const newEvents = data.results || data

            setUpcomingEvents(prev => {
                // Checking for duplicates
                const existingIds = new Set(prev.map(e => e.id))
                const uniqueNew = newEvents.filter(e => !existingIds.has(e.id))

                return [...prev, ...uniqueNew]
            })

            setNextPage(data.next || null)
        } catch (err) {
            console.error("Failed to fetch more events", err)
        } finally {
            setLoadingMore(false)
        }
    }, [nextPage, loadingMore])

    // Trigger fetch when ref is visible
    useEffect(() => {
        if (inView && nextPage) {
            fetchMoreUpcoming()
        }
    }, [inView, nextPage, fetchMoreUpcoming])

    if (error) {

        return (
        
            <div className = "min-h-screen bg-[#09090b] flex items-center justify-center text-red-500 font-mono">
                {error}
            </div>
        
        )

    }

    const festiveGradient = "bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600"

    // If it is not loading & has no error, then the page is rendered.
    return (

        <div className = "min-h-screen bg-[#09090b] text-white font-sans selection:bg-pink-500 selection:text-white relative overflow-x-hidden">
            {/* Background Texture */}
            <div
                className = "fixed inset-0 opacity-[0.03] pointer-events-none z-0"
                style = {{
                    backgroundImage : "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
                    backgroundSize : "40px 40px"
                }}
            />

            <div className = "relative z-50">  
                <Header />
            </div>

            {/* Subtle ambient glow at the top */}
            <div className = "absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-96 bg-orange-500/10 blur-[100px] rounded-full pointer-events-none z-0" />

            <div className = "h-16 w-full" />

            <main className = "relative z-10 max-w-7xl w-full mx-auto p-4 md:p-8 pb-20">
                {/* Featured Events */}
                {/* This section is rendered if 'featuredEvents' has 1 or more items */}
                {loading ? (
                    // Placeholder to prevent layout distortion while it loads
                    <div className = "w-full h-[60vh] md:h-[500px] bg-[#18181b] animate-pulse rounded-3xl mb-16 border border-zinc-800" />
                ) : featuredEvents.length > 0 && (
                    <div className = "mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* First featured event is passed into here */}
                        <FeaturedEventHero 
                            event = {featuredEvents[0]}
                            onRegisterClick = {handleOpenRegistrationModal}
                            onDetailsClick = {handleOpenBottomSheet}    
                        />
                    </div>
                )}

                {/* Header for upcoming events */}
                <div className = "flex items-end justify-between mb-8 border-b border-zinc-800 pb-4">
                    <div className = 'space-y-1'>
                        <h2 className = "text-3xl md:text-5xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                            <span className = {`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center ${festiveGradient}`}>
                                <Zap className = "text-white w-5 h-5 md:w-6 md:h-6 fill-current" />
                            </span>

                            Upcoming Events
                        </h2>

                        <p className = "text-zinc-500 font-mono text-xs uppercase tracking-widest pl-1">
                            Live Feed | Discover & Connect
                        </p>
                    </div>
                </div>

                {/* Check if there are no upcoming events, if so, display a message */}
                {loading ? (
                    <div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => <EventSkeleton key = {i} />)}
                    </div>
                ) : upcomingEvents.length === 0 ? (
                    <div className = "flex flex-col items-center justify-center py-32 bg-[#18181b]/50 border-2 border-dashed border-zinc-800 rounded-3xl backdrop-blur-sm">
                        <div className = "w-16 h-16 bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 rounded-full">
                            <CalendarOff className = "w-8 h-8 text-zinc-600" />
                        </div>

                        <h3 className = "text-xl font-bold text-zinc-500 uppercase tracking-widest">
                            No Events Found
                        </h3>

                        <p className = "text-zinc-600 text-sm mt-2 font-medium">
                            The timeline is currently empty.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* If we have events, display them in a grid */}
                        <div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {/* Map over the array & if there are events, display each 1 of them in their card */}
                            {upcomingEvents.map((event, index) => (
                                <div
                                    key = {event.id}
                                    className = "animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-backwards"
                                    style = {{animationDelay : `${index * 100}ms`}}
                                >
                                    <EventCard 
                                        event = {event}
                                        onRegisterClick = {handleOpenRegistrationModal}
                                        onDetailsClick = {handleOpenBottomSheet}
                                    />
                                </div>
                            ))}
                        </div>
                        
                        {/* Infinite scroll trigger */}
                        {nextPage && (
                            <div
                                ref = {ref}
                                className = "flex justify-center py-12 w-full"
                            >
                                <Loader2 className = "w-8 h-8 text-orange-500 animate-spin" />
                            </div>
                        )}

                        {/* End of list indicator */}
                        {!nextPage && upcomingEvents.length > 0 && (
                            <div className = "text-center py-16 opacity-50">
                                <p className = "text-zinc-600 text-xs font-mono uppercase tracking-widest">
                                    - You're all caught up -
                                </p>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Registration modal */}
            {isRegistrationModalOpen && (
                <RegistrationModal 
                    event = {selectedEventForRegistration}
                    closeModal = {handleCloseRegistrationModal}
                />
            )}

            {/* Bottom sheet brochure */}
            {isBottomSheetOpen && (
                <Suspense 
                    fallback = {
                        <div className = "fixed inset-0 z-[60]"> {/* EventDetails launches a full-screen overlay that sits on top of everything. z-60 will ensure that
                                                                the skeleton immediately covers the screen just like the real one will, so while EventDetails loads, it'll
                                                                ensure a seamless transition */}
                            <EventDetailSkeleton />
                        </div>
                    }
                >
                    <EventDetails 
                        event = {selectedEventForDetails}
                        onClose = {handleCloseBottomSheet}
                        onRegisterClick = {handleOpenRegistrationModal} // Allows registration from the brochure
                    />
                </Suspense>
            )}
        </div>

    )

}
