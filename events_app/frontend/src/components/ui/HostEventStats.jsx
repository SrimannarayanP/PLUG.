// HostEventStats.jsx


import {Activity, AlertCircle, CreditCard, IndianRupee, MapPin, Mouse, MousePointerClick, Ticket, Users} from 'lucide-react'
import {useEffect, useState} from 'react'
import {useParams} from 'react-router-dom'
import {Area, AreaChart, Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts'

import api from '../../api/api'

import LoadingSpinner from '../common/LoadingSpinner'


export default function HostEventStats() {

    const {eventId} = useParams()

    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get(`/api/host/event/${eventId}/stats/`)

                setStats(res.data)
            } catch (err) {
                console.error("Failed to fetch stats", err)

                setError("Failed to load event statistics. Please try again.")
            } finally {
                setLoading(false)
            }
        }

        if (eventId) {
            fetchStats()
        }
    }, [eventId])

    const festiveGradient = "bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600"

    const PAYMENT_COLORS = {
        'verified' : '#10b981',
        'pending' : '#f59e0b',
        'rejected' : '#ef4444',
        'refund_pending' : '#f43f5e',
        'refund_processed' : '#9f1239'
    }

    if (loading) {

        return (

            <div className = "space-y-8 animate-in fade-in duration-500">
                <div className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Scoreboard Skeleton */}
                    {[1, 2, 3, 4].map(i => (
                        <div
                            key = {i}
                            className = "bg-[#18181b] border border-zinc-800 p-6 rounded-2xl shadow-lg relative overflow-hidden h-32"
                        >
                            <div className = "absolute inset-0 bg-zinc-800/20 animate-pulse" />

                            <div className = "h-4 w-24 bg-zinc-800 rounded-md mb-6" />

                            <div className = "h-8 w-16 bg-zinc-800 rounded-lg" />
                        </div>
                    ))}
                </div>

                {/* Chart & Demographic Skeleton */}
                <div className = "grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div
                            key = {i}
                            className = "bg-[#18181b] border border-zinc-800 p-6 rounded-2xl shadow-lg h-[400px] relative overflow-hidden"
                        >
                            <div className = "absolute inset-0 bg-zinc-800/10 animate-pulse" />

                            <div className = "h-4 w-32 bg-zinc-800 rounded-md mb-8" />

                            <div className = "h-[280px] w-full bg-zinc-900/50 rounded-xl border border-zinc-800/50" />
                        </div>
                    ))}
                </div>
            </div>

        )

    }

    if (error) {

        return (

            <div className = "flex items-center gap-3 p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500">
                <AlertCircle className = "h-5 w-5" />

                <span className = "text-sm font-bold tracking-wide">
                    {error}
                </span>
            </div>

        )

    }

    const overview = stats?.overview || {}
    const totalSold = overview.total_sold || 0
    const checkedIn = overview.checked_in_count || 0
    const totalRevenue = overview.total_revenue || 0
    const conversionRate = overview.conversion_rate || 0

    const velocityData = stats?.velocity || []
    const demographicsData = stats?.demographics || {}
    const doorTrafficData = stats?.door_traffic || []
    const paymentFunnelData = stats?.payment_funnel || {}

    return (

        <div className = "space-y-8 animate-in fade-in duration-500">
            {/* Scoreboard */}
            <div className = "grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className = "bg-[#18181b] border border-zinc-800 p-6 rounded-2xl shadow-lg relative overflow-hidden">
                    <div className = {`absolute top-0 left-0 h-1 w-full ${festiveGradient}`} />

                    <div className = "flex items-center justify-between mb-4">
                        <span className = "text-xs font-bold text-zinc-500 uppercase tracking-widest">
                            Total Tickets
                        </span>

                        <Ticket className = "h-5 w-5 text-zinc-400 group-hover:text-white transition-colors" />
                    </div>

                    <div className = "text-4xl font-black text-white">
                        {totalSold}
                    </div>
                </div>

                <div className = "bg-[#18181b] border border-zinc-800 p-6 rounded-2xl shadow-lg relative overflow-hidden group hover:border-zinc-700 transition-colors">
                    <div className = "absolute top-0 left-0 h-1 w-full bg-green-500" />

                    <div className = "flex items-center justify-between mb-4">
                        <span className = "text-xs font-bold text-zinc-500 uppercase tracking-widest">
                            Gross Revenue
                        </span>

                        <IndianRupee className = "h-5 w-5 text-zinc-400 group-hover:text-green-500 transition-colors" />
                    </div>

                    <div className = "text-3xl lg:text-4xl font-black text-white flex items-center">
                        <span className = "text-zinc-600 mr-1">
                            ₹
                        </span>

                        {totalRevenue.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </div>
                </div>

                <div className = "bg-[#18181b] border border-zinc-800 p-6 rounded-2xl shadow-lg relative overflow-hidden group hover:border-zinc-700 transition-colors">
                    <div className = "absolute top-0 left-0 h-1 w-full bg-blue-500" />

                    <div className = "flex items-center justify-between mb-4">
                        <span className = "text-xs font-bold text-zinc-500 uppercase tracking-widest">
                            Checked In
                        </span>

                        <Users className = "h-5 w-5 text-zinc-400 group-hover:text-blue-500 transition-colors" />
                    </div>

                    <div className = "flex items-end gap-3">
                        <div className = "text-4xl font-black text-white">
                            {checkedIn}
                        </div>

                        <div className = "text-sm font-bold text-zinc-500 mb-1">
                            / {totalSold}
                        </div>
                    </div>
                </div>

                <div className = "bg-[#18181b] border border-zinc-800 p-6 rounded-2xl shadow-lg relative overflow-hidden group hover:border-zinc-700 transition-colors">
                    <div className = "absolute top-0 left-0 h-1 w-full bg-purple-500" />

                    <div className = "flex items-center justify-between mb-4">
                        <span className = "text-xs font-bold text-zinc-500 uppercase tracking-widest">
                            Conversion
                        </span>

                        <MousePointerClick className = "h-5 w-5 text-zinc-400 group-hover:text-purple-500 transition-colors" />
                    </div>

                    <div className = "flex items-end gap-2">
                        <div className = "text-4xl font-black text-white">
                            {conversionRate}%
                        </div>
                    </div>
                </div>
            </div>

            <div className = "grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Velocity Chart */}
                <div className = "bg-[#18181b] border border-zinc-800 p-6 rounded-2xl shadow-lg flex flex-col h-[400px] min-w-0">
                    <h3 className = "text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Activity className = "h-4 w-4 bg-orange-500" />
                        
                        Sales Velocity
                    </h3>

                    {velocityData.length === 0 ? (
                        <div className = "flex-1 flex items-center justify-center border border-dashed border-zinc-800 rounded-xl">
                            <span className = "text-xs font-mono text-zinc-600 uppercase tracking-widest">
                                No Sales Data
                            </span>
                        </div>
                    ) : (
                        <div className = "flex-1 w-full">
                            <ResponsiveContainer
                                height = '100%'
                                width = '100%'
                            >
                                <AreaChart
                                    data = {velocityData}
                                    margin = {{top : 10, right : 10, left : -20, bottom : 0}}
                                >
                                    <defs>
                                        <linearGradient
                                            id = 'colorTickets'
                                            x1 = '0'
                                            y1 = '0'
                                            x2 = '0'
                                            y2 = '1'
                                        >
                                            <stop
                                                offset = '5%'
                                                stopColor = '#f97316'
                                                stopOpacity = {0.3}
                                            />

                                            <stop
                                                offset = '95%'
                                                stopColor = '#f97316'
                                                stopOpacity = {0}
                                            />
                                        </linearGradient>
                                    </defs>

                                    <XAxis
                                        dataKey = 'date'
                                        stroke = '#52525b'
                                        fontSize = {10}
                                        tickLine = {false}
                                        axisLine = {false}
                                        tickFormatter = {(str) => {
                                            const date = new Date(str)

                                            return `${date.getDate()} ${date.toLocaleDateString('default', {month : 'short'})}`
                                        }}
                                    />

                                    <YAxis
                                        stroke = '#52525b'
                                        fontSize = {10}
                                        tickLine = {false}
                                        axisLine = {false}
                                        allowDecimals = {false}
                                    />

                                    <Tooltip
                                        contentStyle = {{backgroundColor : '#09090b', borderColor : '#27272a', borderRadius : '12px'}}
                                        itemStyle = {{color : '#fff', fontSize : '12px', fontWeight : 'bold'}}
                                        labelStyle = {{color : '#a1a1aa', fontSize : '10px', textTransform : 'uppercase'}}
                                    />

                                    <Area
                                        type = 'monotone'
                                        dataKey = 'tickets'
                                        stroke = '#f97316'
                                        strokeWidth = {3}
                                        fillOpacity = {1}
                                        fill = 'url(#colorTickets)'
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
                
                {/* Door Traffic */}
                <div className = "bg-[#18181b] border border-zinc-800 p-6 rounded-2xl shadow-lg flex flex-col h-[400px] min-w-0">
                    <h3 className = "text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Users className = "h-4 w-4 text-blue-500" />

                        Door Traffic
                    </h3>

                    {doorTrafficData.length === 0 ? (
                        <div className = "flex-1 flex items-center justify-center border border-dashed border-zinc-800 rounded-xl">
                            <span className = "text-xs font-mono text-zinc-600 uppercase tracking-widest text-center px-4">
                                Waiting for Check-ins
                            </span>
                        </div>
                    ) : (
                        <div className = "flex-1 w-full">
                            <ResponsiveContainer
                                height = '100%'
                                width = '100%'
                            >
                                <BarChart
                                    data = {doorTrafficData}
                                    margin = {{top : 10, right : 10, left : -20, bottom : 0}}
                                >
                                    <XAxis
                                        dataKey = 'hour'
                                        stroke = '#52525b'
                                        fontSize = {10}
                                        tickLine = {false}
                                        axisLine = {false}
                                        tickFormatter = {(str) => (
                                            new Date(str).toLocaleDateString([], {hour : '2-digit', minute : '2-digit'})
                                        )}
                                    />

                                    <YAxis
                                        stroke = '#52525b'
                                        fontSize = {10}
                                        tickLine = {false}
                                        axisLine = {false}
                                        allowDecimals = {false}
                                    />

                                    <Tooltip
                                        cursor = {{fill : '#27272a', opacity : 0.4}}
                                        contentStyle = {{backgroundColor : '#09090b', borderColor : '#27272a', borderRadius : '12px'}}
                                        itemStyle = {{color : '#fff', fontSize : '12px', fontWeight : 'bold'}}
                                        labelFormatter = {(label) => (
                                            new Date(label).toLocaleDateString([], {hour : '2-digit', minute : '2-digit'})
                                        )}
                                    />

                                    <Bar
                                        dataKey = 'count'
                                        fill = '#3b82f6'
                                        radius = {[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Payment Funnel */}
                <div className = "bg-[#18181b] border border-zinc-800 p-6 rounded-2xl shadow-lg flex flex-col h-[400px] min-w-0">
                    <h3 className = "text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                        <CreditCard className = "h-4 w-4 text-emerald-500" />

                        Transaction Status
                    </h3>

                    {paymentFunnelData.length === 0 ? (
                        <div className = "flex-1 flex items-center justify-center border border-dashed border-zinc-800 rounded-xl">
                            <span className = "text-xs font-mono text-zinc-600 uppercase tracking-widest text-center px-4">
                                No Transactions Recorded
                            </span>
                        </div>
                    ) : (
                        <div className = "flex-1 flex items-center justify-center">
                            <div className = "h-[250px] w-full">
                                <ResponsiveContainer
                                    height = '100%'
                                    width = '100%'
                                >
                                    <PieChart>
                                        <Pie
                                            data = {paymentFunnelData}
                                            innerRadius = {60}
                                            outerRadius = {90}
                                            paddingAngle = {5}
                                            dataKey = 'count'
                                            nameKey = 'payment_status'
                                            stroke = 'none'
                                        >
                                            {paymentFunnelData.map((entry, index) => (
                                                <Cell
                                                    key = {`cell-${index}`}
                                                    fill = {PAYMENT_COLORS[entry.payment_status] || '#52525b'}
                                                />
                                            ))}
                                        </Pie>

                                        <Tooltip
                                            contentStyle = {{backgroundColor : '#09090b', borderColor : '#27272a', borderRadius : '12px', textTransform : 'uppercase', fontSize : '10px', fontWeight : 'bold'}}
                                            itemStyle = {{color : '#fff', fontSize : '12px'}}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Legend */}
                            <div className = "flex flex-col gap-3 justify-center ml-4">
                                {paymentFunnelData.map((entry, index) => (
                                    <div
                                        key = {index}
                                        className = "flex items-center gap-2"
                                    >
                                        <div
                                            className = "h-3 w-3 rounded-full"
                                            style = {{backgroundColor : PAYMENT_COLORS[entry.payment_status] || '#52525b'}}
                                        />

                                        <div className = "flex flex-col">
                                            <span className = "text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">
                                                {entry.payment_status.replace('_', ' ')}
                                            </span>

                                            <span className = "text-sm font-black text-white leading-none">
                                                {entry.count}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Demographics */}
                <div className = "bg-[#18181b] border border-zinc-800 p-6 rounded-2xl shadow-lg flex flex-col h-[400px] min-w-0">
                    <h3 className = "text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                        <MapPin className = "h-4 w-4 text-pink-500" />

                        Top Campuses
                    </h3>

                    {demographicsData.length === 0 ? (
                        <div className = "flex-1 flex items-center justify-center border border-dashed border-zinc-800 rounded-xl">
                            <span className = "text-xs font-mono text-zinc-600 uppercase tracking-widest text-center px-4">
                                Insufficient Demographic Data
                            </span>
                        </div>
                    ) : (
                        <div className = "space-y-4 overflow-y-auto pr-2 no-scrollbar">
                            {demographicsData.map((item, index) => {
                                // Calculate width percentage based on count relative to max count, with a minimum width for visibility
                                const maxCount = demographicsData[0]?.count || 1
                                const widthPercent = Math.max(10, (item.count / maxCount) * 100)

                                return (

                                    <div
                                        key = {index}
                                        className = 'space-y-2'
                                    >
                                        <div className = "flex justify-between items-end text-xs font-bold">
                                            <span className = "text-zinc-300 truncate pr-4">
                                                {item.college_name || 'Unknown/External'}
                                            </span>

                                            <span className = "text-white bg-zinc-800 px-2 py-0.5 rounded-md">
                                                {item.count}
                                            </span>
                                        </div>

                                        <div className = "h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                                            <div
                                                className = {`h-full rounded-full ${festiveGradient}`}
                                                style = {{width : `${widthPercent}%`}}
                                            />
                                        </div>
                                    </div>

                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>

    )

}
