import {useState, useCallback} from 'react'

import apiPublic from '../api/apiPublic'


export function useEvents() {

    const [featuredEvents, setFeaturedEvents] = useState([])
    const [upcomingEvents, setUpcomingEvents] = useState([])

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Pagination State
    const [nextPage, setNextPage] = useState(null)
    const [loadingMore, setLoadingMore] = useState(false)

    const fetchInitial = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            const [featuredRes, upcomingRes] = await Promise.allSettled([
                apiPublic.get('/api/events/featured/'),   
                apiPublic.get('/api/events/upcoming/')
            ])
            
            // Featured events
            if (featuredRes.status === 'fulfilled') {
                const data = featuredRes.value.data

                setFeaturedEvents(data.results || data)
            } else {
                console.error("Featured events failed:", featuredRes.reason)
            }

            // Upcoming events
            if (upcomingRes.status === 'fulfilled') {
                const data = upcomingRes.value.data

                setUpcomingEvents(data.results || data)
                setNextPage(data.next || null)
            } else {
                console.error("Upcoming events failed:", upcomingRes.reason)
                
                setError("Failed to load timeline.")
            }
        } catch (err) {
            console.error("Fetch error: ", err)

            setError("Something went wrong. Please try again.")
        } finally {
            setLoading(false)
        }
    }, [])

    // Pagination logic
    const fetchMoreUpcomingEvents = useCallback(async () => {
        if (!nextPage || loadingMore) return

        setLoadingMore(true)

        try {
            const res = await apiPublic.get(nextPage)
            const data = res.data
            const newEvents = data.results || data

            setUpcomingEvents(prev => {
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

    // nextPage is also in return block so that the UI knows if it has to show the spinner or not.
    return {featuredEvents, upcomingEvents, loading, error, loadingMore, nextPage, fetchInitial, fetchMoreUpcomingEvents}

}
