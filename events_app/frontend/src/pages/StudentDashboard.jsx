// StudentDashboard.jsx


import {ArrowRight, Loader2, Search, TicketX, Wallet} from 'lucide-react'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {useInView} from 'react-intersection-observer'
import {Link} from 'react-router-dom'

import api from '../api/api'

import TicketCard from '../components/ui/TicketCard'
import TicketCardSkeleton from '../components/ui/TicketCardSkeleton'

import {useAuth} from '../context/AuthContext'


export default function StudentDashboard() {

    const {user} = useAuth()

    const [tickets, setTickets] = useState([])
    const [loading, setLoading] = useState(false)
    const [nextPage, setNextPage] = useState(null)
    const [isInitialLoad, setIsInitialLoad] = useState(true)

    const managesHost = Boolean(user?.profile?.host_type)

    const [activeTab, setActiveTab] = useState('upcoming') // 'upcoming' | 'past' | 'cancelled'
    const [searchQuery, setSearchQuery] = useState('')

    // ref is the element we match. It's like a tripwire/sensor. As soon as the ref element comes into view (in this case, the div that we placed at the bottom), inView
    // toggles to True. This then sets off the useEffect to get the new set of tickets (fetchTickets(nextPage)). inView tells us if it's visible & on the screen.
    const {ref, inView} = useInView({
        threshold : 0, // Trigger as soon as 1px is visible
        rootMargin : '200px', // Trigger 200px before the user actually hits the bottom
    })

    const festiveGradient = "bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600"

    const fetchTickets = useCallback(async (url = '/api/events/my-tickets/') => {
        setLoading(true)

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
    }, [])

    useEffect(() => {
        fetchTickets()
    }, [fetchTickets])

    useEffect(() => {
        if (inView && nextPage && !loading) {
            fetchTickets(nextPage)
        }
    }, [inView, nextPage, loading, fetchTickets])

    const filteredAndGroupedTickets = useMemo(() => {
        const now = new Date()
        const query = searchQuery.toLowerCase().trim()

        const filtered = tickets.filter(ticket => {
            const eventDate = new Date(ticket.event.start_date)
            let matchesTab = false

            if (activeTab === 'cancelled') {
                matchesTab = ticket.is_cancelled === true
            } else if (activeTab === 'upcoming') {
                matchesTab = ticket.is_cancelled === false && eventDate >= now
            } else if (activeTab === 'past') {
                matchesTab = ticket.is_cancelled === false && eventDate < now
            }

            const eventName = (ticket.event?.name || '').toLowerCase()
            const eventVenue = (ticket.event?.physical_location || '').toLowerCase()

            const matchesSearch = query === '' || eventName.includes(query) || eventVenue.includes(query)

            return matchesTab && matchesSearch
        })

        const groups = {}

        filtered.forEach(ticket => {
            const eventId = ticket.event.id

            if (!groups[eventId]) {
                groups[eventId] = []
            }

            groups[eventId].push(ticket)
        })
        
        // Convert to array of arrays
        return Object.values(groups)
    }, [tickets, activeTab, searchQuery])

    return (

        <div className = "min-h-[100dvh] bg-[#09090b] text-white font-sans relative overflow-x-hidden selection:bg-pink-500 selection:text-white">
            {/* Ambient Background Grid */}
            <div
                className = "fixed inset-0 opacity-[0.03] pointer-events-none z-0"
                style = {{
                    backgroundImage : "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
                    backgroundSize : "40px 40px"
                }}
            />

            <div className = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-4 md:pt-8 pb-24">
                {/* Header Section */}
                <div className = "flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-6 border-b border-zinc-800 pb-6">
                    <div className = 'w-full'>
                        <h1 className = "text-3xl sm:text-4xl md:text-5xl font-black text-white uppercase tracking-tighter flex items-center gap-3 md:gap-4">
                            <span className = {`h-10 md:h-14 w-10 md:w-14 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0 ${festiveGradient}`}>
                                <Wallet className = "text-white h-5 md:h-8 w-5 md:w-8" />
                            </span>

                            My Tickets
                        </h1>

                        <p className = "mt-2 text-zinc-500 text-xs font-mono uppercase tracking-[0.3em]">
                            {tickets.length} Total Registered Tickets
                        </p>
                    </div>

                    <div className = "relative w-full md:w-72">
                        <Search className = "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />

                        <input 
                            type = 'text'
                            placeholder = "Search events or venues..."
                            value = {searchQuery}
                            onChange = {(e) => setSearchQuery(e.target.value)}
                            className = "w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all text-white placeholder:text-zinc-600"
                        />
                    </div>
                </div>

                <div className = "flex gap-8 mb-8 border-b border-zinc-800/50 pb-px">
                    {['upcoming', 'past', 'cancelled'].map((tab) => (
                        <button
                            key = {tab}
                            onClick = {() => setActiveTab(tab)}
                            className = {`
                                pb-4 text-xs sm:text-sm font-bold uppercase tracking-[0.2em] transition-all relative
                                ${activeTab === tab
                                    ? 'text-orange-500'
                                    : "text-zinc-500 hover:text-zinc-300"
                                }
                            `}
                        >
                            {tab}

                            {activeTab === tab && (
                                <div className = "absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 shadow-[0_-4px_12px_rgba(249, 115, 22, 0.5)]" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                {isInitialLoad ? (
                    <div className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                        {[...Array(6)].map((_, i) => (
                            <TicketCardSkeleton key = {i} />
                        ))}
                    </div>
                ) : filteredAndGroupedTickets.length === 0 ? (
                    <div className = "flex flex-col items-center justify-center py-24 sm:py-32 bg-[#18181b]/30 border-2 border-dashed border-zinc-800 rounded-3xl backdrop-blur-sm animate-in zoom-in-95 duration-500 mx-auto max-w-2xl px-6">
                        <div className = "h-16 sm:h-20 w-16 sm:w-20 bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 rounded-full shadow-inner">
                            <TicketX className = "h-8 sm:h-10 w-8 sm:w-10 text-zinc-600" />
                        </div>

                        <h2 className = "text-lg sm:text-2xl font-bold text-zinc-500 uppercase tracking-widest text-center">
                            {searchQuery ? "No matches found." : `No ${activeTab} tickets`}
                        </h2>

                        <p className = "text-zinc-600 text-xs sm:text-sm mt-3 font-medium text-center max-w-xs sm:max-w-md leading-relaxed">
                            {searchQuery
                                ? `We couldn't find any tickets matching "${searchQuery}". Try a different term.`
                                : activeTab === 'upcoming'
                                    ? "You don't have any upcoming events planned."
                                    : "Your history is empty."
                            }
                        </p>

                        {searchQuery ? (
                            <button
                                onClick = {() => setSearchQuery('')}
                                className = "mt-8 flex items-center gap-2 bg-zinc-800 text-zinc-300 px-6 py-3 rounded-full font-bold uppercase tracking-widest hover:bg-zinc-700 hover:text-white transition-all"
                            >
                                Clear Search
                            </button>
                        ) : activeTab === 'upcoming' && (
                            <Link
                                to = '/'
                                className = "mt-8 inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-bold uppercase text-xs tracking-widest hover:bg-orange-500 hover:text-white transition-all group"
                            >
                                Find Events <ArrowRight className = "h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Responsive grid */}
                        <div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
                            {filteredAndGroupedTickets.map((group) => (
                                <TicketCard
                                    key = {group[0].event.id}
                                    tickets = {group}
                                    onTicketChange = {fetchTickets}
                                />
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
                        {!nextPage && (
                            <div className = "flex items-center justify-center gap-4 py-16 opacity-40">
                                <div className = "h-px w-12 bg-zinc-700" />

                                <span className = "text-zinc-500 text-[10px] font-mono uppercase tracking-widest">
                                    End of {activeTab}
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
