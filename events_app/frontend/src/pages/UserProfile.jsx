// UserProfile.jsx


import {useEffect, useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {Mail, Shield, Building2, LogOut, ArrowLeft, GraduationCap, Phone, Calendar, CheckCircle2, AlertTriangle, MapPin, User, Check, Edit2, Save, X} from 'lucide-react'
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
            } else {
                delete payload.organisation_name

                if (!payload.school_college_id && !payload.school_college_name) {
                    delete payload.school_college_id
                    delete payload.school_college_name
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
        if (selection.isNew) {
            setFormData(prev => ({
                ...prev,
                school_college_id : '',
                school_college_name : selection.name
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

    const isStudentData = !!userDetails.school_college
    const isHost = !isStudentData && (profile.role === 'host' || profile.role === 'student')

    const phone = userDetails.phone_number || "Not Provided"
    const dob = userDetails.date_of_birth || null
    const organisation = isStudentData
        ? userDetails.school_college
        : (isHost ? {name : userDetails.name || profile.first_name, logo : profile.profile_picture} : null)

    const festiveGradient = "bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600"
    const inputStyle = "bg-zinc-900 border-zinc-800 focus:border-orange-500 text-white"

    return (

        <div className = "min-h-[100dvh] bg-[#09090b] text-white p-4 sm:p-6 lg:p-12 font-sans relative overflow-x-hidden selection:bg-pink-500 selection:text-white pt-6 md:pt-12 pb-24">
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
                <div className = "flex items-center justify-between mb-6 md:mb-10">
                    <button
                        onClick = {() => navigate(-1)} // Go back to previous page
                        className = "group flex items-center text-zinc-500 hover:text-white transition-colors uppercase tracking-widest text-xs font-bold p-2 -ml-2"
                    >
                        <ArrowLeft className = "w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />

                        Back
                    </button>

                    <div className = "flex gap-2">
                        {/* Edit Button */}
                        {!isEditing && (
                            <button
                                onClick = {() => setIsEditing(true)}
                                className = "flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 transition-colors text-xs font-bold uppercase tracking-wider"
                            >
                                <Edit2 className = "h-4 w-4" />

                                Edit Profile
                            </button>
                        )}

                        <button
                            onClick = {handleLogout}
                            className = "flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition-colors text-xs font-bold uppercase tracking-wider active:scale-95"
                        >
                            <LogOut className = "h-4 w-4" />

                            <span className = "hidden sm:inline">
                                Sign Out
                            </span>
                        </button>
                    </div>
                </div>
                
                {/* Main grid layout */}
                <div className = "grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left side : Identity card */}
                    <div className = "lg:col-span-2 space-y-6">
                        {/* Identity card */}
                        <div className = "bg-[#18181b] border border-zinc-800 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
                            {/* Ambient glow */}
                            <div className = {`absolute top-0 right-0 h-64 w-64 ${festiveGradient} blur-[100px] opacity-20 pointer-events-none rounded-full transform translate-x-1/2 -translate-y-1/2`} />

                            <div className = "flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
                                {/* Avatar */}
                                <div className = "shrink-0 relative group">
                                    {profile.profile_picture ? (
                                        <img 
                                            src = {getImageUrl(profile.profile_picture)}
                                            alt = 'Profile'
                                            className = "h-24 sm:h-32 w-24 sm:w-32 rounded-full object-cover border-4 border-zinc-900 shadow-2xl"
                                        />
                                    ) : (
                                        <div className = {`h-24 sm:h-32 w-24 sm:w-32 rounded-full ${festiveGradient} flex items-center justify-center border-4 border-zinc-900 shadow-2xl`}>
                                            <span className = "text-3xl sm:text-4xl font-black text-white tracking-tighter">
                                                {getInitials()}
                                            </span>
                                        </div>
                                    )}

                                    <div className = "absolute bottom-1 right-1 bg-zinc-900 p-2 rounded-full border border-zinc-800 shadow-lg">
                                        {isHost
                                            ? <Shield className = "h-5 w-5 text-orange-500" />
                                            : <GraduationCap className = "h-5 w-5 text-blue-500" />
                                        }
                                    </div>
                                </div>

                                {/* Name & info */}
                                <div className = "text-center sm:text-left space-y-3 w-full">
                                    {isEditing ? (
                                        <div className = "grid grid-cols-2 gap-2 animate-in fad-in">
                                            <FormInput
                                                name = 'first_name'
                                                placeholder = "First Name"
                                                value = {formData.first_name}
                                                onChange = {handleChange}
                                                className = {inputStyle}
                                            />

                                            <FormInput 
                                                name = 'last_name'
                                                placeholder = "Last Name"
                                                value = {formData.last_name}
                                                onChange = {handleChange}
                                                className = {inputStyle}
                                            />
                                        </div>
                                    ) : (
                                        <div>
                                            <h1 className = "text-2xl sm:text-4xl font-black text-white tracking-tight leading-none mb-2">
                                                {profile.first_name} {profile.last_name}
                                            </h1>

                                            <div className = "flex flex-wrap justify-center sm:justify-start gap-2">
                                                <span className = {`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${isHost ? "bg-orange-500/10 text-orange-500 border-orange-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"}`}>
                                                    {isHost ? "Event Host" : "Student"}
                                                </span>

                                                {/* Verification Status */}
                                                {profile.is_email_verified ? (
                                                    <div className = "flex items-center gap-1.5 text-emerald-500 text-[10px] font-bold uppercase tracking-wide bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                                                        <CheckCircle2 className = "h-3 w-3" />

                                                        Verified
                                                    </div>
                                                ) : (
                                                    <div className = "flex items-center gap-1.5 text-yellow-500 text-[10px] font-bold uppercase tracking-wide bg-yellow=500/10 px-2 py-1 rounded-full border border-yellow-500/20">
                                                        <AlertTriangle className = "h-3 w-3" />

                                                        Unverified
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className = "flex items-center justify-center sm:justify-start gap-2 text-zinc-400 text-xs sm:text-sm bg-zinc-900/50 px-3 py-2 rounded-lg border border-zinc-800 w-fit mx-auto sm:mx-0">
                                        <Mail className = "h-4 w-4 text-zinc-500" />

                                        <span className = "truncate max-w-[200px] sm:max-w-xs">
                                            {profile.email}
                                        </span>

                                        {isEditing && (
                                            <span className = "text-[10px] text-zinc-600 ml-2">
                                                (Cannot change)
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Personal Details Grid */}
                        <div className = "grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Phone Card */}
                            <div className = "bg-[#18181b] border border-zinc-800 p-5 rounded-2xl flex items-center gap-4 hover:border-zinc-700 transition-colors group">
                                <div className = "h-12 w-12 rounded-xl bg-zinc-900 flex items-center justify-center group-hover:bg-zinc-800 transition-colors shrink-0">
                                    <Phone className = "h-5 w-5 text-zinc-400 group-hover:text-white" />
                                </div>

                                <div className = 'min-w-0'>
                                    <p className = "text-xs font-bold text-zinc-500 uppercase tracking-wider mb-0.5">
                                        Phone
                                    </p>
                                    
                                    {isEditing ? (
                                        <FormInput
                                            name = 'phone_number'
                                            value = {formData.phone_number}
                                            onChange = {handleChange}
                                            className = {inputStyle}
                                        />
                                    ) : (
                                        <p className = "text-sm font-medium text-white font-mono truncate">
                                            {phone}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* DOB Card */}
                            <div className = "bg-[#18181b] border border-zinc-800 hover:border-zinc-700 p-5 rounded-2xl flex items-center gap-4 transition-colors group">
                                <div className = "h-12 w-12 rounded-xl bg-zinc-900 flex items-center justify-center group-hover:bg-zinc-800 transition-colors shrink-0">
                                    <Calendar className = "h-5 w-5 text-zinc-400 group-hover:text-white" />
                                </div>

                                <div className = 'min-w-0'>
                                    <p className = "text-xs font-bold text-zinc-500 uppercase tracking-wider mb-0.5">
                                        Date of Birth
                                    </p>

                                    {isEditing ? (
                                        <FormInput 
                                            type = 'date'
                                            name = 'date_of_birth'
                                            value = {formData.date_of_birth}
                                            onChange = {handleChange}
                                            className = {`${inputStyle} [color-scheme:dark]`}
                                        />
                                    ) : (
                                        <p className = "text-sm font-medium text-white truncate">
                                            {formatDate(dob)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right column : Organisation / College info */}
                    <div className = "flex flex-col h-full">
                        <div className = "bg-[#18181b] border border-zinc-800 rounded-3xl p-6 h-full flex flex-col relative overflow-hidden group">
                            <div className = "flex items-center gap-2 mb-2">
                                <Building2 className = "h-4 w-4 text-zinc-500" />

                                <h2 className = "text-xs font-bold text-zinc-500 uppercase tracking-widest">
                                    {isHost ? 'Organisation' : 'Institution'}
                                </h2>
                            </div>
                            
                            {isEditing ? (
                                <div className = "flex flex-col gap-4 animate-in fade-in">
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
                                        <div className = 'space-y-2'>
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
                                    )}
                                </div>
                            ) : (
                                organisation ? (
                                    <div className = "flex flex-col items-center justify-center flex-1 text-center relative z-10">
                                        <div className = "absolute top-0 right-0 h-32 w-32 bg-zinc-800/20 blur-[50px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />

                                        <div className = "h-24 w-24 rounded-2xl bg-black border border-zinc-800 flex items-center justify-center mb-4 shadow-xl p-2">
                                            {organisation.logo ? (
                                                <img 
                                                    src = {getImageUrl(organisation.logo)}
                                                    alt = {organisation.name}
                                                    className = "h-full w-full object-cover rounded-xl"
                                                />
                                            ) : (
                                                <Building2 className = "h-10 w-10 text-zinc-700" />
                                            )}
                                        </div>

                                        <h3 className = "text-xl font-bold text-white mb-2 leading-tight max-w-[200px]">
                                            {organisation.name}
                                        </h3>

                                        {organisation.city && (
                                            <div className = "flex items-center gap-1 text-zinc-500 text-xs uppercase tracking-wide mt-2">
                                                <MapPin className = "h-3 w-3" />

                                                {organisation.city}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className = "flex flex-col flex-1 items-center justify-center text-center border-2 border-dashed border-zinc-800/50 rounded-2xl p-6">
                                        <p className = "text-zinc-500 text-sm font-medium">
                                            No institution linked
                                        </p>
                                    </div>
                                )
                            )}
                        </div>

                        {isEditing && (
                            <div className = "grid grid-cols-2 gap-3 animate-in slide-in-from-bottom-2">
                                <button
                                    onClick = {() => {
                                        setIsEditing(false) 
                                        initializeFormData(profile)
                                    }}
                                    disabled = {isSaving}
                                    className = {`py-3 rounded-xl text-white font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg ${festiveGradient}`}
                                >
                                    {isSaving
                                        ? <LoadingSpinner size = 'sm' />
                                        : 
                                            <>
                                                <Save className = "h-4 w-4" />

                                                Save Changes
                                            </>
                                    }
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

    )
}
