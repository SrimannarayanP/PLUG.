// UserProfile.jsx


import {useEffect, useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {Mail, Shield, Building2, LogOut, ArrowLeft, GraduationCap, Phone, Calendar, CheckCircle2, AlertTriangle, MapPin, Edit2, Save, X, User, Check} from 'lucide-react'
import {toast} from 'react-hot-toast'

import api from '../api/api'

import {getImageUrl} from '../utils/imageHelper'

import LoadingSpinner from '../components/common/LoadingSpinner'
import FormInput from '../components/common/FormInput'
import SearchableSelect from '../components/common/SearchableSelect'


export default function UserProfile() {

    const navigate = useNavigate()

    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [formData, setFormData] = useState([])

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        try {
            const response = await api.get('/api/user/profile/')

            setProfile(response.data)
            initializeFormData(response.data) // Pre-fill form
        } catch (err) {
            console.error("Failed to load profile", err)

            toast.error("Could not load profile data")
        } finally {
            setLoading(false)
        }
    }

    const initializeFormData = (data) => {
        const details = data.profile || {}

        setFormData({
            first_name : data.first_name || '',
            last_name : data.last_name || '',
            phone_number : details.phone_number || '',
            date_of_birth : details.date_of_birth || '',
            student_id_number : details.student_id_number || '',
            organisation_name : data.role === 'host' ? (details.name || data.first_name) : '',

            school_college_id : details.school_college?.id || '',
            school_college_name : details.school_college?.name || '',
            school_college_city : '',
            school_college_state : ''
        })
    }


    const handleLogout = () => {
        localStorage.clear()

        toast.success("Logged out successfully")
        
        navigate('/login')
    }

    const handleSave = async () => {
        setIsSaving(true)

        try {
            const payload = {...formData}

            if (profile.role === 'host') {
                delete payload.school_college_id
                delete payload.school_college_name
                delete payload.school_college_city
                delete payload.school_college_state
            } else {
                delete payload.organisation_name

                if (payload.school_college_id) {
                    delete payload.school_college_name
                    delete payload.school_college_city
                    delete payload.school_college_state
                } else if (payload.school_college_name) {
                    if (!payload.school_college_city || !payload.school_college_state) {
                        toast.error("City & State are required for new schools/colleges.")

                        setIsSaving(false)

                        return
                    }
                } else {
                    delete payload.school_college_id
                    delete payload.school_college_name
                    delete payload.school_college_city
                    delete payload.school_college_state
                }
            }

            const response = await api.patch('/api/user/profile/', payload)

            setProfile(response.data)
            initializeFormData(response.data)
            setIsEditing(false)
            
            toast.success("Profile updated successfully!")
        } catch (err) {
            console.error(err)

            toast.error("Failed to update profile.")
        } finally {
            setIsSaving(false)
        }
    }

    const handleChange = (e) => {
        setFormData(prev => ({...prev, [e.target.name] : e.target.value}))
    }

    const handleCollegeChange = (selection) => {
        if (!selection) {
            setFormData(prev => ({
                ...prev,
                school_college_id : '',
                school_college_name : '',
                school_college_city : '',
                school_college_state : ''
            }))

            return
        }

        if (selection.isNew) {
            setFormData(prev => ({
                ...prev,
                school_college_id : '',
                school_college_name : selection.name,
                school_college_city : '',
                school_college_state : ''
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

    const getInitials = () => {
        const first_name = profile.first_name ? profile.first_name[0] : ''
        const last_name = profile.last_name ? profile.last_name[0] : ''
        
        return (first_name + last_name).toUpperCase() || 'U'
    }

    const formatDate = (dateString) => {
        if (!dateString) return "Not Provided"

        return new Date(dateString).toLocaleDateString('en-US', {
            year : 'numeric',
            month : 'long',
            day : 'numeric'
        })
    }

    if (loading) return <LoadingSpinner />

    if (!profile) return null

    const userDetails = profile.profile || {}

    const isStudent = profile.role === 'student'
    const isHost = profile.role === 'host'

    const phone = userDetails.phone_number || "Not Provided"
    const dob = userDetails.date_of_birth || null
    const organisation = isStudent
        ? userDetails.school_college
        : (isHost ? {name : userDetails.name || profile.first_name, logo : profile.profile_picture} : null)

    const festiveGradient = "bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600"
    const inputStyle = "bg-zinc-900 border-zinc-800 focus:border-orange-500 text-white"

    const isCreatingNewCollege = !formData.school_college_id && formData.school_college_name.length > 0

    return (

        <div className = "min-h-screen bg-[#09090b] text-white p-4 sm:p-6 lg:p-8 font-sans relative overflow-x-hidden selection:bg-pink-500 selection:text-white pb-24">
            {/* Background Texture */}
            <div 
                className = "fixed inset-0 opacity-[0.03] pointer-events-none z-0"
                style = {{
                    backgroundImage : "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
                    backgroundSize : "40px 40px"
                }}
            />

            <div className = "max-w-5xl mx-auto relative z-10">
                {/* Header/Nav */}
                <div className = "flex items-center justify-between mb-8 sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-md py-4 -mx-4 sm:mx-0 px-4 sm:px-0">
                    <button
                        onClick = {() => navigate(-1)} // Go back to previous page
                        className = "group flex items-center text-zinc-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest"
                    >
                        <ArrowLeft className = "w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />

                        Back
                    </button>

                    <div className = "flex gap-3">
                        {/* Edit Button */}
                        {!isEditing ? (
                            <button
                                onClick = {() => setIsEditing(true)}
                                className = "flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 transition-all text-xs font-bold uppercase tracking-wider"
                            >
                                <Edit2 className = "h-4 w-4" />

                                <span className = "hidden sm:inline">
                                    Edit Profile
                                </span>
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick = {() => {
                                        setIsEditing(false)
                                        initializeFormData(profile)
                                    }}
                                    disabled = {isSaving}
                                    className = "flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800 transition-all text-xs font-bold uppercase tracking-wider"
                                >
                                    <X className = "h-3.5 w-3.5" />

                                    Cancel
                                </button>

                                <button
                                    onClick = {handleSave}
                                    disabled = {isSaving}
                                    className = {`flex items-center gap-2 px-4 py-2 rounded-xl text-white font-bold uppercase tracking-wider text-xs shadow-lg ${festiveGradient}`}
                                >
                                    {isSaving
                                        ? <LoadingSpinner size = 'sm' />
                                        : <><Save className = "h-3.5 w-3.5" /> Save</>
                                    }
                                </button>
                            </>
                        )}

                        <button
                            onClick = {handleLogout}
                            className = "p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition-colors"
                        >
                            <LogOut className = "h-5 w-5" />
                        </button>
                    </div>
                </div>
                
                {/* Main grid layout */}
                <div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Left side : Identity card */}
                    <div className = "md:col-span-2 relative overflow-hidden bg-[#18181b] border border-zinc-800 rounded-3xl p-6 md:p-10 shadow-2xl flex flex-col md:flex-row items-center md:items-start gap-8">
                        {/* Ambient glow */}
                        <div className = {`absolute top-0 right-0 h-64 w-64 ${festiveGradient} blur-[120px] opacity-15 pointer-events-none rounded-full transform translate-x-1/3 -translate-y-1/3`} />

                        <div className = "relative shrink-0">
                            {/* Avatar */}
                            <div className = "h-32 w-32 md:h-40 md:w-40 rounded-full p-1 bg-gradient-to-br from-zinc-800 to-zinc-950 shadow-2xl relative z-10">
                                {profile.profile_picture ? (
                                    <img 
                                        src = {getImageUrl(profile.profile_picture)}
                                        alt = 'Profile'
                                        className = "h-full w-full rounded-full object-cover border-4 border-[#18181b]"
                                    />
                                ) : (
                                    <div className = {`h-full w-full rounded-full ${festiveGradient} flex items-center justify-center border-4 border-[#18181b]`}>
                                        <span className = "text-5xl font-black text-white">
                                            {getInitials()}
                                        </span>
                                    </div>
                                )}

                                <div className = "absolute bottom-2 right-2 z-20 bg-zinc-900 p-2 rounded-full border border-zinc-800 shadow-lg text-white">
                                    {isHost
                                        ? <Shield className = "h-5 w-5 text-orange-500" />
                                        : <GraduationCap className = "h-5 w-5 text-blue-500" />
                                    }
                                </div>
                            </div>
                        </div>

                        {/* Name & info */}
                        <div className = "flex-1 text-center md:text-left space-y-4 w-full relative z-10">
                            {isEditing ? (
                                <div className = "grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in">
                                    <div>
                                        <label className = "text-[10px] uppercase font-bold text-zinc-500 mb-1 block ml-1">
                                            First Name
                                        </label>

                                        <FormInput 
                                            name = 'first_name' 
                                            value = {formData.first_name} 
                                            onChange = {handleChange} 
                                            className = {inputStyle} 
                                        />
                                    </div>

                                    <div>
                                        <label className = "text-[10px] uppercase font-bold text-zinc-500 mb-1 block ml-1">
                                            Last Name
                                        </label>
                                        
                                        <FormInput 
                                            name = 'last_name' 
                                            value = {formData.last_name} 
                                            onChange = {handleChange} 
                                            className = {inputStyle}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <h1 className = "text-3xl md:text-5xl font-black text-white tracking-tight mb-3">
                                        {profile.first_name} {profile.last_name}
                                    </h1>
                                    
                                    <div className = "flex flex-wrap items-center justify-center md:justify-start gap-3">
                                        <span 
                                            className={`
                                                px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border 
                                                ${isHost 
                                                    ? "bg-orange-500/10 text-orange-500 border-orange-500/20" 
                                                    : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                                }
                                            `}
                                        >
                                            {isHost ? "Event Host" : 'Student'}
                                        </span>

                                        <div 
                                            className = {`
                                                flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border 
                                                ${profile.is_email_verified 
                                                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                                                    : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                                                }
                                            `}
                                        >
                                            {profile.is_email_verified ? (
                                                <>
                                                    <CheckCircle2 className="h-3 w-3" /> 
                                                    
                                                    Verified
                                                </>
                                            ) : (
                                                <>
                                                    <AlertTriangle className="h-3 w-3" /> 
                                                    
                                                    Unverified
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className = "inline-flex items-center gap-2 px-4 py-2 bg-zinc-900/50 rounded-xl border border-zinc-800 text-zinc-400 text-sm">
                                <Mail className = "h-4 w-4" />

                                <span className = 'truncate'>
                                    {profile.email}
                                </span>
                            </div>
                        </div>
                    </div>
                        
                    {/* Personal Details Grid */}
                    <div className = "bg-[#18181b] border border-zinc-800 rounded-3xl p-6 md:p-8 flex flex-col justify-center space-y-6">
                        <div className = "flex items-center gap-3 text-zinc-500 mb-2">
                            <User className = "h-5 w-5" />

                            <h3 className = "text-xs font-bold uppercase tracking-widest">
                                Personal Details
                            </h3>
                        </div>
                        
                        {/* Phone */}
                        <div className = 'space-y-1'>
                            <label className = "text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-2">
                                <Phone className = "h-3 w-3" />

                                Phone Number
                            </label>

                            {isEditing ? (
                                <FormInput 
                                    name = 'phone_number'
                                    value = {formData.phone_number}
                                    onChange = {handleChange}
                                    className = {inputStyle}
                                    placeholder = "+91..."
                                />
                            ) : (
                                <p className = "text-lg font-medium text-white font-mono">
                                    {phone}
                                </p>
                            )}
                        </div>

                        {/* DOB */}
                        {isStudent && (
                            <div className = 'space-y-1'>
                                <label className = "text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-2">
                                    <Calendar className = "h-3 w-3" />

                                    Date of Birth
                                </label>

                                {isEditing ? (
                                    <FormInput 
                                        type = 'date'
                                        name = 'date_of_birth'
                                        value = {formData.date_of_birth}
                                        onChange = {handleChange}
                                        className = {`${inputStyle} [color-scheme:dark]`}
                                    />
                                ) : (
                                    <p className = "text-lg font-medium text-white">
                                        {formatDate(dob)}
                                    </p>
                                )}
                            </div>
                        )}

                        {isStudent && (
                            <div className = 'space-y-1'>
                                <label className = "text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-2">
                                    <Shield className = "h-3 w-3" />

                                    Student ID/USN
                                </label>

                                {isEditing ? (
                                    <FormInput 
                                        name = 'student_id_number'
                                        value = {formData.student_id_number}
                                        onChange = {handleChange}
                                        className = {inputStyle}
                                        placeholder = "Enter your Student ID or USN"
                                    />
                                ) : (
                                    <p className = "text-lg font-medium text-white font-mono">
                                        {userDetails.student_id_number || "Not Provided"}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                        
                    {/* Right column : Organisation / College info */}
                    <div className = "md:col-span-2 lg:col-span-3 bg-[#18181b] border border-zinc-800 rounded-3xl p-6 md:p-8 relative overflow-hidden group">
                        <div className = "absolute top-0 right-0 p-32 bg-zinc-800/20 blur-[80px] rounded-full pointer-events-none" />

                        <div className = "flex items-center gap-3 text-zinc-500 mb-6 relative z-10">
                            <Building2 className = "h-5 w-5" />

                            <h3 className = "text-xs font-bold uppercase tracking-widest">
                                {isHost ? 'Organisation' : 'Institution'}
                            </h3>
                        </div>
                        
                        <div className = "relative z-10">
                            {isEditing ? (
                                <div className = "max-w-xl space-y-6 animate-in fade-in">
                                    {isHost ? (
                                        <div>
                                            <label className = "text-[10px] uppercase font-bold text-zinc-500 mb-1 block">
                                                Organisation Name
                                            </label>

                                            <FormInput 
                                                name = 'organisation_name'
                                                value = {formData.organisation_name}
                                                onChange = {handleChange}
                                                className = {inputStyle}
                                            />
                                        </div>
                                    ) : (
                                        <div className = 'space-y-4'>
                                            <div>
                                                <label className = "text-[10px] uppercase font-bold text-zinc-500 mb-1 block">
                                                    Search School/College
                                                </label>

                                                <SearchableSelect 
                                                    value = {{
                                                        id : formData.school_college_id, 
                                                        name : formData.school_college_name
                                                    }}
                                                    onChange = {handleCollegeChange}
                                                    endpoint = '/api/data/colleges/'
                                                />
                                            </div>

                                            {isCreatingNewCollege && (
                                                <div className = "p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 animate-in slide-in-from-top-2">
                                                    <div className = "flex items-center gap-2 text-orange-400 text-xs font-bold uppercase tracking-wider mb-3">
                                                        <AlertTriangle className = "h-3 w-3" />

                                                        Adding New Institution
                                                    </div>

                                                    <div className = "grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <FormInput 
                                                            name = 'school_college_city'
                                                            placeholder = 'City'
                                                            value = {formData.school_college_city}
                                                            onChange = {handleChange}
                                                            className = {inputStyle}
                                                        />

                                                        <FormInput 
                                                            name = 'school_college_state'
                                                            placeholder = 'State'
                                                            value = {formData.school_college_state}
                                                            onChange = {handleChange}
                                                            className = {inputStyle}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className = "flex items-start gap-6">
                                    <div className = "h-20 w-20 rounded-2xl bg-black border border-zinc-800 flex items-center justify-center shadow-lg shrink-0">
                                        {organisation?.logo ? (
                                            <img 
                                                src = {getImageUrl(organisation.logo)}
                                                alt = {organisation.name}
                                                className = "h-full w-full object-cover rounded-xl"
                                            />
                                        ) : (
                                            <Building2 className = "h-8 w-8 text-zinc-700" />
                                        )}
                                    </div>

                                    <div className = 'pt-2'>                 
                                        {organisation ? (
                                            <>
                                                <h2 className = "text-2xl font-bold text-white mb-1">
                                                    {organisation.name}
                                                </h2>

                                                {organisation.city && (
                                                    <div className = "flex items-center gap-1.5 text-zinc-500 text-sm font-medium">
                                                        <MapPin className = "h-3.5 w-3.5" />

                                                        {organisation.city}
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <p className = "text-zinc-500 italic">
                                                No institution details added yet.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>

    )
    
}
