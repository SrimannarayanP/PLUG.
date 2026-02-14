// StudentDashboard.jsx


import {useEffect, useState, useCallback, useMemo} from 'react'
import {TicketX, Wallet, Loader2} from 'lucide-react'
import {useInView} from 'react-intersection-observer'

import api from '../api/api'

import TicketCard from '../components/ui/TicketCard'
import TicketCardSkeleton from '../components/ui/TicketCardSkeleton'


export default function StudentDashboard() {

    const [tickets, setTickets] = useState([])
    const [loading, setLoading] = useState(false)
    const [nextPage, setNextPage] = useState(null)
    const [isInitialLoad, setIsInitialLoad] = useState(true)

    // ref is the element we match. It's like a tripwire/sensor. As soon as the ref element comes into view (in this case, the div that we placed at the bottom), inView
    // toggles to True. This then sets off the useEffect to get the new set of tickets (fetchTickets(nextPage)). inView tells us if it's visible & on the screen.
    const {ref, inView} = useInView({
        threshold : 0, // Trigger as soon as 1px is visible
        rootMargin : '200px', // Trigger 200px before the user actually hits the bottom
    })

    const fetchTickets = useCallback(async (url = '/api/events/my-tickets/') => {
        setLoading(prev => {
            if (prev) return true

            return true
        })

        try {
            const response = await api.get(url)
            const data = response.data

            const newTickets = data.results || data
            const nextLink = data.next || null

            setTickets(prev => {
                // If it's page 1, overwrite else append.
                if (url === '/api/events/my-tickets/') return newTickets

                // Filtering out duplicates
                const existingIds = new Set(prev.map(t => t.id))
                const uniqueNewTickets = newTickets.filter(t => !existingIds.has(t.id))

                return [...prev, ...uniqueNewTickets]
            })

            setNextPage(nextLink)
        } catch (error) {
            console.error("Failed to fetch tickets", error)
        } finally {
            setLoading(false)
            setIsInitialLoad(false)
        }
    }, [loading])

    useEffect(() => {
        fetchTickets()
    }, [])

    useEffect(() => {
        if (inView && nextPage && !loading) {
            fetchTickets(nextPage)
        }
    }, [inView, nextPage, loading, fetchTickets])

    const groupedTickets = useMemo(() => {
        const groups = {}

        tickets.forEach(ticket => {
            const eventId = ticket.event.id

            if (!groups[eventId]) {
                groups[eventId] = []
            }

            groups[eventId].push(ticket)
        })
        
        // Convert to array of arrays
        return Object.values(groups)
    }, [tickets])

    const festiveGradient = "bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600"

    return (

        <div className = "min-h-[100dvh] bg-[#09090b] text-white font-sans relative overflow-x-hidden selection:bg-pink-500 selection:text-white">
            <div 
                className = "fixed inset-0 opacity-[0.03] pointer-events-none z-0"
                style = {{
                    backgroundImage : "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
                    backgroundSize : "40px 40px"
                }}
            />

            <div className = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-20 md:pt-24 pb-24">
                {/* Header Section */}
                <div className = "flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-6 border-b border-zinc-800 pb-6">
                    <div className = 'w-full'>
                        <h1 className = "text-3xl sm:text-4xl md:text-5xl font-black text-white uppercase tracking-tighter flex items-center gap-3 md:gap-4">
                            <span className = {`h-10 md:h-14 w-10 md:w-14 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0 ${festiveGradient}`}>
                                <Wallet className = "text-white h-5 md:h-8 w-5 md:w-8" />
                            </span>

                            My Tickets
                        </h1>

                        <div className = "mt-4 flex flex-wrap items-center gap-3">
                            <span className = "px-2.5 py-1 rounded bg-zinc-800 border border-zinc-700 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-300">
                                {tickets.length} Active
                            </span>

                            <p className = "text-zinc-500 text-[10px] sm:text-sm font-mono uppercase tracking-widest flex items-center gap-2">
                                | Wallet & QR Codes
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                {isInitialLoad ? (
                    <div className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                        {[...Array(6)].map((_, i) => (
                            <TicketCardSkeleton key = {i} />
                        ))}
                    </div>
                ) : tickets.length === 0 ? (
                    <div className = "flex flex-col items-center justify-center py-24 sm:py-32 bg-[#18181b]/30 border-2 border-dashed border-zinc-800 rounded-3xl backdrop-blur-sm animate-in zoom-in-95 duration-500 mx-auto max-w-2xl px-6">
                        <div className = "h-16 sm:h-20 w-16 sm:w-20 bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 rounded-full shadow-inner">
                            <TicketX className = "h-8 sm:h-10 w-8 sm:w-10 text-zinc-600" />
                        </div>

                        <h2 className = "text-lg sm:text-2xl font-bold text-zinc-500 uppercase tracking-widest text-center">
                            No Active Tickets
                        </h2>

                        <p className = "text-zinc-600 text-xs sm:text-sm mt-3 font-medium text-center max-w-xs sm:max-w-md leading-relaxed">
                            You haven't registered for any events yet. <br className = "hidden sm:block" />
                            Head to the Discover page to get started!
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Responsive grid */}
                        <div className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                            {groupedTickets.map((group) => (
                                <TicketCard tickets = {group} />
                            ))}
                        </div>
                        
                        {/* Infinite scroll logic comes here. This div is placed at the bottom. When this comes into view, we fetch more. */}
                        {nextPage && (
                            <div
                                ref = {ref}
                                className = "flex justify-center py-12 w-full"
                            >
                                <Loader2 className = "h-8 w-8 text-orange-500 animate-spin opacity-80" />
                            </div>
                        )}

                        {/* End of list indicator - Runs when there are no more tickets to display */}
                        {!nextPage && tickets.length > 0 && (
                            <div className = "flex items-center justify-center gap-4 py-16 opacity-40">
                                <div className = "h-px w-12 bg-zinc-700" />

                                <span className = "text-zinc-500 text-[10px] font-mono uppercase tracking-widest">
                                    End of Wallet
                                </span>

                                <div className = "h-px w-12 bg-zinc-700" />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>

    )
}
