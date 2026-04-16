// CategoryRow.jsx


import {ArrowRight} from 'lucide-react'
import {useEffect, useState} from 'react'
import {useNavigate} from 'react-router-dom'

import apiPublic from '../../api/apiPublic'

import EventCard from './EventCard'


export default function CategoryRow({category, onRegisterClick, onDetailsClick}) {

    const navigate = useNavigate()

    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let isMounted = true

        const fetchCategoryEvents = async () => {
            try {
                const res = await apiPublic.get(`/api/events/upcoming/?category_id=${category.id}`)

                if (isMounted) {
                    const data = res.data.results || res.data

                    setEvents(data)
                }
            } catch (err) {
                console.error(`Failed to fetch events for ${category.name}`, err)
            } finally {
                if (isMounted) setLoading(false)
            }
        }

        fetchCategoryEvents()

        return () => {isMounted = false}
    }, [category.id])

    if (!loading && events.length === 0) return null

    return (

        <section className = "mb-10 sm:mb-14 pl-4 sm:pl-6 lg:pl-8 animate-in fade-in duration-700">
            <div className = "flex items-center justify-between mb-4 pr-4 sm:pr-6 lg:pr-8">
                <h3 className = "text-lg sm:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                    {category.name}
                </h3>

                <button
                    onClick = {() => navigate(`/events/category/${category.id}`, {state : {categoryName : category.name}})}
                    className = "text-[10px] sm:text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors flex items-center gap-1 group"
                >
                    View All

                    <ArrowRight className = "h-3 w-3 transition-transform group-hover:translate-x-1" />
                </button>
            </div>

            <div className = "flex overflow-x-auto gap-4 pb-4 -ml-4 pl-4 sm:ml-0 sm:pl-0 scrollbar-hide snap-x">
                {loading ? (
                    [...Array(4).map((_, i) => (
                        <div
                            key = {i}
                            className = "w-[220px] sm:w-[260px] h-[380px] sm:h-[420px] shrink-0 bg-zinc-900/50 rounded-[20px] animate-pulse border border-zinc-800"
                        />
                    ))]
                ) : (
                    events.map((event) => (
                        <div
                            key = {event.id}
                            className = "w-[220px] sm:w-[260px] shrink-0 snap-start"
                        >
                            <EventCard
                                event = {event}
                                onRegisterClick = {onRegisterClick}
                                onDetailsClick = {onDetailsClick}
                            />
                        </div>
                    ))
                )}
            </div>
        </section>

    )

}
