// HostAttendeeTable.jsx


import {useVirtualizer} from '@tanstack/react-virtual'
import React, {memo, useCallback, useRef, useState} from 'react'
import {CheckCircle, ChevronDown, ChevronRight, Clock, IdCard, Loader2, Phone, Receipt, XCircle} from 'lucide-react'

import api from '../../api/api'


const getBadgeStyle = (type) => {
    const base = "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transform-gpu"

    switch (type) {
        case 'success': return `${base} bg-emerald-500/10 text-emerald-500 border-emerald-500/20`
        case 'warning': return `${base} bg-yellow-500/10 text-yellow-500 border-yellow-500/20`
        case 'danger': return `${base} bg-red-500/10 text-red-500 border-red-500/20`
        default: return `${base} bg-zinc-800 text-zinc-400 border-zinc-700`
    }
}

const StatusBadge = memo(({person}) => {
    if (person.is_checked_in) {

        return (

            <span className = {getBadgeStyle('success')}>
                <CheckCircle
                    size = {12}
                    strokeWidth = {3}
                />

                Checked In
            </span>

        )

    }

    if (person.payment_status === 'verified') {

        return (

            <span className = {getBadgeStyle('success')}>
                <CheckCircle
                    size = {12}
                    strokeWidth = {3}
                />

                Confirmed
            </span>

        )

    }

    if (person.payment_status === 'rejected') {

        return (

            <span className = {getBadgeStyle('danger')}>
                <XCircle 
                    size = {12}
                    strokeWidth = {3}
                />

                Rejected
            </span>

        )

    }

    if (person.payment_status === 'pending') {

        return (

            <span className = {getBadgeStyle('warning')}>
                <Clock 
                    size = {12}
                    strokeWidth = {3}
                    className = "animate-pulse transform-gpu"
                />

                Pending
            </span>

        )

    }

    return (

        <span className = {getBadgeStyle('default')}>
            Registered
        </span>
    
    )
})

const OrderRow = memo(({order, isExpanded, processingId, toggleOrder, handleRefund, virtualRow, measureElement}) => {

    return (

        <div
            ref = {measureElement}
            data-index = {virtualRow.index}
            className = "absolute top-0 left-0 w-full md:border-b md:border-zinc-800"
            style = {{transform : `translateY(${virtualRow.start}px)`}}
        >
            <div className = "md:hidden pb-4">
                <div className = "bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                    <div
                        onClick = {() => toggleOrder(order.id)}
                        className = "p-4 flex justify-between items-start bg-zinc-950 cursor-pointer active:bg-zinc-900 transition-colors"
                    >
                        <div>
                            <h3 className = "font-bold text-white text-base">
                                {order.buyer_name}
                            </h3>

                            <p className = "text-xs text-zinc-400">
                                {order.buyer_email}
                            </p>

                            <p className = "text-[10px] text-zinc-500 mt-1">
                                {new Date(order.created_at).toLocaleDateString('en-GB', {
                                    day : 'numeric',
                                    month : 'short',
                                    hour : '2-digit',
                                    minute : '2-digit'
                                })}
                            </p>
                        </div>

                        <div className = "flex flex-col items-end gap-2">
                            <span className = "text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                                {order.payment_status}
                            </span>

                            <div className = "flex items-center gap-1.5 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                                <span className = "text-xs font-bold text-orange-500">
                                    {order.tickets.length}
                                </span>

                                {isExpanded ? (
                                    <ChevronDown
                                        size = {14}
                                        className = 'text-zinc-500'
                                    />
                                ) : (
                                    <ChevronRight
                                        size = {14}
                                        className = 'text-zinc-500'
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {isExpanded && (
                        <div className = "divide-y divide-zinc-800/50 border-t border-zinc-800">
                            {order.tickets.map((ticket) => (
                                <div
                                    key = {ticket.id}
                                    className = "p-4 bg-zinc-900/40"
                                >
                                    <div className = "flex justify-between items-start mb-3">
                                        <div>
                                            <p className = "font-bold text-zinc-200 text-sm flex items-center gap-2">
                                                <span className = "h-1 w-1 rounded-full bg-orange-500">
                                                    {ticket.first_name} {ticket.last_name}
                                                </span>
                                            </p>

                                            <p className = "text-xs text-zinc-500 ml-3">
                                                {ticket.email}
                                            </p>
                                        </div>

                                        <StatusBadge person = {ticket} />
                                    </div>

                                    <div className = "space-y-2 mb-2 ml-3">
                                        <p className = "text-xs text-zinc-400 truncate">
                                            {ticket.school_college || '-'}
                                        </p>

                                        <div className = "flex items-center gap-3 text-[10px] text-zinc-500">
                                            {ticket.phone_number && (
                                                <span className = "flex items-center gap-1">
                                                    <Phone size = {10} />

                                                    {ticket.phone_number}
                                                </span>
                                            )}

                                            {ticket.student_id_number && (
                                                <span className = "flex items-center gap-1">
                                                    <IdCard size = {10} />

                                                    {ticket.student_id_number}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {ticket.payment_status === 'verified' && !ticket.is_checked_in ? (
                                        <button
                                            onClick = {() => handleRefund(ticket.id)}
                                            disabled = {processingId === ticket.id}
                                            className = "w-full mt-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded border border-red-500/20 text-center text-xs font-bold transition-colors"
                                        >
                                            {processingId === ticket.id ? (
                                                <Loader2 className = "h-4 w-4 animate-spin mx-auto" />
                                            ) : (
                                                "Initiate Refund"
                                            )}
                                        </button>
                                    ) : ticket.payment_status === 'pending' ? (
                                        <div className = "w-full mt-3 py-2 bg-zinc-800/50 rounded border border-zinc-800 text-center text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
                                            Awaiting Gateway
                                        </div>
                                    ) : (
                                        null
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
                
            {/* Desktop View */}
            <div className = "hidden md:block bg-zinc-950 transition-colors">
                {/* Guest Row */}
                <div
                    onClick = {() => toggleOrder(order.id)}
                    className = "grid grid-cols-12 gap-4 p-4 hover:bg-zinc-800/60 cursor-pointer items-center"
                >
                    <div className = "col-span-5 flex items-center gap-3">
                        {isExpanded ? (
                            <ChevronDown
                                size = {16}
                                className = 'text-zinc-500'
                            />
                        ) : (
                            <ChevronRight
                                size = {16}
                                className = 'text-zinc-500'
                            />
                        )}

                        <div>
                            <p className = "font-bold text-white text-sm">
                                {order.buyer_name}
                            </p>

                            <p className = "text-xs text-zinc-400">
                                {order.buyer_email}
                            </p>
                        </div>

                        <div className = 'col-span-3'>
                            <span className = "text-xs font-mono text-zinc-400 uppercase">
                                {order.payment_status}
                            </span>
                        </div>

                        <div className = 'col-span-2'>
                            <span className = "text-xs text-zinc-500">
                                {new Date(order.created_at).toLocaleDateString('en-GB', {
                                    day : 'numeric',
                                    month : 'short'
                                })}
                            </span>
                        </div>

                        <div className = "col-span-2 text-right">
                            <span className = "inline-flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-900 text-zinc-300 text-xs font-bold border border-zinc-800">
                                <Receipt
                                    size = {12}
                                    className = 'text-orange-500'
                                />

                                {order.tickets.length} Ticket{order.tickets.length > 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>

                    {/* Expanded Guest Row */}
                    {isExpanded && (
                        <div className = 'bg-zinc-900/50'>
                            {order.tickets.map(ticket => (
                                <div
                                    key = {ticket.id}
                                    className = "grid grid-cols-12 gap-4 p-4 pl-12 border-t border-zinc-800/50 items-center hover:bg-zinc-800/40 transition-colors"
                                >
                                    <div className = "col-span-5 flex items-center gap-2">
                                        <div className = "h-1.5 w-1.5 rounded-full bg-zinc-600 shrink-0" />

                                        <div className = 'min-w-0'>
                                            <p className = "font-bold text-zinc-300 text-sm truncate">
                                                {ticket.first_name} {ticket.last_name}
                                            </p>

                                            <p className = "text-xs text-zinc-500 truncate">
                                                {ticket.email}
                                            </p>
                                        </div>
                                    </div>

                                    <StatusBadge
                                        person = {ticket}
                                        className = 'col-span-3'
                                    />

                                    <div className = 'col-span-2'>
                                        <p className = "text-xs text-zinc-400 truncate max-w-[150px]">
                                            {ticket.school_college || '-'}
                                        </p>

                                        <div className = "flex items-center gap-2 text-[10px] text-zinc-500 mt-1">
                                            {ticket.phone_number && (
                                                <span className = "flex items-center gap-1">
                                                    <Phone size = {10} />

                                                    {ticket.phone_number}
                                                </span>
                                            )}

                                            {ticket.student_id_number && (
                                                <span className = "flex items-center gap-1">
                                                    <IdCard size = {10} />

                                                    {ticket.student_id_number}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className = "col-span-2 text-right">
                                        {ticket.payment_status === 'verified' && !ticket.is_checked_in ? (
                                            <button
                                                onClick = {() => handleRefund(ticket.id)}
                                                disabled = {processingId === ticket.id}
                                                className = "px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded border border-red-500/20 text-xs font-bold transition-colors"
                                            >
                                                {processingId === ticket.id ? (
                                                    <Loader2 className = "h-3 w-3 animate-spin mx-auto" />
                                                ) : (
                                                    'Refund'
                                                )}
                                            </button>
                                        ) : (
                                            null
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>

    )

}, (prevProps, nextProps) => {

    // Custom equality check to prevent unnecessary re-renders during scrolling
    return prevProps.isExpanded === nextProps.isExpanded && prevProps.processingId === nextProps.processingId && prevProps.order === nextProps.order

})


export default function HostAttendeeTable({groupedOrders = [], onActionComplete}) {

    const parentRef = useRef()

    const [processingId, setProcessingId] = useState(null)
    const [expandedOrders, setExpandedOrders] = useState({})

    const rowVirtualizer = useVirtualizer({
        count : groupedOrders.length,
        getScrollElement : () => parentRef.current,
        estimateSize : () => 80, // Estimate row height (in px)
        overscan : 5 // Number of extra rows to render beyond the visible area for smoother scrolling
    })

    const toggleOrder = (orderId) => {
        setExpandedOrders(prev => ({
            ...prev,
            [orderId] : !prev[orderId]
        }))
    }

    const handleRefund = useCallback(async (regId) => {
        if (!window.confirm(`Are you sure you want to ${action} this payment?`)) return

        setProcessingId(regId)

        try {
            await api.post('/api/host/process-payment/', {
                registration_id : regId,
                action : 'refund', // 'approve' or 'reject'
            })

            if (onActionComplete) onActionComplete()
        } catch (err) {
            console.error(err)

            alert("Failed to initiate refund.")
        } finally {
            setProcessingId(null) // Resetting the setProcessingId state
        }
    }, [onActionComplete])

    if (groupedOrders.length === 0) {

        return (

            <div className = "p-8 md:p-12 text-center text-zinc-600 text-sm font-medium border border-zinc-800 md:bg-zinc-900/30 rounded-xl border-dashed">
                No registrations yet.
            </div>

        )

    }

    return (

        <div className = "w-full flex flex-col">
            {/* Desktop Header */}
            <div className = "hidden md:grid grid-cols-12 gap-4 p-4 bg-zinc-900/80 text-zinc-500 border border-zinc-800 font-bold text-xs uppercase tracking-widest rounded-t-2xl">
                <div className = 'col-span-5'>
                    Buyer/Guests
                </div>

                <div className = 'col-span-3'>
                    Order Status
                </div>

                <div className = 'col-span-2'>
                    Date
                </div>

                <div className = 'col-span-2 text-right'>
                    Tickets
                </div>
            </div>

            <div
                ref = {parentRef}
                className = "h-[65vh] md:h-[600px] w-full overflow-y-auto custom-scrollbar scroll-smooth md:bg-zinc-900/30 md:border md:border-t-0 md:border-zinc-800 md:rounded-b-2xl"
            >
                <div
                    className = "w-full relative"
                    style = {{height : `${rowVirtualizer.getTotalSize()}px`}}
                >
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                        const order = groupedOrders[virtualRow.index]
                        const isExpanded = !!expandedOrders[order.id]
                        // Only pass the processing ID to the specific order that needs it. Prevents 15 other visible rows from unnecessarily re-rendering when you click
                        // a button. 
                        const activeProcessingId = order.tickets.some(t => t.id === processingId) ? processingId : null

                        return (

                            <OrderRow
                                key = {order.id}
                                order = {order}
                                isExpanded = {isExpanded}
                                processingId = {processingId}
                                toggleOrder = {toggleOrder}
                                handleRefund = {handleRefund}
                                virtualRow = {virtualRow}
                                measureElement = {rowVirtualizer.measureElement}
                            />

                        )
                    })}
                </div>
            </div>
        </div>

    )

}
