// RegistrationModal.jsx


import React, {useState} from 'react'

import apiPublic from '../../api/apiPublic'

import FormInput from '../common/FormInput'


export default function RegistrationModal({event, closeModal}) {

    // We now use a single 'formData' object
    const [formData, setFormData] = useState({
        email : '',
        first_name : '',
        last_name : '',
        phone_number : '',
        school_college_name : '',
        student_id_number : '',
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

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Setting loading state & clearing old errors
        setLoading(true)
        setError(null)

        const payload = {
            event_id : event.id,
            ...formData, // Spreads/expands the formData. Takes all key-value pairs from formData.
        }

        try {
            const response = await apiPublic.post('/api/events/register/', payload)

            setTicketData(response.data.ticket) // We grab the object immediately after the API call succeeds.
            setLoading(false)
            setSuccess(true)
        } catch (err) {
            setLoading(false)

            console.log("FULL ERROR OBJECT:", err)
            console.log("BACKEND RESPONSE:", err.response?.data)

            const serverErrors = err.response?.data?.errors || err.response?.data || {}
            let safeErrorState = {}

            // if (err.response && err.response.data.errors) {
            //     // Handles field specific error
            //     setError(err.response.data.errors)
            // } else if (err.response && err.response.data.error) {
            //     // Handles generic errors
            //     setError({general : err.response.data.error})
            // } else {
            //     setError({general : "Registration failed. Please try again."})
            // }

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

    return (

        // "fixed inset-0" stretches the container across the whole screen
        // 'z-50' places it on top of all the other content
        <div
            className = "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm"
            onClick = {closeModal} // Click outside the modal to close it
        >
            <div
                className = "relative w-full max-w-md p-8 rounded-2xl shadow-2xl transform transition-all"
                onClick = {(e) => e.stopPropagation()} // Suppose I have an element that has nested elements in it. If I do some event (i.e., click) on the inner element,
                                                        // it'll trigger it's event listener & the parent event listener as well. stopPropagation prevents the parent
                                                        // event listener from being triggered. DOM tree me inner element ke parent element me event listener ko trigger
                                                        // nhi krega.
                style = {{backgroundColor : '#eae5dc'}}
            >

                {/* Close button */}
                <button
                    onClick = {closeModal}
                    className = "absolute top-4 right-4 text-[#6f2d37] hover:text-[#c90000] font-bold text-xl"
                >
                    &times; {/* &times displays the actual multiplication sign. It's like an icon for the close button. */} 
                </button>

                {/* Success view */}
                {success && ticketData ? (
                    <div className = "text-center py-4">
                        <h2 
                            className = "text-2xl font-black mb-2"
                            style = {{color : '#6f2d37'}}
                        >
                            You're Going!
                        </h2>

                        <p className = "text-[#6f2d37]/80 mb-6 text-sm">
                            Ticket for <span className = "font-bold">{ticketData.attendee_name}</span>
                        </p>

                        {/* QR Code */}
                        <div className = "bg-white p-4 rounded-xl shadow-inner mx-auto mb-6 w-fit">
                            {/* Backend sent the image as a string, the browser knows how to render that now */}
                            <img 
                                src = {ticketData.qr_code}
                                alt = "Your Event Ticket"
                                className = "w-48 h-48 object-contain"
                            />
                        </div>

                        <p className = "text-[#265742] font-bold text-sm mb-6 bg-[#265742]/10 py-2 px-4 rounded-lg inline-block">
                            Show this code at entry
                        </p>

                        <p className = "text-xs text-[#6f2d37]/60 mb-6">
                            Ticket has also been sent to {formData.email}
                        </p>

                        <button
                            onClick = {closeModal}
                            className = "w-full px-4 py-3 rounded-lg text-white font-bold shadow-lg hover:brightness-110"
                            style = {{backgroundColor : '#c90000'}}
                        >
                            Done
                        </button>
                    </div> 
                ) : (
                    // Form view
                    <form onSubmit = {handleSubmit}>
                        <h2 
                            className = "text-3xl font-black mb-1"
                            style = {{color : '#6f2d37'}}
                        >
                            Join the Event
                        </h2>

                        <p 
                            className = "text-sm mb-8 opacity-80"
                            style = {{color : '#6f2d37'}}
                        >
                            {event.event_name}
                        </p>

                        {/* Generic error message */}
                        {error && error.general && (
                            <div className = "mb-6 pg-3 bg-red-100 border-border-red-400 text-red-700 rounded text-sm">
                                {error.general}
                            </div>
                        )}

                        <div className = "grid grid-cols-2 gap-4">
                            <FormInput
                                id = 'first_name'
                                name = 'first_name'
                                placeholder = "First Name"
                                value = {formData.first_name}
                                onChange = {handleInputChange}
                            />

                            <FormInput 
                                id = 'last_name'
                                name = 'last_name'
                                placeholder = "Last Name"
                                value = {formData.last_name}
                                onChange = {handleInputChange}
                            />
                        </div>

                        <FormInput 
                            id = 'email'
                            name = 'email'
                            type = 'email'
                            placeholder = "Email ID"
                            value = {formData.email}
                            onChange = {handleInputChange}
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
                                />
                                {error && error?.phone_number && <p className = "text-[#c90000] text-xs -mt-4 mb-4">{error.phone_number}</p>}
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
                                />
                                {error && error?.school_college_name && <p className = "text-[#c90000] text-xs -mt-4 mb-4">{error.school_college_name}</p>}
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
                                />
                                {error && error?.student_id_number && <p className = "text-[#c90000] text-xs -mt-4 mb-4">{error.student_id_number}</p>}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type = 'submit'
                            disabled = {loading}
                            className = "w-full mt-4 px-4 py-3 rounded-lg text-white font-bold text-lg shadow-lg transition-all duration-200 hover:brightness-110 disabled:opacity-70 disabled:cursor-not-allowed"
                            style = {{backgroundColor : '#c90000'}}
                        >
                            {loading ? 'Registering...' : "Confirm Registration"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}
