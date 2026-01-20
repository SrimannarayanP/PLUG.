// CreateEvent.jsx


import {useState, useEffect} from 'react'
import {useNavigate, useLocation} from 'react-router-dom'
import {Upload, FileText, ArrowLeft, Layers, DollarSign, Check, Calendar, MapPin, Clock, Tag} from 'lucide-react'
import {toast} from 'react-hot-toast'

import api from '../api/api'

import {getImageUrl} from '../utils/imageHelper'

import FormInput from '../components/common/FormInput'
import RichTextEditor from '../components/ui/RichTextEditor'
import SolidAnimatedButton from '../components/ui/SolidAnimatedButton'


export default function CreateEvent() {
    
    const navigate = useNavigate()
    const location = useLocation()

    const eventToEdit = location.state?.eventToEdit
    const isEditMode = !!eventToEdit

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    // Categories state
    const [availableCategories, setAvailableCategories] = useState([])
    const [selectedCategories, setSelectedCategories] = useState([])

    // Helper to format Django ISO dates to HTML Input format
    const formatDateForInput = (isoString) => {
        if (!isoString) return ''

        const date = new Date(isoString)
        const localIso = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16)

        return localIso
    }

    const [formData, setFormData] = useState({
        event_name : '',
        description : '',
        start_date : '',
        end_date : '',
        registration_deadline : '',
        location : '', // Maps to physical_location in DB
        location_type : 'offline',
        google_maps_link : '',

        // Toggles
        is_native : true,
        collect_phone : false,
        collect_college_school : false,
        collect_student_id : false,

        // Payment state
        is_paid_event : false,
        ticket_price : '',
    })

    const [posterFile, setPosterFile] = useState(null)
    const [posterPreview, setPosterPreview] = useState(null)
    const [brochureFile, setBrochureFile] = useState(null)

    // Fetch categories when mounted
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get('api/categories/')
                const categoriesData = res.data.results || res.data // Check if the data is paginated (inside .results) or a simple list

                // Ensure it's an array before setting state
                if (Array.isArray(categoriesData)) {
                    setAvailableCategories(categoriesData)
                } else {
                    setAvailableCategories([])

                    console.error("API did not return an array: ", categoriesData)
                }
            } catch (err) {
                console.error("Failed to load categories", err)

                setAvailableCategories([]) // Fallback to prevent crash
            }
        }

        fetchCategories()
    }, [])

    // Load form with existing data if edit mode
    useEffect(() => {
        if (isEditMode && eventToEdit) {
            setFormData({
                event_name : eventToEdit.event_name || '',
                description : eventToEdit.description || '',

                start_date : formatDateForInput(eventToEdit.start_date),
                end_date : formatDateForInput(eventToEdit.end_date),
                registration_deadline : formatDateForInput(eventToEdit.registration_deadline),

                location : eventToEdit.physical_location || '',
                location_type : eventToEdit.location_type || 'offline',
                google_maps_link : eventToEdit.google_maps_link || '',

                is_native : eventToEdit.is_native,

                collect_phone : eventToEdit.collect_phone,
                collect_college_school : eventToEdit.collect_college_school,
                collect_student_id : eventToEdit.collect_student_id,

                is_paid_event : eventToEdit.is_paid_event,
                ticket_price : eventToEdit.ticket_price || '',
            })

            // Pre-fill categories - What this means is that the API calls gives full objs to display but selectedCategories only accepts list of IDs. So we use map
            // to map over the full objs & extract only the IDs.
            if (eventToEdit.categories) {
                setSelectedCategories(eventToEdit.categories.map(c => c.id))
            }

            // Existing poster preview
            if (eventToEdit.poster_field) {
                setPosterPreview(getImageUrl(eventToEdit.poster_field))
            }
        }
    }, [isEditMode, eventToEdit])

    const handleChange = (e) => {
        const {name, value, type, checked} = e.target

        setFormData(prev => ({
            ...prev,
            [name] : type === 'checkbox' ? checked : value
        }))
    }

    const handleCategoryToggle = (catId) => {
        setSelectedCategories(prev => {
            if (prev.includes(catId)) {
                
                return prev.filter(id => id !== catId) // Remove if already exists in categories

            } else {
                
                return [...prev, catId] // Add if doesn't exist in existing list of categories

            }
        })
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        const name = e.target.name

        if (!file) return

        if (name === 'poster_field') {
            const allowedExtensions = /(\.jpg|\.jpeg|\.png|\.webp)$/i

            if (!allowedExtensions.exec(file.name)) {
                alert("Invalid file type. Please upload a JPG, PNG or WEBP image.")

                e.target.value = ''

                return
            }

            if (file.size > 2 * 1024 * 1024) {
                alert("Poster is too heavy! Max. size is 2MB")

                e.target.value = ''

                return
            }
                
            setPosterFile(file)
            setPosterPreview(URL.createObjectURL(file))
        }

        else if (name === 'brochure') {
            const allowedExtensions = /(\.pdf|\.doc|\.docx)$/i

            if (!allowedExtensions.exec(file.name)) {
                alert("Invalid file type. Only PDF & DOC files are allowed.")

                e.target.value = ''

                return
            }

            if (file.size > 5 * 1024 * 1024) {
                alert("Brochure is too big! Max. size is 5MB")

                e.target.value = ''

                return
            }

            setBrochureFile(file)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        setLoading(true)
        setError(null)

        const data = new FormData()

        Object.keys(formData).forEach(key => {
            // Handle optional deadline. If it is empty, it'll send a null value
            if (key === 'registration_deadline' && !formData[key]) return
            
            data.append(key, formData[key])
        })

        data.append('physical_location', formData.location)

        data.append('event_name', formData.event_name)
        data.append('description', formData.description)

        data.append('start_date', formData.start_date)
        data.append('end_date', formData.end_date)

        data.append('location_type', formData.location_type)
        data.append('location', formData.location)
        data.append('google_maps_link', formData.google_maps_link)

        data.append('is_native', formData.is_native)
        // Append toggles
        data.append('collect_phone', formData.collect_phone)
        data.append('collect_college_school', formData.collect_college_school)
        data.append('collect_student_id', formData.collect_student_id)

        // Append categories
        selectedCategories.forEach(id => {
            data.append('category_ids', id) // Sending list of IDs
        })

        // Append poster
        if (posterFile) {
            data.append('poster_field', posterFile)
        }

        if (brochureFile) {
            data.append('brochure', brochureFile)
        }

        try {
            if (isEditMode) {
                await api.patch(`/api/events/${eventToEdit.id}/`, data)

                toast.success("Event Updated Successfully!")
            } else {
                await api.post('/api/events/create-event/', data)
                
                toast.success("Event Created Successfully!")
            }

            navigate('/host/dashboard')
        } catch (err) {
            console.error(err)

            if (err.response && err.response.data) {
                const firstErrorKey = Object.values(err.response.data)[0]
                const firstErrorMsg = err.response.data[firstErrorKey]

                if (Array.isArray(firstErrorMsg)) {
                    setError(`${firstErrorKey} : ${firstErrorMsg[0]}`)
                } else if (typeof firstErrorMsg === 'string') {
                    setError(firstErrorMsg)
                } else {
                    setError("Failed to create event. Check details.")
                }
            } else {
                setError("Failed to create event. Check details.")
            }
        } finally {
            setLoading(false)
        }
    }

    const handleDescriptionChange = (htmlContent) => {
        setFormData(prev => ({
            ...prev,
            description : htmlContent,
        }))
    }

    const festiveGradient = "bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600"
    const existingBrochureName = isEditMode && eventToEdit?.brochure
        ? decodeURIComponent(eventToEdit.brochure.split('/').pop().split('?')[0])
        : null

    return (

        <div className = "min-h-screen bg-[#09090b] text-white selection:bg-orange-500 selection:text-white pb-32 font-sans relative overflow-x-hidden">
            {/* Background Texture */}
            <div
                className = "fixed inset-0 opacity-[0.03] pointer-events-none z-0"
                style = {{
                    backgroundImage : "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
                    backgroundSize : "40px 40px"
                }}
            ></div>

            <div className = "max-w-4xl mx-auto px-6 relative z-10 pt-12">
                {/* Header/Nav placeholder */}
                <div className = "flex items-center justify-between mb-12">
                    <button
                        onClick = {() => navigate('/host/dashboard')}
                        className = "group flex items-center text-zinc-500 hover:text-white transition-colors uppercase tracking-widest text-xs font-bold"
                    >
                        <ArrowLeft className = "w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />

                        Cancel
                    </button>

                    {/* Logo */}
                    <div className = "flex items-center gap-3 select-none">
                        <div className = "w-8 h-8 relative">
                            <div className = "absolute inset-0 bg-[#09090b] border border-zinc-700 rounded-lg transform -skew-x-12 overflow-hidden shadow-lg">
                                <div className = {`absolute inset-0 opacity-90 ${festiveGradient}`}></div>

                                <div 
                                    className = "absolute inset-0 bg-[#09090b]"
                                    style = {{clipPath : "polygon(35% 20%, 85% 20%, 85% 55%, 35% 55%, 35% 80%, 15% 80%, 15% 20%)"}}    
                                ></div>
                            </div>
                        </div>

                        <h1 className = "text-2xl font-black text-white uppercase tracking-tighter leading-none">
                            PLUG<span className = {`text-transparent bg-clip-text ${festiveGradient}`}>.</span>
                        </h1>
                    </div>
                </div>

                <div className = 'mb-10'>
                    <h1 className = "text-4xl md:text-6xl font-black mb-2 text-white uppercase tracking-tighter">
                        {isEditMode ? 'Edit' : 'Create'} <span className = "text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-600">Event</span>
                    </h1>

                    <p className = "text-zinc-500 font-medium text-sm uppercase tracking-wide flex items-center gap-2">
                        <Layers className = "w-4 h-4" />

                        {isEditMode ? "Update your event details" : "Launch your experience to the network"}
                    </p>
                </div>

                {error && (
                    <div className = "bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-8 flex items-center gap-3 animate-in slide-in-from-top-2">
                        <div className = "w-2 h-2 rounded-full bg-red-500 animate-pulse" />

                        <span className = "text-sm font-bold">
                            {error}
                        </span> 
                    </div>
                )}

                <form
                    onSubmit = {handleSubmit}
                    className = 'space-y-12'
                >
                    {/* Visuals */}
                    <div className = 'space-y-6'>
                        <h3 className = "text-xl font-bold text-white flex items-center gap-2">
                            <span className = "w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-orange-500 text-sm">
                                01
                            </span>

                            Visuals
                        </h3>

                        {/* Poster Upload */}
                        <div className = "group relative">
                            <label className = "block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 ml-1">
                                Event Poster
                            </label>

                            <label
                                className = {`
                                    flex flex-col items-center justify-center w-full h-80 rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden relative border-2 border-dashed
                                    ${posterPreview
                                        ? "border-orange-500/50 bg-zinc-900"
                                        : "border-zinc-800 bg-[#18181b] hover:bg-zinc-900 hover:border-zinc-600"
                                    }
                                `}
                            >
                                {posterPreview ? (
                                    <>
                                        <img 
                                            src = {posterPreview}
                                            alt = 'Preview'
                                            className = "w-full h-full object-cover"
                                        />

                                        <div className = "absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                            <Upload className = "w-10 h-10 text-orange-500 mb-3" />

                                            <span className = "font-bold text-white uppercase tracking-widest text-sm">
                                                Change Poster
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <div className = "flex flex-col items-center text-zinc-600 group-hover:text-orange-500 transition-colors">
                                        <div className = "p-4 rounded-full bg-zinc-900 border border-zinc-800 mb-4 group-hover:border-orange-500/30 group-hover:bg-orange-500/10 transition-colors">
                                            <Upload className = "w-8 h-8" />
                                        </div>
                                        
                                        <p className = "font-bold uppercase tracking-widest text-xs">
                                            Upload Image
                                        </p>

                                        <p className = "text-[10px] text-zinc-700 mt-2 font-mono">
                                            JPG, PNG, WEBP (Max. 2MB)
                                        </p>
                                    </div>
                                )}

                                <input 
                                    type = 'file'
                                    name = 'poster_field'
                                    className = 'hidden'
                                    onChange = {handleFileChange}
                                    accept = 'image/*'
                                />
                            </label>
                        </div>

                        {/* Brochure Upload */}
                        <div className = "bg-[#18181b] border border-zinc-800 rounded-xl p-4 flex items-center gap-4 transition-colors hover:border-zinc-700 group">
                            <div className = "bg-zinc-900 p-3 rounded-lg text-pink-500 group-hover:text-pink-400 border border-zinc-800 group-hover:border-pink-500/30 transition-colors">
                                <FileText className = "w-6 h-6" />
                            </div>

                            <div className = "flex-1 overflow-hidden">
                                <label className = "block text-sm font-bold text-white mb-1 cursor-pointer hover:text-pink-500 transition-colors">
                                    {isEditMode && !brochureFile ? "Update Brochure (Optional)" : "Upload Rulebook/Brochure"}

                                    <input 
                                        type = 'file'
                                        name = 'brochure'
                                        className = 'hidden'
                                        onChange = {handleFileChange}
                                        accept = ".pdf, .doc, .docx"
                                    />
                                </label>

                                <p className = "text-xs text-zinc-500 truncate font-mono"> {/* truncate cuts off excess text & replaces it with ... */}
                                    {/* New file gets selected */}
                                    {brochureFile ? (
                                        <span className = 'text-orange-500'>{brochureFile.name}</span>
                                    // Show existing file Name
                                    ) : existingBrochureName ? (
                                        <span className = 'text-zinc-300'>
                                            Current: <span className = 'text-orange-500/80'>{existingBrochureName}</span>
                                        </span>
                                    // No file attached
                                    ) : (
                                        "PDF or DOC (Max. 5MB)"
                                    )}
                                </p>
                            </div>

                            {(brochureFile || (isEditMode && eventToEdit?.brochure)) && <Check className = "w-5 h-5 text-orange-500" />}
                        </div>
                    </div>

                    <div className = "h-px bg-zinc-800 w-full" /> {/* h-px means height of 1px */}

                    {/* Details Section */}
                    <div className = 'space-y-6'>
                        <h3 className = "text-xl font-bold text-white flex items-center gap-2">
                            <span className = "w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-pink-500 text-sm">
                                02
                            </span>

                            Details
                        </h3>

                        <FormInput 
                            label = "Event Name"
                            name = 'event_name'
                            placeholder = "Event Name"
                            value = {formData.event_name}
                            onChange = {handleChange}
                        />

                        <div>
                            <label className = "block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 ml-1">
                                Categories
                            </label>

                            <div className = "flex flex-wrap gap-2">
                                {availableCategories.map(cat => {
                                    const isSelected = selectedCategories.includes(cat.id)

                                    return (

                                        <button
                                            key = {cat.id}
                                            type = 'button'
                                            onClick = {() => handleCategoryToggle(cat.id)}
                                            className = {`
                                                flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide border transition-all
                                                ${isSelected
                                                    ? "bg-zinc-100 text-black border-white"
                                                    : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-zinc-300"
                                                }
                                            `}
                                        >
                                            <Tag
                                                size = {12}
                                                className = {isSelected ? 'fill-current' : ''}
                                            />

                                            {cat.name}
                                        </button>

                                    )
                                })}
                            </div>
                        </div>

                        <div className = "grid grid-cols-1 md:grid-cols-2 gap-5">
                            <FormInput 
                                label = "Starts At"
                                type = 'datetime-local'
                                name = 'start_date'
                                value = {formData.start_date}
                                onChange = {handleChange}
                                style = {{colorScheme : 'dark'}}
                                className = "border-zinc-800 [color-scheme:dark]"
                                Icon = {Calendar}
                                placeholder = "Starts At"
                            />

                            <FormInput 
                                label = "Ends At"
                                type = 'datetime-local'
                                name = 'end_date'
                                value = {formData.end_date}
                                onChange = {handleChange}
                                style = {{colorScheme : 'dark'}}
                                placeholder = "Ends At"
                                Icon = {Clock}
                            />
                        </div>

                        <FormInput 
                            label = "Registration Deadline"
                            type = 'datetime-local'
                            name = 'registration_deadline'
                            value = {formData.registration_deadline}
                            onChange = {handleChange}
                            style = {{colorScheme : 'dark'}}
                            className = "border-zinc-800 border-dashed focus:border-solid"
                            placeholder = "Registration Deadline (Optional)"
                            Icon = {Calendar}
                        />

                        <div className = "space-y-4 pt-2">
                            <div className = "flex items-center justify-between">
                                <label className = "text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">
                                    Where is it happening?
                                </label>
                            </div>

                            <div className = "grid grid-cols-2 gap-1 flex bg-black/40 p-1 rounded-xl border border-zinc-800">
                                <button
                                    type = 'button'
                                    onClick = {() => setFormData(prev => ({...prev, location_type : 'offline'}))}
                                    className = {`
                                        flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all duration-300
                                        ${formData.location_type === 'offline'
                                            ? "bg-zinc-800 text-white shadow-lg ring-1 ring-white/10"
                                            : "bg-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                                        }    
                                    `}
                                >
                                    <MapPin className = "w-4 h-4" />

                                    In-Person
                                </button>

                                <button
                                    type = 'button'
                                    onClick = {() => setFormData(prev => ({...prev, location_type : 'online'}))}
                                    className = {`
                                        flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all duration-300
                                        ${formData.location_type === 'online'
                                            ? "bg-zinc-800 text-white shadow-lg ring-1 ring-white/10"
                                            : "bg-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                                        }
                                    `}
                                >
                                    <Layers className = "w-4 h-4" />

                                    Online
                                </button>
                            </div>

                            <div className = "relative animate-in fade-in slide-in-from-top-1 duration-300">
                                <FormInput 
                                    label = {formData.location_type === 'offline' ? "Venue Name" : "Platform / Meeting Link"}
                                    name = 'location'
                                    placeholder = {formData.location_type === 'offline' ? "e.g., Auditorium 1" : "e.g., Zoom, Google Meet"}
                                    value = {formData.location}
                                    onChange = {handleChange}
                                    className = "border-zinc-800 pl-10"
                                    Icon = {formData.location_type === 'offline' ? MapPin : Layers}
                                />
                            </div>

                            {/* Google Maps Link - Only if offline */}
                            {formData.location_type === 'offline' && (
                                <div className = "relative animate-in fade-in slide-in-from-top-2 duration-300">
                                    <FormInput 
                                        label = "Google Maps Link"
                                        name = 'google_maps_link'
                                        placeholder = 'https://maps.google.com/...'
                                        value = {formData.google_maps_link}
                                        onChange = {handleChange}
                                        className = "border-zinc-800 pl-10 text-blue-400"
                                        Icon = {MapPin}
                                    />

                                    <p className = "text-[10px] text-zinc-600 mt-1.5 ml-1 font-mono">
                                        Paste the full 'Share' link from Google Maps so users can find you.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className = 'space-y-2'>
                            <label className = "text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">
                                Description
                            </label>

                            <div className = "rounded-xl border border-zinc-800 overflow-hidden focus-within:border-orange-500 transition-colors">
                                <RichTextEditor 
                                    value = {formData.description}
                                    onChange = {handleDescriptionChange}
                                />
                            </div>
                        </div>
                    </div>

                    <div className = "h-px bg-zinc-800 w-full" />

                    {/* Settings Section */}
                    <div className = "grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className = {`relative px-6 rounded-2xl border transition-all duration-300 ${formData.is_paid_event ? "bg-zinc-900/50 border-orange-500 shadow-[0_0_20px_rgba(249, 115, 22, 0.1)]" : "bg-[#18181b] border-zinc-800"}`}>
                            <div className = "flex items-center justify-between mb-6 gap-4">
                                <div className = "flex items-center gap-3">
                                    <div className = {`p-2 rounded-lg ${formData.is_paid_event ? "bg-orange-500/20 text-orange-500" : "bg-zinc-900 text-zinc-600"}`}>
                                        <DollarSign className = "w-5 h-5" />
                                    </div>

                                    <div>
                                        <h3 className = {`font-bold text-sm uppercase tracking-wider ${formData.is_paid_event ? 'text-white' : 'text-zinc-400'}`}>
                                            Paid Event
                                        </h3>

                                        <p className = "text-xs text-zinc-600">
                                            Enable Ticket Pricing
                                        </p>
                                    </div>
                                </div>

                                <label className = "relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type = 'checkbox'
                                        name = 'is_paid_event'
                                        checked = {formData.is_paid_event}
                                        onChange = {handleChange}
                                        className = "sr-only peer" // Only screen readers can read this,  or else it'll remain hidden on the main screen
                                    />

                                    <div className = "w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500" />
                                </label>
                            </div>

                            {formData.is_paid_event && (
                                <div className = "animate-in fade-in slide-in-from-top-2 duration-300">
                                    <FormInput 
                                        type = 'number'
                                        name = 'ticket_price'
                                        placeholder = "Event Price"
                                        value = {formData.ticket_price}
                                        onChange = {handleChange}
                                        className = "text-2xl font-bold text-white placeholder:text-zinc-700 bg-black/50 border-zinc-700 focus:border-orange-500"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Data Collection */}
                        <div className = "bg-[#18181b] border border-zinc-800 rounded-2xl p-6">
                            <h3 className = "font-bold text-sm text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Layers className = "w-4 h-4" />

                                Data Collection
                            </h3>

                            <div className = 'space-y-3'>
                                {[
                                    {name : 'collect_phone', label : "Phone Number"},
                                    {name : 'collect_college_school', label : "College/School"},
                                    {name : 'collect_student_id', label : "Student ID/USN"},
                                ].map((field) => (
                                    <label
                                        key = {field.name}
                                        className = {`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${formData[field.name] ? "bg-zinc-900 border-pink-500/50 shadow-[0_0_10px_rgba(236, 72, 153, 0.1)]" : "bg-black/20 border-zinc-800 hover:border-zinc-700"}`}
                                    >
                                        <span className = {`text-sm font-bold ${formData[field.name] ? 'text-white' : 'text-zinc-500'}`}>
                                            {field.label}
                                        </span>

                                        <div className = {`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData[field.name] ? "bg-pink-500 border-pink-500" : "border-zinc-700 bg-zinc-900"}`}>
                                            {formData[field.name] && <Check className = "w-3 h-3 text-white" />}
                                        </div>

                                        <input 
                                            type = 'checkbox'
                                            name = {field.name}
                                            checked = {formData[field.name]}
                                            onChange = {handleChange}
                                            className = 'hidden'
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className = 'pt-6'>
                        <SolidAnimatedButton
                            type = 'submit'
                            disabled = {loading}
                        >
                            {loading ? (isEditMode ? "Saving..." : "Creating Event...") : (isEditMode ? "Save Changes" : "Publish Event")}
                        </SolidAnimatedButton>
                    </div>
                </form>
            </div>
        </div>

    )

}
