// HostAttendeeTable.jsx


import {useState} from 'react'
import {Phone, IdCard, CheckCircle, Clock, XCircle, Loader2, ChevronRight, Loader} from 'lucide-react'

import api from '../../api/api'


export default function HostAttendeeTable({attendees, onActionComplete}) {

    const [processingId, setProcessingId] = useState(null)

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
            case 'success':

                return `${base} bg-emerald-500/10 text-emerald-500 border-emerald-500/20`

            case 'warning':

                return `${base} bg-yellow-500/10 text-yellow-500 border-yellow-500/20`

            case 'danger':

                return `${base} bg-red-500/10 text-red-500 border-red-500/20`

            default:

                return `${base} bg-zinc-800 text-zinc-400 border-zinc-700`
        }
    }

    const ActionButtons = ({person, isMobile = false}) => {
        <div className = {`flex items-center gap-2 ${isMobile ? "w-full mt-4" : 'justify-end'}`}>
            <button
                onClick = {() => handlePaymentAction(person.id, 'approve')}
                disabled = {processingId === person.id}
                className = {`
                    relative bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20
                    ${isMobile
                        ? "flex-1 py-3 text-sm"
                        : "px-3 py-1.5 text-xs"
                    }
                `}
            >
                {processingId === person.id
                    ? <Loader2 className = "h-4 w-4 animate-spin mx-auto" />
                    : "Approve"
                }
            </button>

            <button
                onClick = {() => handlePaymentAction(person.id, 'reject')}
                disabled = {processingId === person.id}
                className = {`
                    bg-transparent hover:bg-red-900/10 border border-zinc-700 hover:border-red-900/50 text-zinc-400 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed
                    ${isMobile
                        ? "flex-1 py-3 text-sm"
                        : "px-3 py-1.5 text-xs"
                    }
                `}
            >
                Reject
            </button>
        </div>
    }

    const StatusBadge = ({person}) => {
        if (person.payment_status === 'verified' || person.checked_in) {

            return (

                <span className = {getBadgeStyle('success')}>
                    <CheckCircle
                        size = {12}
                        strokeWidth = {3}
                    />

                    {person.checked_in
                        ? "Checked In"
                        : "Confirmed"
                    }
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

    return (

        <div className = 'w-full'>
            {/* Mobile View */}
            <div className = "flex flex-col gap-4 md:hidden">
                {attendees.map((person) => (
                    <div
                        key = {person.id}
                        className = "bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm"
                    >
                        <div className = "flex justify-between items-start mb-4">
                            <div>
                                <h3 className = "font-bold text-white text-base">
                                    {person.first_name} {person.last_name}
                                </h3>

                                <p className = "text-xs text-zinc-400">
                                    {person.email}
                                </p>
                            </div>

                            <StatusBadge person = {person} />
                        </div>

                        <div className = "space-y-2 mb-4">
                            <div className = "flex items-center justify-between text-xs">
                                <span className = 'text-zinc-500'>
                                    College
                                </span>

                                <span className = "text-zinc-300 font-medium text-right max-w-[60%] truncate">
                                    {person.school_college || '-'}
                                </span>
                            </div>

                            <div className = "flex items-center justify-between text-xs">
                                <span className = 'text-zinc-500'>
                                    Contact
                                </span>

                                <div className = "flex items-center gap-2 text-zinc-300">
                                    {person.phone_number || '-'}
                                    {person.student_id_number && ( 
                                        <span className = "px-1.5 py-0.5 bg-zinc-800 rounded text-[10px] text-zinc-400">
                                            ID: {person.student_id_number}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className = "flex items-center justify-between text-xs">
                                <span className = 'text-zinc-500'>
                                    Txn ID
                                </span>

                                <code className = "bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300 font-mono">
                                    {person.transaction_id || '-'}
                                </code>
                            </div>
                        </div>

                        {person.payment_status === 'pending' && (
                            <ActionButtons 
                                person = {person}
                                isMobile = {true}
                            />
                        )}

                        {person.payment_status === 'verified' && (
                            <div className = "w-full py-2 bg-zinc-800/50 rounded border border-zinc-800 text-center text-xs text-zinc-500 uppercase tracking-widest font-mono">
                                Ticket Sent
                            </div>
                        )}
                    </div>
                ))}
            </div>
            
            {/* Desktop View */}
            <div className = "hidden md:block overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30">
                <table className = "w-full text-left border-collapse">
                    <thead className = "bg-zinc-900/80 text-zinc-500 border-b border-zinc-800">
                        <tr>
                            <th className = "p-4 font-bold text-xs uppercase tracking-widest">Details</th>
                            <th className = "p-4 font-bold text-xs uppercase tracking-widest">Status</th>
                            <th className = "p-4 font-bold text-xs uppercase tracking-widest">Info</th>
                            <th className = "p-4 font-bold text-xs uppercase tracking-widest">Transaction ID</th>
                            <th className = "p-4 font-bold text-xs uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>

                    <tbody className = "divide-y divide-zinc-800">
                        {attendees.map((person) => (
                            <tr
                                key = {person.id}
                                className = "group hover:bg-zinc-800/40 transition-colors"
                            >
                                {/* Name & Email */}
                                <td className = 'p-4'>
                                    <p className = "font-bold text-white text-sm">
                                        {person.first_name} {person.last_name}
                                    </p>
                                    <p className = "text-xs text-zinc-400">
                                        {person.email}
                                    </p>
                                </td>

                                <td className = 'p-4'>
                                    <StatusBadge person = {person} />
                                </td>

                                {/* Status Badges */}
                                <td className = 'p-4'>
                                    <div className = 'space-y-1'>
                                        <p 
                                            className = "text-xs text-zinc-300 truncate max-w-[150px]"
                                            title = {person.school_college}
                                        >
                                            {person.school_college || '-'}
                                        </p>

                                        <div className = "flex items-center gap-2 text-[10px] text-zinc-500">
                                            {person.phone_number && (
                                                <span className = "flex items-center gap-1">
                                                    <Phone size = {10} />

                                                    {person.phone_number}
                                                </span>
                                            )}

                                            {person.student_id_number && (
                                                <span className = "flex items-center gap-1">
                                                    <IdCard size = {10} />

                                                    {person.student_id_number}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </td>

                                {/* Transaction ID */}
                                <td className = 'p-4'>
                                    {person.transaction_id ? (
                                        // code tag is used to define a piece of computer code within a document. Displays it as computer code.
                                        <code className = "bg-zinc-950 border border-zinc-800 px-2 py-1 rounded text-xs font-mono text-zinc-400 group-hover:text-zinc-200 transition-colors"> 
                                            {person.transaction_id}
                                        </code>
                                    ) : (
                                        <span className = "text-zinc-700 text-xs">
                                            -
                                        </span>
                                    )}
                                </td>

                                {/* Approve & Reject Buttons */}
                                <td className = "p-4 text-right">
                                    {person.payment_status === 'pending' ? (
                                        <ActionButtons person = {person} />
                                    ) : person.payment_status === 'verified' ? (
                                        <span className = "text-zinc-600 text-xs font-mono uppercase tracking-wider">
                                            Ticket Sent
                                        </span>
                                    ) : null}
                                </td>
                            </tr>
                        ))}

                        {attendees.length === 0 && (
                            <tr>
                                <td
                                    colSpan = '5'
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
