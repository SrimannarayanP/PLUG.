// RegistrationModal.jsx


import {useState} from 'react'

import apiPublic from '../../api/apiPublic'

import FormInput from '../common/FormInput'

import PLATFORM_QR from '../../assets/platform_qr.jpg'
import {X, Loader2, ScanLine} from 'lucide-react'


export default function RegistrationModal({event, closeModal}) {

    const [step, setStep] = useState(1) // 1 = Details, 2 = Payment
    // We now use a single 'formData' object
    const [formData, setFormData] = useState({
        email : '',
        first_name : '',
        last_name : '',
        phone_number : '',
        school_college_name : '',
        student_id_number : '',
        transaction_id : '',
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)
    // Holds the JSON object the backend returns.
    const [ticketData, setTicketData] = useState(null) 

    // This is a handler that handles any changes in the form. Instead of manually writing a separate handle function for each field, we write 1 general handler function.
    const handleInputChange = (e) => { // Receives the event object from the form input
        const {name, value} = e.target // This extracts the 'name' attribute along with the value that was inputted by the user. # if 'name' = 'email', then e.target
                                        // would be 'email' : value. Essentially asks the input field, "Which field are you?".

        setFormData(prev => ({...prev, [name] : value})) // Instead of passing a new object directly, we use a callback here to call the prev state (in short for
                                                            // (previous state). If multiple updates are happening, then prev is much more efficient as it prevents data
                                                            // loss.
                                                            // ...prev because React state is immutable. Change agar hoga to pura input form hi change hoga. ...prev
                                                            // ensures that other fields are unchanged when 1 field is being changed.
                                                            // [name] : value is what makes this handler dynamic. It says look at the variable 'name' & see what it's 
                                                            // holding & update with that value.
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
        if (event.is_paid_event && !formData.transaction_id) {
            setError({transaction_id : "Transaction ID is required for payment verification"})

            return
        }

        // Start loading & clear all old errors
        setLoading(true)
        setError(null)

        const payload = {
            event_id : event.id,
            ...formData, // Spreads/expands the formData. Takes all key-value pairs from formData.
        }

        try {
            const response = await apiPublic.post('/api/events/register/', payload)

            if (response.data.payment_needed) {
                setTicketData({
                    ...response.data.registration,
                    is_pending : true
                })
                setSuccess(true)
            } else if (response.data.ticket) {
                setTicketData(response.data.ticket)
                setSuccess(true)
            }

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

    const inputStyle = "bg-transparent border-zinc-700 text-white focus:border-orange-500 focus:ring-orange-500/20 placeholder:text-zinc-500"

    return (

        // "fixed inset-0" stretches the container across the whole screen
        // 'z-50' places it on top of all the other content
        <div
            className = "fixed inset-0 z-50 flex items-center justify-center bg-black/80 bg-opacity-80 backdrop-blur-md p-4 animate-in fade-in duration-200"
            onClick = {closeModal} // Click outside the modal to close it
        >
            <div
                className = "relative w-full max-w-md bg-zinc-950 border border-zinc-800 p-8 rounded-3xl shadow-2xl shadow-purple-900/20 transform transition-all animate-in zoom-in-95 duration-200"
                onClick = {(e) => e.stopPropagation()} // Suppose I have an element that has nested elements in it. If I do some event (i.e., click) on the inner element,
                                                        // it'll trigger it's event listener & the parent event listener as well. stopPropagation prevents the parent
                                                        // event listener from being triggered. DOM tree me inner element ke parent element me event listener ko trigger
                                                        // nhi krega.
            >

                {/* Close button */}
                <button
                    onClick = {closeModal}
                    className = "absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors bg-zinc-900/50 hover:bg-zinc-800 p-2 rounded-full"
                >
                    <X className = "w-5 h-5" /> 
                </button>

                {/* Success view */}
                {success && ticketData ? (
                    <div className = "text-center py-4 flex flex-col items-center">
                        <div className = "w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/20">
                            <Check className = "w-8 h-8 text-white stroke-[3]" />
                        </div>

                        <h2 className = "text-3xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 uppercase tracking-tighter">
                            {ticketData.is_pending 
                                ? "You're Almost There!" 
                                : "You're Going!"
                            }
                        </h2>

                        <p className = "text-zinc-400 mb-8 text-sm max-w-xs mx-auto">
                            {ticketData.is_pending
                                ? "Hang tight, your payment will be verified by the host!"
                                : <span>
                                    Ticket for <span className = "text-white font-bold">{ticketData.first_name} {ticketData.last_name}</span>
                                </span>
                            }
                        </p>

                        {/* QR Code - Only for verified attendees*/}
                        {!ticketData.is_pending && ticketData.qr_code && (
                            <div className = "bg-white p-3 rounded-2xl shadow-xl mx-auto mb-6 w-fit relative group">
                                <div className = "absolute inset-0 bg-gradient-to-r from-orange-500 to-purple-600 rounded-2xl -z-10 blur opacity-40 group-hover:opacity-60 transition-opacity" />

                                <img 
                                    src = {ticketData.qr_code}
                                    alt = "Your Event Ticket"
                                    className = "w-48 h-48 object-contain"
                                />
                            </div>
                        )}

                        {/* Pending state */}
                        {ticketData.is_pending && (
                            <div className = "bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-3">
                                <Loader2 className = "w-4 h-4 animate-spin" />
                                
                                <div className = 'text-left'>
                                    <strong className = "block text-xs uppercase tracking-wider mb-0.5">
                                        Verification Pending
                                    </strong>

                                    <p className = "text-xs opacity-80">
                                        You will receive your ticket via email once the transaction is verified.
                                    </p>
                                </div>
                            </div>
                        )}

                        <p className = "text-xs text-zinc-600 mb-6 font-mono">
                            Sent to: {formData.email}
                        </p>

                        <button
                            onClick = {closeModal}
                            className = "w-full px-6 py-4 rounded-xl text-black font-bold shadow-lg bg-white hover:bg-zinc-200 transition-colors uppercase tracking-widest text-sm"
                        >
                            Done
                        </button>
                    </div> 
                ) : (
                    // Form view
                    <form onSubmit = {handleFormAction}>
                        <div className = 'mb-8'>
                            <h2 className = "text-3xl font-black text-white uppercase tracking-tighter mb-2">
                                {step === 1 ? "Join the Event" : "Complete Payment"}
                            </h2>

                            <p 
                                className = "text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-purple-400"
                                style = {{color : '#6f2d37'}}
                            >
                                {step === 1 ? event.event_name : `Step 2 of 2 • ₹${event.ticket_price}`}
                            </p>
                        </div>

                        {/* Generic error message */}
                        {error && error.general && (
                            <div className = "mb-6 p-4 bg-red-950/30 border-border-red-500/20 text-red-400 rounded-xl text-sm flex items-start gap-3">
                                <div className = "w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />

                                {error.general}
                            </div>
                        )}

                        {step === 1 && (  
                            <div className = "space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-300">
                                <div className = "grid grid-cols-2 gap-4">
                                    <FormInput
                                        id = 'first_name'
                                        name = 'first_name'
                                        placeholder = "First Name"
                                        value = {formData.first_name}
                                        onChange = {handleInputChange}
                                        className = {inputStyle}
                                    />

                                    <FormInput 
                                        id = 'last_name'
                                        name = 'last_name'
                                        placeholder = "Last Name"
                                        value = {formData.last_name}
                                        onChange = {handleInputChange}
                                        className = {inputStyle}
                                    />
                                </div>

                                <FormInput 
                                    id = 'email'
                                    name = 'email'
                                    type = 'email'
                                    placeholder = "Email ID"
                                    value = {formData.email}
                                    onChange = {handleInputChange}
                                    className = {inputStyle}
                                />

                                {/* Smart Fields (Renders on condition) */}
                                {event.collect_phone && (
                                    <div>
                                        <FormInput 
                                            id = 'phone_number'
                                            name = 'phone_number'
                                            type = 'tel'
                                            placeholder = "Phone Number"
                                            value = {formData.phone_number}
                                            onChange = {handleInputChange}
                                            className = {inputStyle}
                                        />

                                        {error?.phone_number && <p className = "text-red-500 text-xs mt-1 ml-1">{error.phone_number}</p>}
                                    </div>
                                )}

                                {event.collect_college_school && (
                                    <div>
                                        <FormInput 
                                            id = 'school_college_name'
                                            name = 'school_college_name'
                                            placeholder = "School/College"
                                            value = {formData.school_college_name}
                                            onChange = {handleInputChange}
                                            className = {inputStyle}
                                        />

                                        {error?.school_college_name && <p className = "text-red-500 text-xs mt-1 ml-1">{error.school_college_name}</p>}
                                    </div>
                                )}

                                {event.collect_student_id && (
                                    <div>
                                        <FormInput 
                                            id = 'student_id_number'
                                            name = 'student_id_number'
                                            placeholder = "Student ID"
                                            value = {formData.student_id_number}
                                            onChange = {handleInputChange}
                                            className = {inputStyle}
                                        />
                                        {error?.student_id_number && <p className = "text-red-500 text-xs mt-1 ml-1">{error.student_id_number}</p>}
                                    </div>
                                )}
                            </div>
                        )}

                        {step === 2 && event.is_paid_event && (
                            <div className = "animate-in slide-in-from-right-8 fade-in duration-300">
                                <div className = "mb-6 bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6 flex flex-col items-center justify-center relative overflow-hidden">
                                    <div className = "absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600" />  

                                    <div className = "text-zinc-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <ScanLine className = "w-4 h-4 text-purple-500" />

                                        Scan to Pay
                                    </div>

                                    <div className = "bg-white p-2 rounded-xl shadow-lg mb-4">
                                        <img 
                                            src = {PLATFORM_QR}
                                            alt = "Payment QR"
                                            className = "w-40 h-40 object-contain"
                                        />
                                    </div>

                                    <div className = "inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-800 border border-zinc-700">
                                        <span className = "text-zinc-400 text-xs font-bold uppercase">
                                            Total:
                                        </span>

                                        <span className = "text-white font-mono font-bold">
                                            {event.ticket_price}
                                        </span>
                                    </div>
                                </div>

                                <div className = 'space-y-2 '>
                                    <FormInput
                                        id = 'transaction_id'
                                        name = 'transaction_id'
                                        placeholder = "Enter UPI Transaction ID"
                                        value = {formData.transaction_id}
                                        onChange = {handleInputChange}
                                        required = {true}
                                        className = {`${inputStyle} text-center tracking-widest font-mono uppercase`}
                                    />

                                    <p className = "text-[10px] text-zinc-500 text-center">
                                        The 10-digit reference number from your payment app
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Buttons */}
                        <div className = "flex gap-3 mt-8">
                            {/* Back button (Only on step 2) */}
                            {step === 2 && (
                                <button
                                    type = 'button'
                                    onClick = {() => setStep(1)}
                                    className = "px-6 py-3 rounded-xl font-bold text-zinc-400 bg-transparent border border-zinc-700 hover:text-white hover:border-zinc-500 transition-colors"
                                >
                                    Back
                                </button>
                            )}

                            {/* Main action button */}
                            <button
                                type = 'submit'
                                disabled = {loading}
                                className = "group relative flex-1 px-6 py-3 rounded-xl text-white font-bold text-base shadow-lg shadow-purple-900/20 hover:shadow-orange-900/30 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                            >
                                <div className = "absolute inset-0 bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 group-hover:scale-105 transition-transform duration-500" />

                                <span className = "relative flex items-center justify-center gap-2">                                        
                                    {loading ? (
                                        <>
                                            <Loader2 className = "w-4 h-4 animate-spin" />

                                            Processing...
                                        </>
                                    ) : (
                                        step === 1 && event.is_paid_event
                                            ? "Next: Payment Details"
                                            : (event.is_paid_event
                                                ? "Verfiy Payment"
                                                : "Confirm Registration"
                                            )
                                    )}
                                </span>
                            </button>
                        </div>

                    </form>
                )}
            </div>
        </div>
    
    )

}
