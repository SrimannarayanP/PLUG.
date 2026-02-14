// RegistrationModal.jsx


import {useState, useEffect} from 'react'
import {X, Loader2, ScanLine, Check, ArrowLeft, Plus, Minus, User, Users, MapPin} from 'lucide-react'

import api from '../../api/api'

import FormInput from '../common/FormInput'
import SearchableSelect from '../common/SearchableSelect'

import PLATFORM_QR from '../../assets/platform_qr.jpg'
import { Form } from 'react-router-dom'


export default function RegistrationModal({event, closeModal}) {

    const [step, setStep] = useState(1) // 1 = Details, 2 = Payment
    // We now use a single 'formData' object
    const attendeeTemplate = {
        first_name : '',
        last_name : '',
        email : '',
        phone_number : '',
        school_college_id : '',
        school_college_name : '',
        school_college_city : '',
        school_college_state : '',
        student_id_number : '',
        date_of_birth : '',
    }
    const [attendees, setAttendees] = useState([attendeeTemplate])

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)
    // Holds the JSON object the backend returns.
    const [ticketData, setTicketData] = useState(null)
    const [transactionId, setTransactionId] = useState('')

    const MAX_TICKETS = event.max_tickets_per_user || 1
    const [ticketCount, setTicketCount] = useState(1)

    // Lock body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden'

        return () => {document.body.style.overflow = 'unset'}
    }, [])

    const updateTicketCount = (increment) => {
        const newCount = ticketCount + increment

        if (newCount < 1 || newCount > MAX_TICKETS) return

        setTicketCount(newCount)

        setAttendees(prev => {
            if (increment > 0) {

                // Add new guest template
                return [...prev, {...attendeeTemplate}]
            
            } else {
                
                // Remove last guest
                return prev.slice(0, -1)
            
            }
        })
    }

    // This is a handler that handles any changes in the form. Instead of manually writing a separate handle function for each field, we write 1 general handler function.
    const handleAttendeeChange = (index, field, value) => { // Receives the event object from the form input
        const updatedAttendees = [...attendees] // This extracts the 'name' attribute along with the value that was inputted by the user. # if 'name' = 'email', then e.target
                                        // would be 'email' : value. Essentially asks the input field, "Which field are you?".

        updatedAttendees[index] = {...updatedAttendees[index], [field] : value}

        setAttendees(updatedAttendees) // Instead of passing a new object directly, we use a callback here to call the prev state (in short for
                                                            // (previous state). If multiple updates are happening, then prev is much more efficient as it prevents data
                                                            // loss.
                                                            // ...prev because React state is immutable. Change agar hoga to pura input form hi change hoga. ...prev
                                                            // ensures that other fields are unchanged when 1 field is being changed.
                                                            // [name] : value is what makes this handler dynamic. It says look at the variable 'name' & see what it's 
                                                            // holding & update with that value.
        
        if (error?.[`attendee_${index}_${field}`]) {
            setError(prev => ({...prev, [`attendee_${index}_${field}`] : null}))
        }
    }

    const handleCollegeChange = (index, selection) => {
        const updatedAttendees = [...attendees]
        const attendee = updatedAttendees[index]

        if (selection.isNew) {
            attendee.school_college_id = '' // Clear ID
            attendee.school_college_name = selection.name
        } else {
            attendee.school_college_id = selection.id
            attendee.school_college_name = selection.name
            attendee.school_college_city = ''
            attendee.school_college_state = ''
        }

        setAttendees(updatedAttendees)
    }

    // The logic is if we are on step 1 & it is a paid event, then go to step 2
    const handleFormAction = async (e) => {
        e.preventDefault()

        // Transition to payment step
        if (step === 1 && event.is_paid_event) {
            setStep(2)

            return
        }

        // Validate transaction ID
        if (event.is_paid_event && !transactionId) {
            setError({transaction_id : "Transaction ID is required for payment verification"})

            return
        }

        // Start loading & clear all old errors
        setLoading(true)
        setError(null)

        const payload = {
            event_id : event.id,
            transaction_id : transactionId,
            attendees : attendees.map(att => ({
                first_name : att.first_name,
                last_name : att.last_name,
                email : att.email,
                phone_number : att.phone_number || '',
                school_college_id : att.school_college_id || null,
                school_college_name : att.school_college_name || '',
                school_college_city : att.school_college_city || '',
                school_college_state : att.school_college_state || '',
                student_id_number : att.student_id_number || '',
                date_of_birth : att.date_of_birth || null,
            }))
        }

        try {
            const response = await api.post('/api/events/register/', payload)

            if (response.data.payment_needed) {
                setTicketData({...response.data, is_pending : true})
            } else if (response.data.ticket) {
                setTicketData({
                    is_pending : false,
                    attendee_names : response.data.attendees || ['You']
                })
            }

            setSuccess(true)
            setLoading(false)
        } catch (err) {
            setLoading(false)

            console.log("FULL ERROR OBJECT:", err)
            console.log("BACKEND RESPONSE:", err.response?.data)

            const serverErrors = err.response?.data?.errors || err.response?.data || {}
            let safeErrorState = {}

            if (err.response?.data?.error && typeof err.response.data.error === 'string') {
                safeErrorState.general = err.response.data.error
            } else if (err.response?.data?.detail) {
                safeErrorState.general = err.response.data.detail
            } else {
                Object.keys(serverErrors).forEach(key => {
                    const value = serverErrors[key]

                    if (Array.isArray(value)) {
                        safeErrorState[key] = value[0]
                    } else if (typeof value === 'string') {
                        safeErrorState[key] = value
                    }
                })
            }

            if (Object.keys(safeErrorState).length === 0) {
                safeErrorState.general = "Registration failed. Please try again."
            }

            setError(safeErrorState)
        }
    }

    // If we are on step 2 (or it's a free event), submit to backend

    const inputStyle = "bg-zinc-900/50 border-zinc-700 text-white focus:border-orange-500 focus:ring-orange-500/20 placeholder:text-zinc-600 rounded-xl"

    return (

        // "fixed inset-0" stretches the container across the whole screen
        // 'z-50' places it on top of all the other content
        <div
            role = 'dialog'
            className = "fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
            {/* Backdrop */}
            <div 
                className = "absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick = {closeModal}
            />

            {/* Modal Container */}
            <div
                className = "relative max-h-[95vh] w-full sm:max-w-xl overflow-y-auto bg-zinc-950 border-t sm:border border-zinc-800 p-8 rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300"
                // onClick = {(e) => e.stopPropagation()} // Suppose I have an element that has nested elements in it. If I do some event (i.e., click) on the inner element,
                                                        // it'll trigger it's event listener & the parent event listener as well. stopPropagation prevents the parent
                                                        // event listener from being triggered. DOM tree me inner element ke parent element me event listener ko trigger
                                                        // nhi krega.
            >
                {/* Close button */}
                <button
                    onClick = {closeModal}
                    className = "absolute top-4 right-4 z-10 p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                >
                    <X className = "h-5 w-5" /> 
                </button>

                <div className = "p-1 sm:p-4">
                    {/* Success view */}
                    {success ? (
                        <div className = "flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
                            <div className = "flex h-20 w-20 mb-6 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600 shadow-lg shadow-green-500/20">
                                <Check className = "h-10 w-10 text-white stroke-[3]" />
                            </div>

                            <h2 className = "mb-2 text-3xl font-black uppercase tracking-tighter text-white">
                                {ticketData?.is_pending
                                    ? "You're Almost There!"
                                    : "You're In!"
                                }
                            </h2>

                            <p className = "mb-8 text-zinc-400 text-sm">
                                {ticketData?.is_pending
                                    ? "Hang tight, your payment will be verified by the host!"
                                    : "Check your email for tickets."
                                }
                            </p>

                            <button
                                onClick = {closeModal}
                                className = "w-full rounded-xl bg-white py-3.5 text-sm font-bold uppercase tracking-widest text-black shadow-lg hover:bg-zinc-200 transition-colors"
                            >
                                Done
                            </button>
                        </div> 
                    ) : (
                        // Form view
                        <form 
                            onSubmit = {handleFormAction}
                            className = "flex flex-col h-full"
                        >
                            <div className = 'mb-6'>
                                <h2 className = "mb-2 text-2xl sm:text-3xl font-black uppercase tracking-tighter text-white">
                                    {step === 1 ? "Join the Event" : "Complete Payment"}
                                </h2>

                                <div className = "flex items-center gap-2 text-sm font-medium text-orange-400">
                                    <span className = "flex h-5 w-5 items-center justify-center rounded-full bg-orange-400/10 text-xs">
                                        {step}
                                    </span>
                                    
                                    <span>
                                        {step === 1 
                                            ? event.name
                                            : `Step 2 of 2 • ₹${event.ticket_price * ticketCount}`
                                        }
                                    </span>
                                </div>
                            </div>

                            {/* Step 1 : Ticket Counter */}
                            {step === 1 && (
                                <div className = "mb-8 p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 flex items-center justify-between">
                                    <div>
                                        <p className = "text-white font-bold text-sm uppercase tracking-wide">
                                            Number of Tickets
                                        </p>

                                        <p className = "text-zinc-500 text-xs">
                                            Maximum of {MAX_TICKETS} per user
                                        </p>
                                    </div>

                                    <div className = "flex items-center gap-4 bg-black rounded-lg p-1 border border-zinc-800">
                                        <button
                                            type = 'button'
                                            onClick = {() => updateTicketCount(-1)}
                                        >
                                            <Minus className = "h-4 w-4" />
                                        </button>

                                        <span className = "text-white font-mono font-bold w-4 text-center">
                                            {ticketCount}
                                        </span>

                                        <button
                                            type = 'button'
                                            onClick = {() => updateTicketCount(1)}
                                            className = "p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md"
                                        >
                                            <Plus className = "h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Generic error message */}
                            {error?.general && (
                                <div className = "mb-6 rounded-xl border border-red-500/20 bg-red-950/30 p-4 text-sm text-red-400 flex gap-3">
                                    <div className = "h-1.5 w-1.5 mt-1.5 rounded-full bg-red-500 shrink-0" />

                                    {error.general}
                                </div>
                            )}

                            {step === 1 && (
                                <div className = 'space-y-6'>
                                    {attendees.map((att, index) => (
                                        <div
                                            key = {index}
                                            className = "animate-in slide-in-from-left-4 duration-300"
                                        >
                                            <div className = "flex items-center gap-2 mb-3">
                                                {index === 0
                                                    ? <User className = "h-4 w-4 text-orange-500" />
                                                    : <Users className = "h-4 w-4 text-zinc-500" />
                                                }

                                                <span className = "text-xs text-zinc-500 font-bold uppercase tracking-wider">
                                                    {index === 0 ? "Primary Attendee (You)" : `Guest #${index}`}
                                                </span>
                                            </div>

                                            <div className = "grid grid-cols-1 gap-3 p-4 rounded-2xl border border-zinc-800/50 bg-zinc-900/20">
                                                <div className = "grid grid-cols-2 gap-3">
                                                    <FormInput
                                                        placeholder = "First Name"
                                                        value = {att.first_name}
                                                        onChange = {(e) => handleAttendeeChange(index, 'first_name', e.target.value)}
                                                        className = {inputStyle}
                                                        required
                                                    />

                                                    <FormInput
                                                        placeholder = "Last Name"
                                                        value = {att.last_name}
                                                        onChange = {(e) => handleAttendeeChange(index, 'last_name', e.target.value)}
                                                        className = {inputStyle}
                                                        required
                                                    />
                                                </div>

                                                <FormInput 
                                                    type = 'email'
                                                    placeholder = 'Email'
                                                    value = {att.email}
                                                    onChange = {(e) => handleAttendeeChange(index, 'email', e.target.value)}
                                                    className = {inputStyle}
                                                    required
                                                />

                                                {/* Smart Fields (Renders on condition) */}
                                                {event.collect_phone && (
                                                    <FormInput
                                                        type = 'tel'
                                                        placeholder = "Phone Number"
                                                        value = {att.phone_number}
                                                        onChange = {(e) => handleAttendeeChange(index, 'phone_number', e.target.value)}
                                                        className = {inputStyle}
                                                        required
                                                    />
                                                )}

                                                {event.collect_student_id && (
                                                    <FormInput
                                                        placeholder = "Student ID / USN"
                                                        value = {att.student_id_number}
                                                        onChange = {(e) => handleAttendeeChange(index, 'student_id_number', e.target.value)}
                                                        className = {inputStyle}
                                                        required
                                                    />
                                                )}

                                                {event.collect_college_school && (
                                                    <div className = "space-y-3 p-3 bg-black/20 rounded-xl border border-zinc-800/50">
                                                        <SearchableSelect 
                                                            value = {{
                                                                id : att.school_college_id,
                                                                name : att.school_college_name // For display
                                                            }}
                                                            onChange = {(selection) => handleCollegeChange(index, selection)}
                                                            placeholder = "Search School/College..."
                                                            endpoint = '/api/data/colleges/'
                                                        />

                                                        {!att.school_college_id && att.school_college_name && (
                                                            <div className = "grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                                                                <FormInput 
                                                                    placeholder = "City (Required)"
                                                                    value = {att.school_college_city}
                                                                    onChange = {(e) => handleAttendeeChange(index, 'school_college_city', e.target.value)}
                                                                    className = {`${inputStyle} text-xs`}
                                                                    required
                                                                />

                                                                <FormInput 
                                                                    placeholder = "State (Required)"
                                                                    value = {att.school_college_state}
                                                                    onChange = {(e) => handleAttendeeChange(index, 'school_college_state', e.target.value)}
                                                                    className = {`${inputStyle} text-xs`}
                                                                    required
                                                                />
                                                            </div>
                                                        )}

                                                        {!att.school_college_id && att.school_college_name && (
                                                            <p className = "text-[10px] text-orange-400 flex items-center gap-1">
                                                                <MapPin className = "h-3 w-3" />

                                                                Adding new college. Please verify location.
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                {event.age_restriction_cutoff && (
                                                    <div>
                                                        <label className = "text-[10px] text-zinc-500 uppercase font-bold ml-1 mb-1 block">
                                                            Date of Birth
                                                        </label>

                                                        <FormInput 
                                                            type = 'date'
                                                            value = {att.date_of_birth}
                                                            onChange = {(e) => handleAttendeeChange(index, 'date_of_birth', e.target.value)}
                                                            className = {`${inputStyle} [color-scheme:dark]`}
                                                            required
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {step === 2 && event.is_paid_event && (
                                <div className = "space-y-6 animate-in slide-in-from-right-4 duration-300">
                                    <div className = "relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-center">
                                        <div className = "absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600" />  

                                        <div className = "mb-4 flex items-center justify-center gap-2 text-zinc-400 text-xs font-bold uppercase tracking-widest">
                                            <ScanLine className = "h-4 w-4 text-purple-500" />

                                            Scan to Pay
                                        </div>

                                        <div className = "mx-auto mb-4 w-fit rounded-xl bg-white p-2 shadow-lg">
                                            <img 
                                                src = {PLATFORM_QR}
                                                alt = "Payment QR"
                                                className = "h-40 w-40 object-contain"
                                            />
                                        </div>

                                        <div className = "inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-800 border border-zinc-700">
                                            <span className = "text-zinc-400 text-xs font-bold uppercase">
                                                Total:
                                            </span>

                                            <span className = "text-white font-mono font-bold text-lg">
                                                {event.ticket_price * ticketCount}
                                            </span>
                                        </div>
                                    </div>

                                    <div className = 'space-y-2'>
                                        <label className = "text-xs font-bold uppercase text-zinc-500 ml-1">
                                            Transaction ID
                                        </label>

                                        <FormInput
                                            placeholder = "Enter UPI Ref / UTR Number"
                                            value = {transactionId}
                                            onChange = {(e) => setTransactionId(e.target.value)}
                                            required
                                            className = {`${inputStyle} text-center tracking-widest font-mono uppercase border-2 border-dashed`}
                                        />

                                        <p className = "text-[10px] text-zinc-600 text-center">
                                            The 10-digit reference number from your payment app
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Footer Buttons */}
                            <div className = "flex gap-3 mt-8 pt-4 border-t border-zinc-900">
                                {/* Back button (Only on step 2) */}
                                {step === 2 && (
                                    <button
                                        type = 'button'
                                        onClick = {() => setStep(1)}
                                        className = "flex items-center gap-2 rounded-xl border border-zinc-700 hover:border-zinc-500 bg-transparent px-5 py-3 font-bold text-zinc-400 hover:text-white transition-colors"
                                    >
                                        <ArrowLeft className = "h-4 w-4" />
                                    </button>
                                )}

                                {/* Main action button */}
                                <button
                                    type = 'submit'
                                    disabled = {loading}
                                    className = "group relative flex-1 overflow-hidden rounded-xl bg-white py-3 text-base font-bold text-black shadow-lg transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <span className = "flex items-center justify-center gap-2">
                                            <Loader2 className = "h-4 w-4 animate-spin" />

                                            Processing...
                                        </span>
                                    ) : (
                                        <span className = "flex items-center justify-center gap-2 uppercase tracking-widest">
                                            {step === 1 && event.is_paid_event
                                                ? `Next: Pay ₹${event.ticket_price * ticketCount}`
                                                : "Complete Registration"
                                            }
                                        </span>
                                    )}
                                    
                                    <div className = "absolute inset-0 -z-10 bg-gradient-to-r from-orange-600 to-purple-600 opacity-0 transition-opacity group-hover:opacity-10" />
                                </button>
                            </div>

                        </form>
                    )}
                </div>
            </div>
        </div>
    
    )

}
