// StudentDashboard.jsx


import {useEffect, useState, useCallback} from 'react';
import {TicketX, Wallet} from 'lucide-react'
import {useInView} from 'react-intersection-observer';

import api from '../api/api'

import TicketCard from '../components/ui/TicketCard'
import TicketSkeleton from '../components/ui/TicketSkeleton'


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

    const fetchTickets = useCallback(async (url = '/api/events/registered/') => {
        if (!url || loading) return

        setLoading(true)

        try {
            const res = await api.get(url)
            const data = res.data

            const newTickets = data.results || data
            const nextLink = data.next || null

            setTickets(prev => {
                // If it's page 1, overwrite else append.
                if (url === '/api/events/registered/') {
                    
                    return newTickets

                }

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

    const festiveGradient = "bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600"

    return (

        <div className = "min-h-screen bg-[#09090b] text-white p-4 md:p-12 font-sans relative overflow-x-hidden selection:bg-pink-500 selection:text-white pt-24 md:pt-12">
            <div 
                className = "fixed inset-0 opacity-[0.03] pointer-events-none z-0"
                style = {{
                    backgroundImage : "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
                    backgroundSize : "40px 40px"
                }}
            />

            <div className = "max-w-7xl mx-auto relative z-10">
                {/* Header Section */}
                <div className = "flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-4 border-b border-zinc-800 pb-6 md:pb-8">
                    <div className = 'w-full'>
                        <h1 className = "text-3xl md:text-5xl font-black text-white uppercase tracking-tighter flex items-center gap-3 md:gap-4">
                            <span className = {`w-10 h-10 md:w-14 md:h-14 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0 ${festiveGradient}`}>
                                <Wallet className = "text-white w-5 h-5 md:w-8 md:h-8" />
                            </span>

                            My Tickets
                        </h1>

                        <div className = "mt-3 md:mt-4 flex flex-wrap items-center gap-2 md:gap-3">
                            <span className = "px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-[10px] md:text-xs font-bold uppercase tracking-wider text-zinc-400">
                                {tickets.length} Active
                            </span>

                            <p className = "text-zinc-500 font-mono text-[10px] md:text-sm uppercase tracking-widest flex items-center gap-2">
                                | Wallet & QR Codes
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                {isInitialLoad ? (
                    <div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 pb-20">
                        {[...Array(6)].map((_, i) => (
                            <TicketSkeleton key = {i} />
                        ))}
                    </div>
                ) : tickets.length === 0 ? (
                    <div className = "flex flex-col items-center justify-center py-20 md:py-32 bg-[#18181b]/50 border-2 border-dashed border-zinc-800 rounded-2xl md:rounded-3xl backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500 px-4">
                        <div className = "w-16 h-16 md:w-20 md:h-20 bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 md:mb-6 rounded-full shadow-inner">
                            <TicketX className = "w-8 h-8 md:w-10 md:h-10 text-zinc-600" />
                        </div>

                        <h2 className = "text-xl md:text-2xl font-bold text-zinc-500 uppercase tracking-widest text-center">
                            No Active Tickets
                        </h2>

                        <p className = "text-zinc-600 text-xs md:text-sm mt-2 md:mt-3 font-medium max-w-xs md:max-w-md text-center">
                            You haven't registered for any events yet. Check out the Discover page get started!
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Responsive grid */}
                        <div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 pb-20">
                            {tickets.map((ticket, index) => (
                                <div
                                    key = {ticket.id}
                                    className = "animate-in slide-in-from-bottom-8 fade-in duration-700 fill-mode-backwards"
                                    style = {{animationDelay : `${index * 100}ms`}}
                                >
                                    <TicketCard ticket = {ticket} />
                                </div>
                            ))}
                        </div>
                        
                        {/* Infinite scroll logic comes here. This div is placed at the bottom. When this comes into view, we fetch more. */}
                        {nextPage && (
                            <div
                                ref = {ref}
                                className = "flex justify-center py-12"
                            >
                                <Loader2 className = "w-8 h-8 text-orange-500 animate-spin" />
                            </div>
                        )}

                        {/* End of list indicator - Runs when there are no more tickets to display */}
                        {!nextPage && tickets.length > 0 && (
                            <div className = "text-center py-12">
                                <p className = "text-zinc-700 text-xs font-mono uppercase tracking-widest">
                                    - End of Wallet -
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>

    )
}
