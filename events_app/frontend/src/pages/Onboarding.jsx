// Onboarding.jsx


import {useState, useEffect} from 'react'
import {useNavigate} from 'react-router-dom'
import {ArrowRight, Building2, Phone, GraduationCap, Loader2, Calendar, Search, MapPin, X} from 'lucide-react'
import {toast} from 'react-hot-toast'

import api from '../api/api'

import LoadingSpinner from '../components/common/LoadingSpinner'
import SearchableSelect from '../components/common/SearchableSelect'


export default function Onboarding() {

    const navigate = useNavigate()
    // const dropdownRef = useRef(null)

    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    const [formData, setFormData] = useState({
        phone_number : '',
        date_of_birth : '',
        organisation_name : '',
        school_college_id : '',
        school_college_name : '',
        school_college_city : '',
        school_college_state : '',
    })

    const [colleges, setColleges] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [isSearching, setIsSearching] = useState(false)
    const [showDropdown, setShowDropdown] = useState(false)

    // Fetch user profile
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await api.get('/api/user/profile/')

                setUser(response.data)

                // Pre-fill existing data, if any
                setFormData(prev => ({
                    ...prev,
                    phone_number : response.data.phone_number || '',
                    date_of_birth : response.data.date_of_birth || '',
                    organisation_name : response.data.role === 'host' ? response.data.name : '',
                    school_college_id : response.data.school_college?.id || '',
                    school_college_name : response.data.school_college?.name || ''
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

    const handleCollegeChange = (selection) => {
        if (selection.isNew) {
            setFormData(prev => ({
                ...prev,
                school_college_id : '',
                school_college_name : selection.name,
            }))
        } else {
            setFormData(prev => ({
                ...prev,
                school_college_id : selection.id,
                school_college_name : selection.name,
                school_college_city : '',
                school_college_state : ''
            }))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        setSubmitting(true)

        try {
            // Clean data before sending
            const payload = {...formData}

            if (user.role === 'host') {
                delete payload.date_of_birth
                delete payload.school_college_id
                delete payload.school_college_name
                delete payload.school_college_city
                delete payload.school_college_state
            } else {
                delete payload.organisation_name

                if (!payload.school_college_id && !payload.school_college_name) {
                    if (!payload.school_college_city || !payload.school_college_state) {
                        toast.error("Please provide City & State for the new school/college.")

                        setSubmitting(false)

                        return
                    } else if (!payload.school_college_id) {
                        toast.error("Please select a valid college.")

                        setSubmitting(false)

                        return
                    }
                }
            }

            await api.patch('/api/user/profile/', payload)

            toast.success("Profile setup complete!")

            // Redirect based on role
            if (user.role === 'host') {
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

    const isHost = user?.role === 'host' || user?.role === 'organisation'
    const festiveGradient = "bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600"
    const inputStyle = "h-12 w-full bg-[#18181b] border border-zinc-800 rounded-xl px-4 py-3 text-sm font-medium text-white placeholder:text-zinc-700 focus:outline-none focus:border-orange-500 transition-colors"

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

                    <p className = "text-zinc-500 text-sm sm:text-base font-medium max-w-[280px] sm:max-w-none mx-auto">
                        Let's finish setting up your <span className = {isHost ? 'text-orange-500' : 'text-blue-500'}>{isHost ? 'Host' : 'Student'}</span> profile.
                    </p>
                </div>

                <form
                    onSubmit = {handleSubmit}
                    className = "space-y-6 sm:space-y-8 bg-[#18181b]/50 backdrop-blur-sm p-4 sm:p-8 rounded-3xl border border-zinc-800/50 shadow-2xl"
                >
                    <div className = 'space-y-2'>
                        {/* Phone Number */}
                        <label className = "text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">
                            Phone Number
                        </label>

                        <div className = "relative group focus-within:ring-2 focus-within:ring-orange-500/20 rounded-xl transition-all">
                            <Phone className = "absolute left-4 top-3.5 h-4 w-4 text-zinc-600 group-focus-within:text-white transition-colors" />

                            <input
                                type = 'tel'
                                required
                                value = {formData.phone_number}
                                onChange = {(e) => setFormData({...formData, phone_number : e.target.value})}
                                placeholder = "+91 98765 43210"
                                className = "h-12 w-full bg-[#18181b] border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-white placeholder:text-zinc-700 focus:outline-none focus:border-orange-500 transition-colors"
                            />
                        </div>
                    </div>
                    
                    {/* Host Specific */}
                    {isHost && (
                        <div className = "space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <label className = "text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">
                                Organisation Name
                            </label>

                            <div className = "relative group focus-within:ring-2 focus-within:ring-orange-500/20 rounded-xl transition-all">
                                <Building2 className = "absolute left-4 top-3.5 h-4 w-4 text-zinc-600 group-focus-within:text-white transition-colors" />

                                <input 
                                    type = 'text'
                                    required
                                    value = {formData.organisation_name}
                                    onChange = {(e) => setFormData({...formData, organisation_name : e.target.value})}
                                    placeholder = "e.g. Debate Society"
                                    className = "h-12 w-full bg-[#09090b] border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-white placeholder:text-zinc-700 focus:outline-none focus:border-orange-500 transition-colors"
                                />
                            </div>
                        </div>
                    )}

                    {/* Student Specific */}
                    {!isHost && (
                        <>
                            <div className = "relative space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <label className = "text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">
                                    Your School/College
                                </label>

                                <SearchableSelect 
                                    value = {{
                                        id : formData.school_college_id,
                                        name : formData.school_college_name
                                    }}
                                    onChange = {handleCollegeChange}
                                    placeholder = "Search your college..."
                                    endpoint = '/api/data/colleges/'
                                />

                                {!formData.school_college_id && formData.school_college_name && (
                                    <div className = "grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 pt-2">
                                        <div>
                                            <input 
                                                placeholder = "City (Required)"
                                                value = {formData.school_college_city}
                                                onChange = {(e) => setFormData({...formData, school_college_city : e.target.value})}
                                                className = {inputStyle}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <input
                                                placeholder = "State (Required)"
                                                value = {formData.school_college_state}
                                                onChange = {(e) => setFormData({...formData, school_college_state : e.target.value})}
                                                className = {inputStyle}
                                                required
                                            />
                                        </div>

                                        <div className = 'col-span-2'>
                                            <p className = "text-[10px] text-orange-400 flex items-center gap-1">
                                                <MapPin className = "h-3 w-3" />

                                                New college detected. Please add location details.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <p className = "text-[10px] text-zinc-600 ml-1">
                                    Links you to exclusive campus events.
                                </p>
                            </div>

                            {/* Date Of Birth */}
                            <div className = "space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <label className = "text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">
                                    Date of Birth
                                </label>

                                <div className = "relative group focus-within:ring-2 focus-within:ring-orange-500/20 rounded-xl transition-all">
                                    <Calendar className = "absolute left-4 top-3.5 h-4 w-4 text-zinc-600 group-focus-within:text-white transition-colors" />

                                    <input 
                                        type = 'date'
                                        required
                                        value = {formData.date_of_birth}
                                        onChange = {(e) => setFormData({...formData, date_of_birth : e.target.value})}
                                        className = "h-12 w-full bg-[#09090b] border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-white placeholder:text-zinc-700 focus:outline-none focus:border-orange-500 transition-colors [color-scheme:dark]"
                                    />
                                </div>

                                <p className = "text-[10px] text-zinc-600 ml-1">
                                    Used for age verification on restricted events.
                                </p>
                            </div>
                        </>
                    )}

                    <div className = 'pt-2'>
                        <button
                            type = 'submit'
                            disabled = {submitting}
                            className = {`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
                                submitting
                                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                                    : "bg-white text-black hover:bg-zinc-200 active:scale-95 shadow-lg shadow-white/10"
                            }`}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className = "h-4 w-4 animate-spin" />

                                    Saving...
                                </>
                            ) : (
                                <>
                                    Complete Setup 
                                    
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
