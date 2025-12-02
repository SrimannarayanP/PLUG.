// LandingPage.jsx


import React, {useState, useEffect} from 'react' // useState holds data. useEffect runs code when the component is loaded

import apiPublic from '../api/apiPublic.js' // Public API instance. Used for non-authenticated calls to the backend

import EventCard from '../components/ui/EventCard'
import FeaturedEventHero from '../components/ui/FeaturedEventHero'
import LoadingSpinner from '../components/common/LoadingSpinner'
import RegistrationModal from '../components/ui/RegistrationModal'
import EventDetailBottomSheet from '../components/ui/EventDetailBottomSheet'


export default function LandingPage() {

    const [featuredEvents, setFeaturedEvents] = useState([]) // Holds data from the /api/events/featured/ endpoint 
    const [upcomingEvents, setUpcomingEvents] = useState([]) // Holds data from the /api/events/upcoming/ endpoint
    const [loading, setLoading] = useState(true) // Boolean value that will tell if API calls are completed or not
    const [error, setError] = useState(null) // 'error' Will hold error message if API call fails 
    const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false) // Checks if the modal is open
    const [selectedEventForRegistration, setSelectedEventForRegistration] = useState(null) // Tracks which event the user is trying to register for
    const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false) // Tracks if the 'Brochure' bottom sheet is open
    const [selectedEventForDetails, setSelectedEventForDetails] = useState(null) // Tracks which event's details to show in the brochure

 
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

                // console.log("Featured Data:", featuredRes.data)
                // console.log("Upcoming Data:", upcomingRes.data)

                setFeaturedEvents(featuredRes.data)
                setUpcomingEvents(upcomingRes.data)
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
    }, []) // Empty array means run this effect only once.

    if (loading) {
        return <LoadingSpinner />
    }

    if (error) {
        return <div className = "text-center text-red-500 mt-10">{error}</div>
    }

    // If it is not loading & has no error, then the page is rendered.
    return (

        <div 
            className = "min-h-screen" 
            style = {{backgroundColor : '#eae5dc'}}
        >
            <main className = "max-w-7xl w-full mx-auto p-4 md:p-8">
                <button></button>
                
                {/* This section is rendered if 'featuredEvents' has 1 or more items */}
                {featuredEvents.length > 0 && (
                    // First featured event is passed into here
                    <FeaturedEventHero 
                        event = {featuredEvents[0]}
                        onRegisterClick = {handleOpenRegistrationModal}
                        onDetailsClick = {handleOpenBottomSheet}    
                    />
                )}

                <h2 className = "text-3xl font-bold text-[#6f2d37] mb-6">
                    Upcoming Events
                </h2>

                {/* Check if there are no upcoming events, if so, display a message */}
                {upcomingEvents.length === 0 ? (
                    <p className = "text-gray-600">No upcoming events found. Check back soon!</p>
                ) : (
                    // If we have events, display them in a grid
                    <div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Map over the array & if there are events, display each 1 of them in their card */}
                        {upcomingEvents.map(event => (
                            <EventCard 
                                key = {event.id} 
                                event = {event}
                                onRegisterClick = {handleOpenRegistrationModal}
                                onDetailsClick = {handleOpenBottomSheet}
                            />
                        ))}
                    </div>
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
                <EventDetailBottomSheet 
                    event = {selectedEventForDetails}
                    onClose = {handleCloseBottomSheet}
                    onRegisterClick = {handleOpenRegistrationModal} // Allows registration from the brochure
                />
            )}
        </div>

    )

}
