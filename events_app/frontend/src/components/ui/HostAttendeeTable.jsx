// HostAttendeeTable.jsx


import {useState} from 'react'
import {Phone, IdCard, CheckCircle, Clock, XCircle} from 'lucide-react'

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
        const base = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md"

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

    return (

        <div className = 'overflow-x-auto'>
            <table className = "w-full text-left border-collapse">
                <thead className = "bg-zinc-900/50 text-zinc-500 border-b border-zinc-800">
                    <tr>
                        <th className = "p-4 font-bold text-xs uppercase tracking-widest">Name</th>
                        <th className = "p-4 font-bold text-xs uppercase tracking-widest">Status</th>
                        <th className = "p-4 font-bold text-xs uppercase tracking-widest">Contact</th>
                        <th className = "p-4 font-bold text-xs uppercase tracking-widest">Transaction ID</th>
                        <th className = "p-4 font-bold text-xs uppercase tracking-widest text-right">Actions</th>
                    </tr>
                </thead>

                <tbody className = "divide-y divide-zinc-800">
                    {attendees.map((person) => (
                        <tr
                            key = {person.id}
                            className = "group hover:bg-zinc-800/30 transition-colors"
                        >
                            {/* Name & Email */}
                            <td className = 'p-4'>
                                <p className = "font-bold text-white text-sm">
                                    {person.name}
                                </p>
                                <p className = "text-xs text-zinc-400">
                                    {person.email}
                                </p>
                                <p className = "text-[10px] text-zinc-600 mt-0.5 uppercase tracking-wide font-medium">
                                    {person.college || '-'}
                                </p>
                            </td>

                            {/* Status Badges */}
                            <td className = 'p-4'>
                                {person.payment_status === 'verified' || person.checked_in ? (
                                    <span className = {getBadgeStyle('success')}>
                                        <CheckCircle 
                                            size = {12}
                                            strokeWidth = {3}
                                        />

                                        {person.checked_in ? "Checked In" : 'Confirmed'}
                                    </span>
                                ) : person.payment_status === 'rejected' ? (
                                    <span className = {getBadgeStyle('danger')}>
                                        <XCircle 
                                            size = {12}
                                            strokeWidth = {3}
                                        />

                                        Rejected
                                    </span>
                                ) : person.payment_status === 'pending' ? (
                                    <span className = {getBadgeStyle('warning')}>
                                        <Clock 
                                            size = {12}
                                            strokeWidth = {3}
                                            className = 'animate-pulse'
                                        />

                                        Pending
                                    </span>
                                ) : (
                                    <span className = {getBadgeStyle('default')}>
                                        Free / Registered
                                    </span>
                                )}
                            </td>

                            {/* Contact Details */}
                            <td className = "p-4 text-xs text-zinc-400 space-y-1.5">
                                {person.phone ? (
                                    <div className = "flex items-center gap-2 group-hover:text-zinc-300 transition-colors">
                                        <Phone 
                                            size = {14}
                                            className = "text-zinc-600 group-hover:text-orange-500 transition-colors"
                                        />

                                        <span className = 'font-mono'>
                                            {person.phone}
                                        </span>
                                    </div>
                                ) : (
                                    <span className = 'text-zinc-700'>
                                        -
                                    </span>
                                )}

                                {person.student_id && (
                                    <div className = "flex items-center gap-2 group-hover:text-zinc-300 transition-colors">
                                        <IdCard 
                                            size = {14}
                                            className = 'text-zinc-600 group-hover:text-pink-500 transition-colors'
                                        />

                                        <span className = 'font-mono'>
                                            {person.student_id}
                                        </span>
                                    </div>
                                )}
                            </td>

                            {/* Transaction ID */}
                            <td className = 'p-4'>
                                {person.transaction_id ? (
                                    // code tag is used to define a piece of computer code within a document. Displays it as computer code.
                                    <code className = "bg-zinc-900 border border-zinc-800 px-2 py-1 rounded text-xs font-mono text-zinc-300"> 
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
                                {person.payment_status === 'pending' && (
                                    <div className = "flex items-center justify-end gap-2">
                                        <button
                                            onClick = {() => handlePaymentAction(person.id, 'approve')}
                                            disabled = {processingId === person.id}
                                            className = "bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(16, 185, 129, 0.2)] hover:shadow-[0_0_15px_rgba(16, 185, 129, 0.4)]"
                                        >
                                            Approve
                                        </button>

                                        <button
                                            onClick = {() => handlePaymentAction(person.id, 'reject')}
                                            disabled = {processingId === person.id}
                                            className = "bg-transparent hover:bg-red-900/10 border border-zinc-700 hover:border-red-900/50 text-zinc-400 hover:text-red-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                )}

                                {person.payment_status === 'verified' && (
                                    <span className = "text-zinc-500 text-xs font-mono uppercase tracking-wider">
                                        Ticket Sent
                                    </span>
                                )}
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

    )

}
