// CreateEvent.jsx


import React, {useState, useEffect, useCallback, useMemo, Suspense, use} from 'react'
import {useNavigate, useLocation} from 'react-router-dom'
import {Upload, FileText, Layers, IndianRupee, Check, Calendar, MapPin, Clock, Tag, Trash2, Paperclip, X, AlertCircle, Users, Plus, Minus, Shield, Loader2} from 'lucide-react'
import {toast} from 'react-hot-toast'
import imageCompression from 'browser-image-compression'

import api from '../api/api'

import {getImageUrl} from '../utils/imageHelper'

import FormInput from '../components/common/FormInput'
import BackButton from '../components/common/BackButton'
import Logo from '../components/common/Logo'
import SolidAnimatedButton from '../components/ui/SolidAnimatedButton'

const RichTextEditor = React.lazy(() => import('../components/ui/RichTextEditor'))


const logError = (context, error) => {
    console.error(`[${context}]`, error)

    if (error?.response?.data) return error.response.data

    return {generic : error.message || "An unexpected error occurred."}
}

const ToggleSwitch = React.memo(({label, description, checked, onChange, icon : Icon, activeColor = 'bg-green-500'}) => (

    <div 
        className = {`
            group flex items-center justify-between p-4 rounded-xl border transition-all duration-300
            ${checked
                ? "bg-zinc-900/80 border-zinc-700"
                : "bg-zinc-900/30 border-zinc-800 hover:border-zinc-700"
            }
        `}
    >
        <div className = "flex items-start gap-3">
            <div 
                className = {`
                    mt-1 p-2 rounded-lg transition-colors
                    ${checked
                        ? "bg-zinc-800 text-white"
                        : "bg-zinc-900 text-zinc-600"
                    }
                `}
            >
                <Icon className = "h-5 w-5" />
            </div>

            <div>
                <h3 
                    className = {`
                        text-sm font-bold uppercase tracking-wide transition-colors
                        ${checked
                            ? 'text-white'
                            : 'text-zinc-400'
                        }
                    `}
                >
                    {label}
                </h3>

                {description && <p className = "text-xs text-zinc-600 mt-0.5">{description}</p>}
            </div>
        </div>

        <button
            type = 'button'
            onClick = {() => onChange(!checked)}
            className = {`
                relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
                ${checked
                    ? activeColor
                    : 'bg-zinc-700'
                }
            `}
        >
            <span className = 'sr-only'>
                Use setting
            </span>

            <span 
                aria-hidden = 'true'
                className = {`
                    pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out
                    ${checked
                        ? 'translate-x-5'
                        : 'translate-x-0'
                    }     
                `}
            />
        </button>
    </div>

))

export default function CreateEvent() {
    
    const navigate = useNavigate()
    const location = useLocation()

    const eventToEdit = location.state?.eventToEdit
    const isEditMode = !!eventToEdit

    const [loading, setLoading] = useState(false)
    const [isCompressing, setIsCompressing] = useState(false)
    const [pageErrors, setPageErrors] = useState({})
    const [error, setError] = useState(null)

    const [hasAgeLimit, setHasAgeLimit] = useState(false)
    const [hasCustomDeadline, setHasCustomDeadline] = useState(false)
    const [posterPreview, setPosterPreview] = useState(null)

    // Categories state
    const [availableCategories, setAvailableCategories] = useState([])
    const [selectedCategories, setSelectedCategories] = useState([])

    // Documents state
    const [newDocuments, setNewDocuments] = useState([])
    const [existingDocuments, setExistingDocuments] = useState([])
    const [posterFile, setPosterFile] = useState(null)

    const [formData, setFormData] = useState({
        name : '',
        description : '',
        start_date : '',
        end_date : '',
        registration_deadline : '',
        physical_location : '', // Maps to physical_location in DB
        location_type : 'offline',
        google_maps_link : '',
        virtual_location : '',

        // Toggles
        is_native : true,
        collect_phone : false,
        collect_college_school : false,
        collect_student_id : false,
        age_restriction_cutoff : '',

        max_tickets_per_user : 1,

        // Payment state
        is_paid_event : false,
        ticket_price : '',
    })

    useEffect(() => {

        return () => {

            if (posterPreview && !posterPreview.startsWith('http')) {
                URL.revokeObjectURL(posterPreview)
            }

        }

    }, [posterPreview])

    // Load categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get('/api/data/categories/')
                
                setAvailableCategories(Array.isArray(res.data.results) ? res.data.results : res.data || [])
            } catch (err) {
                logError('CategoryFetch', err)
                
                toast.error("Could not load categories. Please refresh.")
            }
        }

        fetchCategories()
    }, [])

    // Load form with existing data if edit mode
    useEffect(() => {
        if (isEditMode && eventToEdit) {
            setFormData({
                name : eventToEdit.name || '',
                description : eventToEdit.description || '',

                start_date : formatDateForInput(eventToEdit.start_date),
                end_date : formatDateForInput(eventToEdit.end_date),
                registration_deadline : formatDateForInput(eventToEdit.registration_deadline),

                physical_location : eventToEdit.physical_location || '',
                location_type : eventToEdit.location_type || 'offline',
                google_maps_link : eventToEdit.google_maps_link || '',
                virtual_location : eventToEdit.virtual_location || '',

                is_native : eventToEdit.is_native,

                collect_phone : eventToEdit.collect_phone,
                collect_college_school : eventToEdit.collect_college_school,
                collect_student_id : eventToEdit.collect_student_id,
                age_restriction_cutoff : eventToEdit.age_restriction_cutoff || '',

                max_tickets_per_user : eventToEdit.max_tickets_per_user || 1,

                is_paid_event : eventToEdit.is_paid_event,
                ticket_price : eventToEdit.ticket_price || '',
            })

            // Pre-fill categories - What this means is that the API calls gives full objs to display but selectedCategories only accepts list of IDs. So we use map
            // to map over the full objs & extract only the IDs.
            if (eventToEdit.categories) {
                setSelectedCategories(eventToEdit.categories.map(c => c.id))
            }

            // Existing poster preview
            if (eventToEdit.poster) {
                setPosterPreview(getImageUrl(eventToEdit.poster))
            }

            if (eventToEdit.existingDocuments) {
                setExistingDocuments(eventToEdit.documents)
            }

            if (eventToEdit?.age_restriction_cutoff) {
                setHasAgeLimit(true)
            }

            if (eventToEdit.registration_deadline) {
                setHasCustomDeadline(true)
            }
        }
    }, [isEditMode, eventToEdit])

    // Document handlers
    const handleDocumentChange = useCallback((e) => {
        const files = Array.from(e.target.files)

        if (files.length === 0) return

        const totalCount = newDocuments.length + existingDocuments.length + files.length

        if (totalCount > 5) {
            toast.error("Maximum of 5 documents allowed")

            return
        }

        const validFiles = files.filter(file => {
            if (file.size > 10 * 1024 * 1024) {
                toast.error(`Skipped ${file.name}: Too large (Max 10MB)`)

                return false
            }

            return true
        })

        setNewDocuments(prev => [...prev, ...validFiles])

        e.target.value = ''
    }, [newDocuments.length, existingDocuments.length])

    const removeNewDocument = (index) => {
        setNewDocuments(prev => prev.filter((_, i) => i !== index))
    }

    const deleteExistingDocument = async (docId) => {
        if (!window.confirm("Delete this document?")) return

        try {
            await api.delete(`api/host/document/${docId}/delete/`)

            setExistingDocuments(prev => prev.filter(doc => doc.id !== docId))

            toast.success("Document deleted")
        } catch (err) {
            console.error(err)

            toast.error("Failed to delete document")
        }
    }

    // Form handlers
    const handleChange = useCallback((e) => {
        const {name, value, type, checked} = e.target

        setPageErrors(prev => {
            if (prev[name]) {
                const newErrors = {...prev}

                delete newErrors[name]

                return newErrors
            }

            return prev
        })

        setFormData(prev => ({
            ...prev,
            [name] : type === 'checkbox' ? checked : value
        }))
    }, [])

    const handleCategoryToggle = (catId) => {
        setSelectedCategories(prev => {
            if (isSelected) {
                
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

        if (name === 'poster') {
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

    const handleTicketsChange = useCallback((delta) => {
        setFormData(prev => {
            const current = parseInt(prev.max_tickets_per_user || 1)
            const newVal = Math.max(1, Math.min(10, current + delta))

            return {...prev, max_tickets_per_user : newVal}
        })
    })

    const handlePosterChange = async (e) => {
        const file = e.target.files[0]

        if (!file) return

        const validTypes = ['image/jpeg', 'image/png', 'image/webp']

        if (!validTypes.includes(file.type)) {
            toast.error("Invalid format. Use JPG, PNG or WEBP.")
        
            return
        }

        setIsCompressing(true)

        try {
            const options = {
                maxSizeMB : 5,
                maxWidthOrHeight : 1920,
                useWebWorker : true,
                fileType : file.type
            }

            const compressedFile = await imageCompression(file, options)

            setPosterFile(compressedFile)
            setPosterPreview(URL.createObjectURL(compressedFile))

            console.log(`Original : ${(file.size/1024/1024).toFixed(2)}MB, Compressed : ${(compressedFile.size/1024/1024).toFixed(2)}MB`)
        } catch (error) {
            console.error("Compression failed : ", error)

            toast.error("Image compression failed. Using original.")

            setPosterFile(file)
            setPosterPreview(URL.createObjectURL(file))
        } finally {
            setIsCompressing(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (isCompressing) {
            toast.error("Please wait for image processing to finish.")

            return
        }

        setLoading(true)
        setPageErrors({})

        const validationErrors = validateForm()

        if (Object.keys(validationErrors).length > 0) {
            setPageErrors(validationErrors)

            toast.error("Please fix the errors highlighted in red.")

            setLoading(false)

            const firstErrorField = document.querySelector('[name="' + Object.keys(validationErrors)[0] + '"]')

            if (firstErrorField) firstErrorField.scrollIntoView({behavior : 'smooth', block : 'center'})

            return
        }

        const data = new FormData()

        Object.entries(formData).forEach(([key, value]) => {
            if (key === 'description' && !value) return

            if (key === 'registration_deadline' && !hasCustomDeadline) return

            if (key === 'age_restriction_cutoff' && !hasAgeLimit) return

            if (key === 'ticket_price' && !formData.is_paid_event) return

            if (key === 'physical_location' && formData.location_type !== 'offline') return

            if (key === 'virtual_location' && formData.location_type !== 'online') return

            data.append(key, value)
        })

        selectedCategories.forEach(id => data.append('category_ids', id))

        if (posterFile) data.append('poster', posterFile)

        newDocuments.forEach(file => data.append('uploaded_documents', file))

        try {
            if (isEditMode) {
                await api.patch(`/api/host/edit/${eventToEdit.id}/`, data)

                toast.success("Event Updated Successfully!")
            } else {
                await api.post('/api/host/create-event/', data)
                
                toast.success("Event Created Successfully!")
            }

            navigate('/host/dashboard')
        } catch (err) {
            const serverErrors = logError('CreateEventSubmit', err)
            const newFieldErrors = {}

            let genericMsg = "Failed to save event."

            Object.keys(serverErrors).forEach(key => {
                const msg = Array.isArray(serverErrors[key]) ? serverErrors[key][0] : serverErrors[key]

                if (key in formData) {
                    newFieldErrors[key] = msg
                } else {
                    genericMsg = msg
                }
            })

            setPageErrors(newFieldErrors)

            if (Object.keys(newFieldErrors).length === 0) {
                toast.error(genericMsg)
            } else {
                toast.error("Please check the form for errors.")
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

    const validateForm = () => {
        const errors = {}

        const start = new Date(formData.start_date)
        const end = new Date(formData.end_date)
        const now = new Date()

        if (!formData.name.trim()) errors.name = "Event name is required"

        if (!formData.start_date) errors.start_date = "Start date is required"

        if (!formData.end_date) errors.end_date = "End date is required"

        if (formData.start_date && start < now) errors.start_date = "Start date cannot be in the past"

        if (formData.start_date && formData.end_date && start >= end) errors.end_date = "End date must be after the start date"

        if (hasCustomDeadline && formData.registration_deadline) {
            const deadline = new Date(formData.registration_deadline)

            if (deadline > start) errors.registration_deadline = "Deadline must be before event start"
        }

        if (formData.location_type === 'offline') {
            if (!formData.physical_location) errors.physical_location = "Venue required"
        } else {
            if (!formData.virtual_location) errors.virtual_location = "Meeting link required"
        }

        if (formData.is_paid_event && (!formData.ticket_price || formData.ticket_price <= 0)) errors.ticket_price = "Valid ticket price required"

        if (hasAgeLimit && !formData.age_restriction_cutoff) errors.age_restriction_cutoff = "Cutoff data required"
    
        return errors
    }

    const toggleRegistrationDeadline = (checked) => {
        setHasCustomDeadline(checked)

        if (!checked) setFormData(prev => ({...prev, registration_deadline : ''}))
    }

    const toggleAgeLimit = (checked) => {
        setHasAgeLimit(checked)

        if (!checked) setFormData(prev => ({...prev, age_restriction_cutoff : ''}))
    }

    // Helper to format Django ISO dates to HTML Input format
    const formatDateForInput = (isoString) => {
        if (!isoString) return ''

        const date = new Date(isoString)

        return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16)
    }

    const festiveGradient = "bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600"

    return (

        <div className = "min-h-screen bg-[#09090b] text-white font-sans relative overflow-x-hidden selection:bg-orange-500 selection:text-white">
            {/* Background Texture */}
            <div
                className = "fixed inset-0 opacity-[0.03] pointer-events-none z-0"
                style = {{
                    backgroundImage : "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
                    backgroundSize : "40px 40px"
                }}
            />

            <div className = "max-w-4xl mx-auto px-4 sm:px-6 relative z-10 pt-6 md:pt-12 pb-32">
                {/* Header/Nav placeholder */}
                <div className = "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 md:mb-12">
                    {/* Back button */}
                    <div className = "space-y-4 w-full">
                        <BackButton
                            to = '/host/dashboard'
                            label = 'Back'
                            className = "p-2 rounded-lg transition-colors -ml-2"
                        />
                        
                        <div>
                            <h1 className = "text-3xl sm:text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-[0.9]">
                                {isEditMode ? 'Edit' : 'Create'} <br className = "hidden sm:block" />
                            </h1>

                            <p className = "text-zinc-500 text-xs sm:text-sm font-medium uppercase tracking-wide flex items-center gap-2 mt-2">
                                <Layers className = "h-4 w-4" />

                                {isEditMode ? "Update Details" : "Launch Experience"}
                            </p>
                        </div>
                    </div>

                    {/* Logo */}
                    <Logo
                        className = "h-8 w-8 hidden sm:block"
                        textSize = 'text-2xl'
                    />
                </div>

                {Object.keys(pageErrors).length > 0 && (
                    <div className = "bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-8 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className = "h-5 w-5 shrink-0" />

                        <div>
                            <h4 className = "font-bold text-sm">
                                Please fix the following issues:
                            </h4>

                            <ul className = "list-disc list-inside text-xs mt-1 space-y-1 opacity-90">
                                {Object.values(pageErrors).map((err, i) => (
                                    <li key = {i}>
                                        {err}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                <form
                    onSubmit = {handleSubmit}
                    className = 'space-y-12'
                >
                    {/* Visuals */}
                    <div className = 'space-y-6'>
                        <h3 className = "text-lg md:text-xl font-bold text-white flex items-center gap-3">
                            <span className = "h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-orange-500 text-sm shadow-sm">
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
                                    flex flex-col items-center justify-center w-full aspect-video md:h-96 rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden relative border-2 border-dashed
                                    ${posterPreview
                                        ? "border-orange-500/50 bg-zinc-900"
                                        : "border-zinc-800 hover:border-zinc-600 bg-[#18181b] hover:bg-zinc-900"
                                    }
                                `}
                            >
                                {isCompressing && (
                                    <div className = "absolute inset-0 z-20 bg-black/80 flex flex-col items-center justify-center animate-in fade-in">
                                        <Loader2 className = "h-10 w-10 text-orange-500 animate-spin mb-2" />

                                        <p className = "text-xs font-bold text-white uppercase tracking-wider">
                                            Compressing Image...
                                        </p>
                                    </div>
                                )}

                                {posterPreview ? (
                                    <>
                                        <img 
                                            src = {posterPreview}
                                            alt = 'Preview'
                                            className = "h-full w-full object-cover"
                                        />

                                        <div className = "absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity p-4 text-center">
                                            <Upload className = "h-8 md:h-10 w-8 md:w-10 text-orange-500 mb-3" />

                                            <span className = "font-bold text-white uppercase tracking-widest text-xs md:text-sm">
                                                Change Poster
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <div className = "flex flex-col items-center text-zinc-600 group-hover:text-orange-500 transition-colors p-4 text-center">
                                        <Upload className = "h-8 w-8 mb-3" />

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
                                    name = 'poster'
                                    className = 'hidden'
                                    onChange = {handlePosterChange}
                                    accept = "image/png, image/jpeg, image/webp"
                                    disabled = {isCompressing}
                                />
                            </label>
                        </div>

                        {/* Brochure Upload */}
                        {/* <div className = "bg-[#18181b] border border-zinc-800 rounded-xl p-4 flex items-center gap-4 transition-colors hover:border-zinc-700 group">
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
                                    {/* {brochureFile ? (
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
                        </div> */}

                        {/* Documents section */}
                        <div className = 'space-y-3'>
                            <div className = "flex items-center justify-between">
                                <label className = "text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">
                                    Documents
                                </label>

                                <span className = "text-[10px] text-zinc-600 font-mono">
                                    Max. 5 files (PDF, DOC, DOCX)
                                </span>
                            </div>

                            <label className = "flex items-center justify-center w-full p-6 border-2 border-dashed border-zinc-800 hover:border-zinc-700 rounded-xl bg-[#18181b] hover:bg-zinc-900 transition-all cursor-pointer group active:scale-[0.99]">
                                <div className = "flex items-center gap-2">
                                    <Paperclip className = "h-6 w-6 text-zinc-600 group-hover:text-indigo-500 transition-colors" />

                                    <div className = 'text-center'>
                                        <p className = "text-xs font-bold text-zinc-400 group-hover:text-white transition-colors">
                                            Attach Files
                                        </p>

                                        <p className = "text-[10px] text-zinc-600 font-mono ml-1">
                                            Up to 5 files
                                        </p>
                                    </div>
                                </div>

                                <input
                                    type = 'file'
                                    multiple
                                    onChange = {handleDocumentChange}
                                    className = 'hidden'
                                />
                            </label>
                            
                            <div className = "grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                                {existingDocuments.map((doc) => (
                                    <div
                                        key = {doc.id}
                                        className = "flex items-center justify-between p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg"
                                    >
                                        <div className = "flex items-center gap-3 overflow-hidden min-w-0">
                                            <FileText className = "h-4 w-4 text-indigo-500 shrink-0" />

                                            <span className = "text-xs text-zinc-300 truncate font-mono">
                                                {doc.file
                                                    ? doc.file.split('/').pop()
                                                    : 'Document'
                                                }
                                            </span>
                                        </div>

                                        <button
                                            type = 'button'
                                            onClick = {() => deleteExistingDocument(doc.id)}
                                            className = "p-2 text-zinc-600 hover:text-red-500"
                                        >
                                            <Trash2 className = "h-4 w-4" />
                                        </button>
                                    </div>
                                ))}

                                {newDocuments.map((file, index) => (
                                    <div
                                        key = {index}
                                        className = "flex items-center justify-between p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg"
                                    >
                                        <div className = "flex items-center gap-3 overflow-hidden min-w-0">
                                            <Paperclip className = "h-4 w-4 text-green-500 shrink-0" />

                                            <span className = "text-xs text-white truncate font-mono">
                                                {file.name}
                                            </span>
                                        </div>

                                        <button
                                            type = 'button'
                                            onClick = {() => removeNewDocument(index)}
                                            className = "p-2 text-zinc-500 hover:text-red-400"
                                        >
                                            <X className = "h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className = "h-px bg-zinc-800 w-full" /> {/* h-px means height of 1px */}

                    {/* Details Section */}
                    <div className = 'space-y-8'>
                        <h3 className = "text-lg md:text-xl font-bold text-white flex items-center gap-3">
                            <span className = "h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-pink-500 text-sm shadow-sm">
                                02
                            </span>

                            Details
                        </h3>

                        <FormInput 
                            label = "Event Name"
                            name = 'name'
                            placeholder = "Event Name"
                            value = {formData.name}
                            onChange = {handleChange}
                            error = {pageErrors.name}
                            className = "py-3 md:py-2"
                        />

                        {/* Categories */}
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
                                                flex items-center gap-2 px-4 py-3 md:py-2 rounded-full text-xs font-bold uppercase tracking-wide border transition-all active:scale-95
                                                ${isSelected
                                                    ? "bg-zinc-100 text-black border-white"
                                                    : "bg-zinc-900 text-zinc-500 hover:text-zinc-300 border-zinc-800 hover:border-zinc-600"
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
                        
                        {/* Dates */}
                        <div className = "grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <FormInput 
                                label = "Starts At"
                                type = 'datetime-local'
                                name = 'start_date'
                                value = {formData.start_date}
                                onChange = {handleChange}
                                icon = {Calendar}
                                error = {pageErrors.start_date}
                            />

                            <FormInput 
                                label = "Ends At"
                                type = 'datetime-local'
                                name = 'end_date'
                                value = {formData.end_date}
                                onChange = {handleChange}
                                icon = {Clock}
                                error = {pageErrors.end_date}
                            />
                        </div>

                        <div className = 'space-y-4'>
                            <ToggleSwitch 
                                label = "Registration Deadline"
                                description = "Set a specific date & time for registration to close."
                                icon = {Clock}
                                checked = {hasCustomDeadline}
                                onChange = {toggleRegistrationDeadline}
                                activeColor = 'bg-pink-500'
                            />

                            {hasCustomDeadline && (
                                <div className = "animate-in slide-in-from-top-2 fade-in duration-300 pt-2">
                                    <FormInput 
                                        type = 'datetime-local'
                                        name = 'registration_deadline'
                                        value = {formData.registration_deadline}
                                        onChange = {handleChange}
                                        error = {pageErrors.registration_deadline}
                                        required = {hasCustomDeadline}
                                        className = "bg-black/50 border-zinc-700 focus:border-pink-500"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Location */}
                        <div className = "space-y-4 pt-2">
                            <label className = "text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">
                                Where is it happening?
                            </label>

                            <div className = "grid grid-cols-2 gap-1 flex bg-black/40 p-1 rounded-xl border border-zinc-800">
                                {['offline', 'online'].map(type => (
                                    <button
                                        key = {type}
                                        type = 'button'
                                        onClick = {() => setFormData(prev => ({...prev, location_type : type}))}
                                        className = {`
                                            flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-bold uppercase tracking-wide transition-all duration-300
                                            ${formData.location_type === type
                                                ? "bg-zinc-800 text-white shadow-lg ring-1 ring-white/10"
                                                : "bg-transparent text-zinc-400 hover:bg-zinc-800/50"
                                            }    
                                        `}
                                    >
                                        {type === 'offline'
                                            ? <MapPin className = "h-4 w-4" />
                                            : <Layers className = "h-4 w-4" />
                                        }

                                        {type === 'offline'
                                            ? 'In-Person'
                                            : 'Online'
                                        }
                                    </button>
                                ))}
                            </div>

                            <div className = "relative animate-in fade-in slide-in-from-top-1 duration-300">
                                {formData.location_type === 'offline' ? (
                                    <>
                                        <FormInput 
                                            label = "Venue Name"
                                            name = 'physical_location'
                                            placeholder = "e.g., Auditorium 1"
                                            value = {formData.physical_location}
                                            onChange = {handleChange}
                                            error = {pageErrors.physical_location}
                                            className = "border-zinc-800 pl-10 py-3"
                                            icon = {MapPin}
                                        />

                                        <div className = 'mt-4'>
                                            <FormInput 
                                                label = "Google Maps Link"
                                                name = 'google_maps_link'
                                                placeholder = 'http://googleusercontent.com/maps.google.com/...'
                                                value = {formData.google_maps_link}
                                                onChange = {handleChange}
                                                className = "border-zinc-800 pl-10 text-blue-400 py-3"
                                                icon = {MapPin}
                                            />

                                            <p className = "text-[10px] text-zinc-600 mt-1.5 ml-1 font-mono">
                                                Paste the full 'Share' link from Google Maps.
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <FormInput 
                                        label = "Platform/Meeting Link"
                                        name = 'virtual_location'
                                        placeholder = "e.g., Zoom, Google Meet"
                                        value = {formData.virtual_location}
                                        onChange = {handleChange}
                                        className = "border-zinc-800 pl-10 py-3"
                                        icon = {Layers}
                                        error = {pageErrors.virtual_location}
                                    />
                                )}
                            </div>
                        </div>

                        <div className = 'space-y-2'>
                            <label className = "text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">
                                Description
                            </label>

                            <div className = "rounded-xl border border-zinc-800 overflow-hidden focus-within:border-orange-500 transition-colors min-h-[150px] relative">
                                <Suspense 
                                    fallback = {
                                        <div className = "flex items-center justify-center h-40 bg-zinc-900/50 text-zinc-500">
                                            <Loader2 className = "animate-spin h-5 w-5 mr-2" />

                                            Loading Editor...
                                        </div>
                                    }
                                >
                                    <RichTextEditor 
                                        value = {formData.description}
                                        onChange = {handleDescriptionChange}
                                    />
                                </Suspense>
                            </div>
                        </div>
                    </div>

                    <div className = "h-px bg-zinc-800 w-full" />

                    {/* Settings Section */}
                    <div className = 'space-y-8'>
                        <h3 className = "text-lg md:text-xl font-bold text-white flex items-center gap-3">
                            <span className = "h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-orange-500 text-sm shadow-sm">
                                03
                            </span>

                            Settings
                        </h3>

                        <div className = "grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className = 'space-y-4'>
                                <ToggleSwitch 
                                    label = "Paid Event"
                                    description = "Enable ticket pricing for this event."
                                    icon = {IndianRupee}
                                    checked = {formData.is_paid_event}
                                    onChange = {(checked) => setFormData(prev => ({...prev, is_paid_event : checked}))}
                                    activeColor = 'bg-orange-500'
                                />

                                {formData.is_paid_event && (
                                    <div className = "pl-4 border-l-2 border-zinc-800 ml-4 animate-in slide-in-from-top-2 fade-in duration-300">
                                        <FormInput
                                            label = "Price (INR)"
                                            type = 'number'
                                            name = 'ticket_price'
                                            value = {formData.ticket_price}
                                            onChange = {handleChange}
                                            className = "text-2xl font-bold text-white bg-black/50 border-zinc-700 focus:border-orange-500"
                                            icon = {IndianRupee}
                                            error = {pageErrors.ticket_price}
                                        />
                                    </div>
                                )}
                            </div>

                            <div 
                                className = {`
                                    p-4 rounded-xl border transition-all duration-300
                                    ${formData.max_tickets_per_user > 1
                                        ? "bg-zinc-900 border-indigo-500/30"
                                        : "bg-zinc-900/30 border-zinc-800"
                                    }
                                `}
                            >
                                <div className = "flex items-center gap-3 mb-4">
                                    <div className = "p-2 bg-zinc-900 rounded-lg text-indigo-500 border border-zinc-800">
                                        <Users className = "h-5 w-5" />
                                    </div>

                                    <div className = 'flex-1'>
                                        <h3 className = "text-sm font-bold uppercase tracking-wide text-zinc-300">
                                            Group Booking
                                        </h3>

                                        <p className = "text-xs text-zinc-600">
                                            Maximum tickets per user
                                        </p>
                                    </div>

                                    <div className = "flex items-center gap-4 bg-black/40 p-2 rounded-xl border border-zinc-800/50">
                                        <button
                                            type = 'button'
                                            onClick = {() => handleTicketsChange(-1)}
                                            className = "p-3 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white"
                                        >
                                            <Minus className = "h-4 w-4" />
                                        </button>

                                        <span className = "text-xl font-mono font-bold text-white w-6 text-center">
                                            {formData.max_tickets_per_user === 1 ? 'Ticket' : 'Tickets'}
                                        </span>
                                    
                                        <button
                                            type = 'button'
                                            onClick = {() => handleTicketsChange(1)}
                                            className = "p-3 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white"
                                        >
                                            <Plus className = "h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Age Restriction */}
                            <div className = "lg:col-span-2 space-y-4">
                                <ToggleSwitch 
                                    label = "Age Restriction"
                                    description = "Restrict this event to specific age groups."
                                    icon = {Shield}
                                    checked = {hasAgeLimit}
                                    onChange = {toggleAgeLimit}
                                    activeColor = 'bg-red-500'
                                />

                                {hasAgeLimit && (
                                    <div className = "pl-4 border-l-2 border-zinc-800 ml-4 animate-in slide-in-from-top-2 fade-in duration-300">
                                        <div className = "bg-zinc-900/50 p-5 rounded-xl border border-zinc-800/50 flex flex-col md:flex-row gap-6 items-start md:items-center">
                                            <div className = "flex-1 w-full">
                                                <FormInput 
                                                    label = "Cutoff Birth Date"
                                                    type = 'date'
                                                    name = 'age_restriction_cutoff'
                                                    value = {formData.age_restriction_cutoff}
                                                    onChange = {handleChange}
                                                    error = {pageErrors.age_restriction_cutoff}
                                                    required = {hasAgeLimit}
                                                    className = "bg-black/50 border-zinc-700 focus:border-red-500 w-full"
                                                />
                                            </div>

                                            <div className = "hidden md:block h-12 w-px bg-zinc-800" />

                                            <div className = "flex-1 text-xs text-zinc-500 leading-relaxed">
                                                <p className = "font-bold text-zinc-400 mb-1 flex items-center gap-2">
                                                    <AlertCircle className = "h-3 w-3 text-red-500" />

                                                    How this works:
                                                </p>

                                                Users born <strong>after</strong> this date will be blocked.
                                                
                                                <br />

                                                For example, if you want an <strong>18+ event</strong>, select a date from 18 years ago.
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Data Collection */}
                            <div className = "bg-[#18181b] border border-zinc-800 rounded-2xl p-5 md:p-6 lg:col-span-2">
                                <h3 className = "font-bold text-sm text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Layers className = "h-4 w-4" />

                                    Data Collection
                                </h3>

                                <div className = 'grid grid-cols-1 md:grid-cols-3 gap-3'>
                                    {[
                                        {name : 'collect_phone', label : "Phone Number"},
                                        {name : 'collect_college_school', label : "College/School"},
                                        {name : 'collect_student_id', label : "Student ID/USN"},
                                    ].map((field) => (
                                        <label
                                            key = {field.name}
                                            className = {`
                                                flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all active:scale-[0.98] 
                                                ${formData[field.name] 
                                                    ? "bg-zinc-900 border-pink-500/50" 
                                                    : "bg-black/20 border-zinc-800"
                                                }
                                            `}
                                        >
                                            <span 
                                                className = {`
                                                    text-sm font-bold 
                                                    ${formData[field.name] 
                                                        ? 'text-white' 
                                                        : 'text-zinc-500'
                                                    }
                                                `}
                                            >
                                                {field.label}
                                            </span>

                                            <div 
                                                className = {`
                                                    h-5 w-5 rounded border flex items-center justify-center transition-colors 
                                                    ${formData[field.name] 
                                                        ? "bg-pink-500 border-pink-500"
                                                        : "border-zinc-700 bg-zinc-900"
                                                    }
                                                `}
                                            >
                                                {formData[field.name] && <Check className = "h-3 w-3 text-white" />}
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
                                disabled = {loading || isCompressing}
                                className = "w-full py-4 text-lg"
                            >
                                {loading ? (
                                    <span className = "flex items-center gap-2">
                                        <Loader2 className = "animate-spin h-5 w-5" />

                                        {isEditMode ? 'Saving...' : 'Creating...'}
                                    </span>
                                ) : isCompressing ? (
                                    <span className = "flex items-center gap-2">
                                        <Loader2 className = "animate-spin h-5 w-5" />

                                        Processing Image...
                                    </span>
                                ) : (isEditMode ? "Save Changes" : "Publish Event")}
                            </SolidAnimatedButton>
                        </div>
                    </div>
                </form>
            </div>
        </div>

    )

}
