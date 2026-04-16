// HostAttendeeTable.jsx


import React, {useState} from 'react'
import {CheckCircle, ChevronDown, ChevronRight, Clock, IdCard, Loader2, Phone, Receipt, XCircle} from 'lucide-react'

import api from '../../api/api'


export default function HostAttendeeTable({groupedOrders = [], onActionComplete}) {

    const [processingId, setProcessingId] = useState(null)
    const [expandedOrders, setExpandedOrders] = useState({})

    const toggleOrder = (orderId) => {
        setExpandedOrders(prev => ({
            ...prev, [orderId] : !prev[orderId]
        }))
    }

    const handlePaymentAction = async (regId, action) => {
        if (!window.confirm(`Are you sure you want to ${action} this payment?`)) return

        setProcessingId(regId)

        try {
            await api.post('/api/host/process-payment/', {
                registration_id : regId,
                action : action, // 'approve' or 'reject'
            })

            if (onActionComplete) onActionComplete()
        } catch (err) {
            console.error(err)

            alert("Failed to process action.")
        } finally {
            setProcessingId(null) // Resetting the setProcessingId state
        }
    }

    const getBadgeStyle = (type) => {
        const base = "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md"

        switch (type) {
            case 'success': return `${base} bg-emerald-500/10 text-emerald-500 border-emerald-500/20`
            case 'warning': return `${base} bg-yellow-500/10 text-yellow-500 border-yellow-500/20`
            case 'danger': return `${base} bg-red-500/10 text-red-500 border-red-500/20`
            default: return `${base} bg-zinc-800 text-zinc-400 border-zinc-700`
        }
    }

    const StatusBadge = ({person}) => {
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
                        className = 'animate-pulse'
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
    }

    const ActionButtons = ({person, processingId, handlePaymentAction, isMobile = false}) => (
        <div
            className = {`
                flex items-center gap-2
                ${isMobile
                    ? "w-full mt-4"
                    : 'justify-end'
                }
            `}
        >
            <button
                onClick = {() => handlePaymentAction(person.id, 'approve')}
                disabled = {processingId === person.id}
                className = {`
                    bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all disabled:opacity-50
                    ${isMobile
                        ? "flex-1 py-3 text-sm"
                        : "px-3 py-1.5 text-xs"
                    }
                `}
            >
                {processingId === person.id
                    ? <Loader2 className = "h-4 w-4 animate-spin mx-auto" />
                    : 'Approve'
                }
            </button>

            <button
                onClick = {() => handlePaymentAction(person.id, 'reject')}
                disabled = {processingId === person.id}
                className = {`
                    bg-transparent hover:bg-red-900/10 border border-zinc-700 text-zinc-400 rounded-lg font-bold transition-all
                    disabled:opacity-50
                    ${isMobile
                        ? "flex-1 py-3 text-sm"
                        : "px-3 py-1.5 text-xs"
                    }
                `}
            >
                Reject
            </button>
        </div>
    )

    const GuestRow = ({ticket, processingId, handlePaymentAction}) => (
        <tr className = "bg-zinc-900/50 hover:bg-zinc-800/40 transition-colors border-b border-zinc-800/50 last:border-0">
            <td className = "p-4 pl-12">
                <div className = "flex items-center gap-2">
                    <div className = "h-1.5 w-1.5 rounded-full bg-zinc-600" />

                    <div>
                        <p className = "font-bold text-zinc-300 text-sm">
                            {ticket.first_name} {ticket.last_name}
                        </p>

                        <p className = "text-xs text-zinc-500">
                            {ticket.email}
                        </p>
                    </div>
                </div>
            </td>

            <td className = 'p-4'>
                <StatusBadge person = {ticket} />
            </td>

            <td className = 'p-4'>
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
            </td>

            <td className = "p-4 text-right">
                {ticket.payment_status === 'pending' ? (
                    <ActionButtons
                        person = {ticket}
                        processingId = {processingId}
                        handlePaymentAction = {handlePaymentAction}
                    />
                ) : ticket.payment_status === 'verified' ? (
                    <span className = "text-zinc-600 text-xs font-mono uppercase">
                        Ticket Sent
                    </span>
                ) : null}
            </td>
        </tr>
    )

    return (

        <div className = 'w-full'>
            {/* Mobile View */}
            <div className = "flex flex-col gap-4 md:hidden">
                {groupedOrders.map((order) => {
                    const isExpanded = expandedOrders[order.id]

                    return (

                        <div
                            key = {order.id}
                            className = "bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm"
                        >
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
                                        {new Date(order.created_at).toLocaleDateString('en-GB', {day : 'numeric', month : 'short', hour : '2-digit', minute : '2-digit'})}
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

                                        {isExpanded
                                            ? <ChevronDown
                                                size = {14}
                                                className = 'text-zinc-500'
                                            />
                                            : <ChevronRight
                                                size = {14}
                                                className = 'text-zinc-500'
                                            />
                                        }
                                    </div>
                                </div>
                            </div>
                            
                            {isExpanded && (
                                <div className = "divide-y divide-zinc-800/50 border-t border-zinc-800">
                                    {order.tickets.map(ticket => (
                                        <div
                                            key = {ticket.id}
                                            className = "p-4 bg-zinc-900/40"
                                        >
                                            <div className = "flex justify-between items-start mb-3">
                                                <div>
                                                    <p className = "font-bold text-zinc-200 text-sm flex items-center gap-2">
                                                        <div className = "h-1 w-1 rounded-full bg-orange-500" />

                                                        {ticket.first_name} {ticket.last_name}
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

                                            {ticket.payment_status === 'pending' ? (
                                                <ActionButtons
                                                    person = {ticket}
                                                    isMobile = {true}
                                                />
                                            ) : ticket.payment_status === 'verified' ? (
                                                <div className = "w-full mt-3 py-2 bg-zinc-800/50 rounded border border-zinc-800 text-center text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
                                                    Ticket Sent
                                                </div>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    )
                })}

                {groupedOrders.length === 0 && (
                    <div className = "p-8 text-center text-zinc-600 text-sm font-medium border border-zinc-800 rounded-xl border-dashed">
                        No orders found.
                    </div>
                )}
            </div>
            
            {/* Desktop View */}
            <div className = "hidden md:block overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30">
                <table className = "w-full text-left border-collapse">
                    <thead className = "bg-zinc-900/80 text-zinc-500 border-b border-zinc-800">
                        <tr>
                            <th className = "p-4 font-bold text-xs uppercase tracking-widest w-[40%]">Buyer / Guests</th>
                            <th className = "p-4 font-bold text-xs uppercase tracking-widest">Order Status</th>
                            <th className = "p-4 font-bold text-xs uppercase tracking-widest">Date</th>
                            <th className = "p-4 font-bold text-xs uppercase tracking-widest text-right">Tickets</th>
                        </tr>
                    </thead>

                    <tbody className = "divide-y divide-zinc-800">
                        {groupedOrders.map((order) => {
                            const isExpanded = expandedOrders[order.id]

                            return (

                                <React.Fragment key = {order.id}>
                                    <tr
                                        onClick = {() => toggleOrder(order.id)}
                                        className = "group hover:bg-zinc-800/60 cursor-pointer transition-colors bg-zinc-950"
                                    >
                                        {/* Name & Email */}
                                        <td className = 'p-4'>
                                            <div className = "flex items-center gap-3">
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
                                            </div>
                                        </td>

                                        <td className = 'p-4'>
                                            <span className = "text-xs font-mono text-zinc-400 uppercase">
                                                {order.payment_status}
                                            </span>
                                        </td>

                                        <td className = 'p-4'>
                                            <span className = "text-xs text-zinc-500">
                                                {new Date(order.created_at).toLocaleDateString('en-GB', {day : 'numeric', month : 'short'})}
                                            </span>
                                        </td>
                                        
                                        {/* Status Badges */}
                                        <td className = "p-4 text-right">
                                            <span className = "inline-flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-900 text-zinc-300 text-xs font-bold border border-zinc-800">
                                                <Receipt
                                                    size = {12}
                                                    className = 'text-orange-500'
                                                />

                                                {order.tickets.length} Ticket{order.tickets.length > 1 ? 's' : ''}
                                            </span>
                                        </td>
                                    </tr>

                                    {isExpanded && (
                                        <>
                                            {order.tickets.map(ticket => (
                                                <GuestRow
                                                    key = {ticket.id}
                                                    ticket = {ticket}
                                                    processingId = {processingId}
                                                    handlePaymentAction = {handlePaymentAction}
                                                />
                                            ))}
                                        </>
                                    )}
                                </React.Fragment>
                            )
                        })}

                        {groupedOrders.length === 0 && (
                            <tr>
                                <td
                                    colSpan = '4'
                                    className = "p-12 text-center text-zinc-600 text-sm font-medium"
                                >
                                    No registrations yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

    )

}
