// CreateEvent.jsx


import React, {useState} from 'react'
import {useNavigate} from 'react-router-dom'
import api from '../api/api'
import FormInput from '../components/common/FormInput'
import RichTextEditor from '../components/ui/RichTextEditor'


export default function CreateEvent() {
  
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [formData, setFormData] = useState({
        event_name : '',
        description : '',
        start_date : '',
        end_date : '',
        location : '', // Maps to physical_location in DB
        location_type : 'offline',
        // Toggles
        is_native : true,
        collect_phone : false,
        collect_college_school : false,
        collect_student_id : false,
    })
    const [posterFile, setPosterFile] = useState(null)
    const [previewUrl, setPreviewUrl] = useState(null)

    const handleChange = (e) => {
        const {name, value, type, checked} = e.target

        setFormData(prev => ({
            ...prev,
            [name] : type === 'checkbox' ? checked : value
        }))
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0]

        if (file) {
            setPosterFile(file)

            setPreviewUrl(URL.createObjectURL(file))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        setLoading(true)
        setError(null)

        const data = new FormData()

        data.append('event_name', formData.event_name)
        data.append('description', formData.description)
        data.append('start_date', formData.start_date)
        data.append('end_date', formData.end_date)
        data.append('location_type', formData.location_type)
        data.append('location', formData.location)
        data.append('is_native', formData.is_native)
        // Append toggles
        data.append('collect_phone', formData.collect_phone)
        data.append('collect_college_school', formData.collect_college_school)
        data.append('collect_student_id', formData.collect_student_id)

        // Append poster
        if (posterFile) {
            data.append('poster_image', posterFile)
        }

        try {
            await api.post('/api/events/create-event/', data)
            
            navigate('/host/dashboard')
        } catch (err) {
            console.error(err)

            setError("Failed to create event. Check the details & try again.")
        }
    }

    const handleDescriptionChange = (htmlContent) => {
        setFormData(prev => ({
            ...prev,
            description : htmlContent,
        }))
    }

    return (

        <div className = "min-h-screen bg-[#eae5dc] p-6 flex justify-center">
            <div className = "max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
                <h1 className = "text-3xl font-black text-[#6f2d37] mb-6">
                    Create New Event
                </h1>

                {error && <div className = "bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

                <form
                    onSubmit = {handleSubmit}
                    className = "space-y-6"
                >
                    {/* Image upload */}
                    <div className = "mb-6">
                        <label className = "block text-sm font-bold text-[#6f2d37] mb-2">
                            Event Poster
                        </label>

                        <div className = "flex items-center justify-center w-full">
                            <label className = "flex flex-col items-center justify-center w-full h-48 border-2 border-[#6f2d37]/20 border-dashed rounded-lg cursor-pointer bg-[#eae5dc]/30 hover:bg-[#eae5dc]/50 transition-colors overflow-hidden relative">
                                {previewUrl ? (
                                    <img src = {previewUrl} alt = 'Preview' className = "w-full h-full object-cover absolute"/>
                                ) : (
                                    <div className = "flex flex-col items-center justify-center pt-5 pb-6">
                                        <p className = "mb-2 text-sm text-[#6f2d37]">
                                            <span className = 'font-semibold'>
                                                Click to upload
                                            </span>
                                        </p>

                                        <p className = "text-xs text-[#6f2d37]/60">PNG, JPG (MAX. 5MB)</p>
                                    </div>
                                )}

                                <input type = 'file' className = 'hidden' onChange = {handleFileChange} accept = 'image/*' />
                            </label>
                        </div>
                    </div>

                    {/* Basic details */}
                    <FormInput 
                        id = 'event_name'
                        name = 'event_name'
                        placeholder = "Event Name"
                        value = {formData.event_name}
                        onChange = {handleChange}
                    />

                    <div className = "grid grid-cols-2 gap-4">
                        <div className = "flex flex-col">
                            <label className = "text-xs font-bold text-[#6f2d37] mb-1 ml-1">
                                Start Date
                            </label>

                            <input 
                                type = 'datetime-local'
                                name = 'start_date'
                                value = {formData.start_date}
                                onChange = {handleChange}
                                className = "px-4 py-3 bg-[#6f2d37] text-[#eae5dc] rounded-lg border-none"
                            />
                        </div>

                        <div className = "flex flex-col">
                            <label className = "text-xs font-bold text-[#6f2d37] mb-1 ml-1"l>
                                End Date
                            </label>

                            <input 
                                type = 'datetime-local'
                                name = 'end_date'
                                value = {formData.end_date}
                                onChange = {handleChange}
                                className = "px-4 py-3 bg-[#6f2d37] text-[#eae5dc] rounded-lg border-none"
                            />
                        </div>
                    </div>

                    <FormInput 
                        id = 'location'
                        name = 'location'
                        placeholder = "Location (e.g. Hall 2)"
                        value = {formData.location}
                        onChange = {handleChange}
                    />

                    <div className = 'mb-6'>
                        <label className = "block text-sm font-bold text-[#6f2d37] mb-2">
                            Description
                        </label>

                        <RichTextEditor 
                            value = {formData.description}
                            onChange = {handleDescriptionChange}
                        />
                    </div>

                    {/* Smart Field Toggles */}
                    <div className = "bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <h3 className = "text-[#6f2d37] font-bold mb-3">
                            Registration Requirements
                        </h3>

                        <p className = "text-xs text-gray-500 mb-4">
                            What extra info do you need from students?
                        </p>

                        <div className = 'space-y-3'>
                            <label className = "flex items-center space-x-3 cursor-pointer">
                                <input 
                                    type = 'checkbox'
                                    name = 'collect_phone'
                                    checked = {formData.collect_phone}
                                    onChange = {handleChange}
                                    className = "w-5 h-5 text-[#c90000] rounded focus:ring-[#c90000]"
                                />

                                <span className = "text-gray-700">Phone Number</span>
                            </label>

                            <label className = "flex items-center space-x-3 cursor-pointer">
                                <input 
                                    type = 'checkbox'
                                    name = 'collect_college_school'
                                    checked = {formData.collect_college_school}
                                    onChange = {handleChange}
                                    className = "w-5 h-5 text-[#c90000] rounded focus:ring-[#c90000]"
                                />

                                <span className = "text-gray-700">College Name</span>
                            </label>

                            <label className = "flex items-center space-x-3 cursor-pointer">
                                <input 
                                    type = 'checkbox'
                                    name = 'collect_student_id'
                                    checked = {formData.collect_student_id}
                                    onChange = {handleChange}
                                    className = "w-5 h-5 text-[#c90000] rounded focus:ring-[#c90000]"
                                />

                                <span className = "text-gray-700">Student ID</span>
                            </label>
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type = 'submit'
                        disabled = {loading}
                        className = "w-full py-4 bg-[#c90000] text-white font-bold rounded-xl shadow-lg hover:brightness-110 disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : "Launch event"}
                    </button>
                </form>
            </div>
        </div>

    )

}
