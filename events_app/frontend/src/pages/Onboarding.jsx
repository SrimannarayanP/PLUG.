// Onboarding.jsx


import {AlertCircle, ArrowRight, Building2, Calendar, ChevronRight, GraduationCap, Loader2, Phone} from 'lucide-react'
import {useEffect, useState} from 'react'
import {toast} from 'react-hot-toast'
import {useNavigate} from 'react-router-dom'

import api from '../api/api'

import LoadingSpinner from '../components/common/LoadingSpinner'
import SearchableSelect from '../components/common/SearchableSelect'


export default function Onboarding() {

    const navigate = useNavigate()

    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [errors, setErrors] = useState(false)

    const [isExternalPromoter, setIsExternalPromoter] = useState(false)

    const [formData, setFormData] = useState({
        phone_number : '',
        date_of_birth : '',
        student_id_number : '',
        organisation_name : '',
        school_college_id : '',
        school_college_name : '',
        school_college_campus : '',
        school_college_city : '',
        school_college_state : '',
    })

    // Fetch user profile
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await api.get('/api/user/profile/')

                setUser(response.data)

                const isHostUser = !!response.data.profile?.host_type

                if (isHostUser && !response.data.profile?.school_college?.id) {
                    setIsExternalPromoter(true)
                }

                // Pre-fill existing data, if any
                setFormData(prev => ({
                    ...prev,
                    phone_number : response.data.profile?.phone_number || '',
                    date_of_birth : response.data.profile?.date_of_birth || '',
                    student_id_number : response.data.profile?.student_id_number || '',
                    organisation_name : isHostUser ? (response.data.profile?.name || '') : '',
                    school_college_id : response.data.profile?.school_college?.id || '',
                    school_college_name : response.data.profile?.school_college?.name || ''
                }))
            } catch (err) {
                console.error("Failed to load user", err)

                navigate('/login')
            } finally {
                setLoading(false)
            }
        }
        
        fetchUser()
    }, [navigate])

    const handleChange = (field, value) => {
        setFormData(prev => ({...prev, [field] : value}))

        if (errors[field]) {
            setErrors(prev => ({...prev, [field] : null}))
        }
    }

    const handleCollegeChange = (selection) => {
        setErrors(prev => ({
            ...prev,
            school_college_name : null,
            school_college_city : null,
            school_college_state : null,
        }))

        if (!selection) {
            setFormData(prev => ({
                ...prev,
                school_college_id : null,
                school_college_name : '',
                school_college_campus : '',
                school_college_city : '',
                school_college_state : '',
            }))

            return
        }

        if (selection.isNew) {
            setFormData(prev => ({
                ...prev,
                school_college_id : '',
                school_college_name : selection.name,
                school_college_campus : '',
                school_college_city : '',
                school_college_state : ''
            }))
        } else {
            setFormData(prev => ({
                ...prev,
                school_college_id : selection.id,
                school_college_name : selection.name,
                school_college_campus : '',
                school_college_city : '',
                school_college_state : ''
            }))
        }
    }

    const isHost = !!user?.profile?.host_type

    const validateForm = () => {
        const newErrors = {}
        const rawPhone = formData.phone_number ? formData.phone_number.replace(/\D/g, '') : ''

        const isValidPhone = rawPhone.length === 10 ||
                            (rawPhone.length === 11 && rawPhone.startsWith('0')) ||
                            (rawPhone.length === 12 && rawPhone.startsWith('91'))

        if (isHost) {
            if (!formData.phone_number) {
                newErrors.phone_number = "Phone number is required for hosts."
            } else if (!isValidPhone) {
                newErrors.phone_number = "Please enter a valid phone number."
            }
        } else {
            if (formData.phone_number && !isValidPhone) {
                newErrors.phone_number = "Please enter a valid phone number."
            }
        }

        if (isHost) {
            if (!formData.phone_number) {
                newErrors.phone_number = "Phone number is required for hosts."
            } else if (!isValidPhone) {
                newErrors.phone_number = "Please enter a valid phone number."
            }

            if (!formData.organisation_name.trim()) {
                newErrors.organisation_name = "Organisation name is required."
            }

            if (!isExternalPromoter && !formData.school_college_id && !formData.school_college_name) {
                newErrors.school_college_name = "College affiliation is required for official student clubs."
            }
        } else {
            if (formData.phone_number && !isValidPhone) {
                newErrors.phone_number = "Please enter a valid phone number."
            }

            if (formData.date_of_birth) {
                const selectedDate = new Date(formData.date_of_birth)
                const today = new Date()

                if (selectedDate > today) {
                    newErrors.date_of_birth = "Date of birth cannot be in the future."
                }
            }
        }

        if (formData.school_college_name && !formData.school_college_id) {
            if (!formData.school_college_city.trim()) {
                newErrors.school_college_city = "City is required for a new college."
            }

            if (!formData.school_college_state.trim()) {
                newErrors.school_college_state = "State is required for a new college."
            }
        }

        setErrors(newErrors)

        return Object.keys(newErrors).length === 0
    }

    const handleSkip = () => {
        navigate('/')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!validateForm()) {
            toast.error("Please fix the errors before proceeding.")

            return
        }

        setSubmitting(true)

        try {
            // Clean data before sending
            const payload = {...formData}

            if (payload.date_of_birth === '') payload.date_of_birth = null
            if (payload.school_college_id === '') payload.school_college_id = null

            if (isHost) {
                delete payload.date_of_birth
                delete payload.student_id_number

                if (isExternalPromoter) {
                    payload.school_college_id = null

                    delete payload.school_college_name
                    delete payload.school_college_campus
                    delete payload.school_college_city
                    delete payload.school_college_state
                }
            } else {
                delete payload.organisation_name

                if (!payload.school_college_name) {
                    payload.school_college_id = null

                    delete payload.school_college_name
                    delete payload.school_college_campus
                    delete payload.school_college_city
                    delete payload.school_college_state
                }
            }

            await api.patch('/api/user/profile/', payload)

            toast.success("Profile setup complete!")

            // Redirect based on role
            if (isHost) {
                navigate('/host/dashboard')
            } else {
                navigate('/')
            }
        } catch (err) {
            console.error(err)

            const msg = err.response?.data ? Object.values(err.response.data)[0] : "Failed to update profile"

            toast.error(Array.isArray(msg) ? msg[0] : msg)
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return <LoadingSpinner />

    const festiveGradient = "bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600"
    const getInputStyle = (fieldName) => `
        h-12 w-full bg-[#18181b] border border-zinc-800 rounded-xl px-4 py-3 text-sm font-medium text-white placeholder:text-zinc-700 focus:outline-none 
        transition-colors
        ${errors[fieldName]
            ? "border-red-500 focus:border-red-500 bg-red-500/5"
            : "border-zinc-800 focus:border-orange-500"
        }
    `

    const renderCollegeSelection = () => {

        return (

            <div className = "relative space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <label className = "text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">
                    Your School/College {isHost && !isExternalPromoter && <span className = 'text-orange-500'>*</span>}
                </label>

                <SearchableSelect
                    value = {{
                        id : formData.school_college_id,
                        name : formData.school_college_name
                    }}
                    onChange = {handleCollegeChange}
                    placeholder = "Search or add school/college..."
                    endpoint = '/api/data/colleges/'
                    hasError = {!!errors.school_college_name}
                />

                {errors.school_college_name && (
                    <p className = "text-[10px] text-red-500 mt-1 ml-1">
                        {errors.school_college_name}
                    </p>
                )}

                {!formData.school_college_id && formData.school_college_name && (
                    <div className = "grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 pt-2">
                        <p className = "col-span-2 text-xs text-orange-400 font-medium mb-1 flex items-center gap-1">
                            <AlertCircle className = "h-4 w-4" />

                            Unlisted college. Please provide details:
                        </p>

                        <div className = 'col-span-2'>
                            <input 
                                placeholder = "Campus (optional) e.g. Ring Road"
                                value = {formData.school_college_campus}
                                onChange = {(e) => handleChange('school_college_campus', e.target.value)}
                                className = {getInputStyle('school_college_campus')}
                            />
                        </div>

                        <div>
                            <input 
                                placeholder = 'City*'
                                value = {formData.school_college_city}
                                onChange = {(e) => handleChange('school_college_city', e.target.value)}
                                className = {getInputStyle('school_college_city')}
                            />

                            {errors.school_college_city && (
                                <p className = "text-[10px] text-red-500 mt-1 ml-1">
                                    {errors.school_college_city}
                                </p>
                            )}
                        </div>

                        <div>
                            <input 
                                placeholder = 'State*'
                                value = {formData.school_college_state}
                                onChange = {(e) => handleChange('school_college_state', e.target.value)}
                                className = {getInputStyle('school_college_state')}
                            />

                            {errors.school_college_state && (
                                <p className = "text-[10px] text-red-500 mt-1 ml-1">
                                    {errors.school_college_state}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                <p className = "text-[10px] text-zinc-600 ml-1 mt-2">
                    {isHost
                        ? "Allows you to host exclusive internal events for your campus."
                        : "Links you to exclusive campus events."
                    }
                </p>
            </div>
        
        )

    }

    return (

        <div className = "min-h-[100dvh] bg-[#09090b] text-white flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden selection:bg-pink-500 selection:text-white">
            {/* Background Texture */}
            <div 
                className = "fixed inset-0 opacity-[0.03] pointer-events-none z-0"
                style = {{
                    backgroundImage : "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
                    backgroundSize : "40px 40px"
                }}
            />

            {/* Ambient glow */}
            <div className = {`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 sm:h-96 w-64 sm:w-96 ${festiveGradient} blur-[100px] sm:blur-[120px] opacity-20 pointer-events-none rounded-full z-0`} />
            
            {!isHost && (
                <button
                    onClick = {handleSkip}
                    className = "absolute top-6 right-6 z-20 text-zinc-500 hover:text-white text-sm font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                >
                    Skip for now <ChevronRight className = "h-4 w-4" />
                </button>
            )}

            <div className = "w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-500">
                {/* Header */}
                <div className = "text-center mb-8 sm:mb-10">
                    <div className = "h-16 sm:h-20 w-16 sm:w-20 mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 shadow-xl ring-1 ring-white/5">
                        {isHost
                            ? <Building2 className = "h-8 sm:h-10 w-8 sm:w-10 text-orange-500" />
                            : <GraduationCap className = "h-8 sm:h-10 w-8 sm:w-10 text-blue-500" />
                        }
                    </div>

                    <h1 className = "text-2xl sm:text-3xl font-black uppercase tracking-tight mb-2">
                        Welcome, <span className = "text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400">{user?.first_name}!</span>
                    </h1>

                    <p className = "text-zinc-500 text-sm sm:text-base font-medium">
                        {isHost
                            ? "Please complete your host profile to continue."
                            : "Setup your profile to get the best experience."
                        }
                    </p>
                </div>

                <form
                    onSubmit = {handleSubmit}
                    className = "space-y-6 bg-[#18181b]/50 backdrop-blur-sm p-6 sm:p-8 rounded-3xl border border-zinc-800/50 shadow-2xl"
                >
                    <div className = 'space-y-2'>
                        {/* Phone Number */}
                        <label className = "text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1 flex justify-between">
                            Phone Number {isHost && <span className = 'text-orange-500'>*</span>}

                            {errors.phone_number && (
                                <span className = "text-red-500 flex items-center gap-1 normal-case">
                                    <AlertCircle className = "h-3 w-3" />

                                    Invalid
                                </span>
                            )}
                        </label>

                        <div className = "relative group">
                            <Phone className = "absolute left-4 top-3.5 h-4 w-4 text-zinc-600 group-focus-within:text-white transition-colors" />

                            <input
                                type = 'tel'
                                value = {formData.phone_number}
                                onChange = {(e) => handleChange('phone_number', e.target.value)}
                                placeholder = "+91 98765 43210"
                                className = {getInputStyle('phone_number') + " pl-10"}
                            />
                        </div>

                        {errors.phone_number && (
                            <p className = "text-[10px] text-red-500 ml-1">
                                {errors.phone_number}
                            </p>
                        )}
                    </div>
                    
                    {/* Host Specific */}
                    {isHost && (
                        <>
                            <div className = "space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <label className = "text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1 flex justify-between">
                                    Organisation Name <span className = 'text-orange-500'>*</span>
                                </label>

                                <div className = "relative group">
                                    <Building2 className = "absolute left-4 top-3.5 h-4 w-4 text-zinc-600 group-focus-within:text-white transition-colors" />

                                    <input 
                                        type = 'text'
                                        value = {formData.organisation_name}
                                        onChange = {(e) => handleChange('organisation_name', e.target.value)}
                                        placeholder = "e.g. Debate Society"
                                        className = {getInputStyle('organisation_name') + " pl-10"}
                                    />
                                </div>

                                {errors.organisation_name && (
                                    <p className = "text-[10px] text-red-500 ml-1">
                                        {errors.organisation_name}
                                    </p>
                                )}
                            </div>

                            <div className = "flex items-center justify-between p-4 bg-[#18181b] border border-zinc-800 rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-500 delay-75">
                                <div>
                                    <h3 className = "text-sm font-bold text-white">
                                        External Promoter
                                    </h3>

                                    <p className = "text-[10px] text-zinc-500">
                                        I am not affiliated with a specific school/college.
                                    </p>
                                </div>

                                <input
                                    type = 'checkbox'
                                    checked = {isExternalPromoter}
                                    onChange = {(e) => {
                                        setIsExternalPromoter(e.target.checked)

                                        if (e.target.checked) {
                                            setFormData(prev => ({
                                                ...prev, school_college_id : '', school_college_name : '', school_college_campus : '', school_college_city : '',
                                                school_college_state : ''
                                            }))

                                            setErrors(prev => ({
                                                ...prev, school_college_name : null, school_college_city : null, school_college_state : null
                                            }))
                                        }
                                    }}
                                    className = "h-5 w-5 rounded border border-zinc-700 bg-zinc-900 text-orange-500 focus:ring-orange-500 cursor-pointer accent-orange-500"
                                />
                            </div>

                            {!isExternalPromoter && renderCollegeSelection()}
                        </>
                    )}

                    {/* Student Specific */}
                    {!isHost && (
                        <>
                            {renderCollegeSelection()}

                            {/* Date Of Birth */}
                            <div className = "space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <label className = "text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1 flex justify-between">
                                    Date of Birth

                                    {errors.date_of_birth && (
                                        <span className = "text-red-500 flex items-center gap-1 normal-case">
                                            <AlertCircle className = "h-3 w-3" />

                                            Invalid
                                        </span>
                                    )}
                                </label>

                                <div className = "relative group">
                                    <Calendar className = "absolute left-4 top-3.5 h-4 w-4 text-zinc-600 group-focus-within:text-white transition-colors" />

                                    <input 
                                        type = 'date'
                                        value = {formData.date_of_birth}
                                        onChange = {(e) => handleChange('date_of_birth', e.target.value)}
                                        className = {getInputStyle('date_of_birth') + " pl-10 [color-scheme:dark]"}
                                    />
                                </div>

                                {errors.date_of_birth && (
                                    <p className = "text-[10px] text-red-500 ml-1">
                                        {errors.date_of_birth}
                                    </p>
                                )}

                                <p className = "text-[10px] text-zinc-600 ml-1">
                                    Used for age verification on restricted events.
                                </p>
                            </div>

                            <div className = "space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <label className = "text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">
                                    Student ID / USN (Optional)
                                </label>

                                <div className = "relative group">
                                    <GraduationCap className = "absolute left-4 top-3.5 h-4 w-4 text-zinc-600 group-focus-within:text-white transition-colors" />

                                    <input 
                                        type = 'text'
                                        value = {formData.student_id_number}
                                        onChange ={(e) => handleChange('student_id_number', e.target.value)}
                                        placeholder = "e.g. 1RV21CS001"
                                        className = {getInputStyle('student_id_number') + " pl-10"}
                                    />
                                </div>

                                <p className = "text-[10px] text-zinc-600 ml-1">
                                    Required by some hosts for campus-specific events.
                                </p>
                            </div>
                        </>
                    )}

                    <div className = 'pt-2'>
                        <button
                            type = 'submit'
                            disabled = {submitting}
                            className = {`
                                w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all duration-300
                                ${submitting
                                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                                    : "bg-white text-black hover:bg-zinc-200 shadow-lg"
                                }
                            `}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className = "h-4 w-4 animate-spin" />

                                    Saving...
                                </>
                            ) : (
                                <>
                                    Save & Continue
                                    
                                    <ArrowRight className = "h-4 w-4" /> 
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>

    )
    
}
