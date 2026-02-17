// LoginSignup.jsx


import {useState} from 'react'
import {useNavigate, Link} from 'react-router-dom'
import {ArrowRight, Check, Loader2} from 'lucide-react'
import {toast} from 'react-hot-toast'

import FormInput from '../components/common/FormInput'
import BackgroundPaths from '../components/ui/BackgroundPaths'
import SolidAnimatedButton from '../components/ui/SolidAnimatedButton'

import api from '../api/api'

import {ACCESS_TOKEN, REFRESH_TOKEN} from '../constants'


export default function LoginSignup() {

    const [isLogin, setIsLogin] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const [formData, setFormData] = useState({
        first_name : '',
        last_name : '',
        email : '',
        password : '',
        confirmPassword : '',
        role : 'student', // Default
    })

    const navigate = useNavigate()

    const handleChange = (e) => {
        const {name, value} = e.target

        setFormData(prev => ({...prev, [name] : value}))

        if (error) setError('')
    }

    const handleRoleChange = (role) => {
        setFormData(prev => ({...prev, role : role}))
    }

    const handleToggle = () => {
        setIsLogin()
        // Reset form but keep role preference if selected
        setFormData(prev => ({
            first_name : '',
            last_name : '',
            email : '', 
            password : '', 
            confirmPassword : '',
            role : prev.role,
        }))
        setError('')
    }

    
    const handleError = (error, action) => {
        console.group(`${action} failed`)

        if (error.response) {
            console.error("Status:", error.response.status)
            console.error("Headers:", error.response.headers)
            console.error("Data:", error.response.data)

            const data = error.response.data

            let message = "Something went wrong."
            
            if (data.detail) {
                message = data.detail
            } else if (typeof data === 'object') {
                const firstKey = Object.keys(resData)[0]
                const firstError = resData[firstKey]

                message = Array.isArray(firstError) ? `${firstKey} : ${firstError[0]}` : firstError
            }

            toast.error(message)
        } else if (error.request) {
            console.error("No response received: ", error.request)
            
            toast.error("Network error. Cannot connect to server.")
        } else {
            console.error("Request setup error : ", error.message)

            toast.error("Client error : " + error.message)
        }

        console.groupEnd()
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        setIsLoading(true)
        setError('')

        // Validation Logic
        if (!formData.email || !formData.password) {
            setError("Email & password are required")
            setIsLoading(false)

            return
        }

        if (!isLogin) {
            if (formData.password !== formData.confirmPassword) {
                setError("Passwords don't match")
                setIsLoading(false)

                return
            }

            if (!formData.first_name || !formData.last_name) {
                setError("Name is required for registration")
                setIsLoading(false)

                return
            }
        }

        // API Endpoint Selection
        const endpoint = isLogin ? '/api/auth/login/' : '/api/auth/signup/'
    
        // Payload Construction
        let payload = {
            email : formData.email,
            password : formData.password,
        }

        if (!isLogin) {
            payload = {
                ...payload,
                first_name : formData.first_name,
                last_name : formData.last_name,
                role : formData.role,
            }
        }

        try {
            const response = await api.post(endpoint, payload)

            if (response.status === 200 || response.status === 201) {
                // Store tokens
                localStorage.setItem(ACCESS_TOKEN, response.data.access)
                localStorage.setItem(REFRESH_TOKEN, response.data.refresh)

                // Clear form
                setFormData({
                    first_name : '',
                    last_name : '', 
                    email : '', 
                    password : '', 
                    confirmPassword : '',
                    role : 'student',
                })

                // If it's a signup, always redirect the user to onboarding
                if (!isLogin) {
                    navigate('/verify-email')
                    
                    return
                }

                // If login, check if the profile is complete
                const user = response.data.user
                
                if (!user.is_email_verified) {
                    navigate('/verify-email')

                    return
                }
                if (!user.is_profile_complete) {
                    navigate('/onboarding')
                } else {
                    user.role === 'host' ? navigate('/host/dashboard') : navigate('/')
                }
            }
        } catch (error) {
            handleError(error, isLogin ? 'Login' : 'Signup')
        } finally {
            setIsLoading(false)
        }
        
    }

    const festiveGradient = "bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600"

    return (

        <main className = "relative w-full min-h-[100dvh] font-sans text-white bg-[#09090b] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto selection:bg-pink-500 selection:text-white">
            {/* Background wrapper */}
            <div 
                className = "absolute inset-0 opacity-[0.03] pointer-events-none z-0"
                style = {{
                    backgroundImage : "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
                    backgroundSize : "40px 40px"
                }}
            />

            {/* Background wrapper for BackgroundPaths */}
            <div className = "fixed inset-0 opacity-30 pointer-events-none mix-blend-screen z-0">
                <BackgroundPaths />
            </div>
                
            <div className = "relative z-10 w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                {/* Left side : Logo & tagline */}
                <div className = "flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 md:space-y-8 pt-8 lg:pt-0 order-1 lg:order-none">
                    <div className = "relative group">
                        <div className = {`absolute -inset-10 blur-3xl -z-10 rounded-full opacity-40 transition-opacity duration-1000 group-hover:opacity-60 ${festiveGradient}`} />

                        <div className = "flex flex-col items-center lg:items-start relative z-10">
                            {/* Logo Box */}
                            <div className = "h-20 sm:h-28 md:h-32 w-20 sm:w-28 md:w-32 relative mb-4">
                                <div className = "absolute inset-0 bg-[#09090b] border-4 border-zinc-800 rounded-2xl transform -skew-x-12 overflow-hidden shadow-2xl">
                                    {/* Inner gradient core */}
                                    <div className = {`absolute inset-0 opacity-90 ${festiveGradient}`} />

                                    {/* P shape overlay */}
                                    <div 
                                        className = "absolute inset-0 bg-[#09090b]"
                                        style = {{clipPath : "polygon(35% 20%, 85% 20%, 85% 55%, 35% 55%, 35% 80%, 15% 80%, 15% 20%)"}}    
                                    />

                                    {/* bl - bottom left */}
                                    <div className = "absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-white/20 to-transparent pointer-events-none" />
                                </div>
                            </div>

                            <h1 className = "text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-white uppercase tracking-tighter leading-none drop-shadow-2xl">
                                PLUG

                                {/* Festive gradient in the period */}
                                <span className = {`text-transparent bg-clip-text ${festiveGradient}`}>.</span>
                            </h1>
                        </div>
                    </div>

                    <p className = "text-lg sm:text-xl lg:text-3xl text-zinc-300 max-w-md font-light tracking-wide leading-relaxed">
                        Campus events. <br />

                        <span className = {`text-transparent font-black bg-clip-text ${festiveGradient} text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tighter`}>
                            Redefined.
                        </span>
                    </p>
                </div>

                {/* Right side : Login/Signup form */}
                <div className = "w-full max-w-md mx-auto order-2 lg:order-none pb-8 lg:pb-0">
                    <div className = "relative w-full max-w-md min-h-[580px] sm:min-h-[600px] bg-[#18181b]/90 backdrop-blur-xl border border-zinc-800/50 rounded-3xl shadow-2xl overflow-hidden ring-1 ring-white/5">
                        {error && (
                            <div className = "absolute top-0 left-0 right-0 p-3 bg-red-950/90 border-b border-red-500/20 backdrop-blur-md text-center animate-in slide-in-from-top z-50">
                                <p className = "text-xs sm:text-sm font-bold text-red-400 flex items-center justify-center gap-2">
                                    <span className = "h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                    
                                    {error}
                                </p>
                            </div>
                        )}
                            
                        <div className = "absolute inset-0">
                        {/* Login form */}
                            <div className = {`absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.23, 1, 0.32, 1)] ${isLogin ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"}`}>
                                <form 
                                    className = "p-6 sm:p-8 h-full flex flex-col justify-center gap-6" 
                                    onSubmit = {handleSubmit} 
                                    noValidate
                                >
                                    <div className = "text-center space-y-1">
                                        <h2 className = "text-2xl sm:text-3xl font-bold text-white tracking-tighter uppercase">
                                            Welcome Back
                                        </h2>

                                        <p className = "text-zinc-400 text-sm font-medium">
                                            Sign in to continue
                                        </p>
                                    </div>

                                    <div className = 'space-y-5'>
                                        <FormInput 
                                            id = 'login-email' 
                                            name = 'email' 
                                            type = 'email' 
                                            placeholder = "Email Address" 
                                            value = {formData.email} 
                                            onChange = {handleChange} 
                                        />
                                        <div className = 'space-y-2'>
                                            <FormInput 
                                                id = 'login-password' 
                                                name = 'password' 
                                                type = 'password' 
                                                placeholder = 'Password' 
                                                value = {formData.password} 
                                                onChange = {handleChange} 
                                            />

                                            {/* Forgot Password link */}
                                            <div className = "flex justify-end">
                                                <Link 
                                                    to = '/request-password'
                                                    className = "text-xs font-bold text-zinc-500 hover:text-pink-500 transition-colors uppercase tracking-widest py-1"
                                                >
                                                    Forgot Password?
                                                </Link>
                                            </div>
                                        </div>
                                    </div>

                                    <div className = "pt-2 space-y-6">
                                        <SolidAnimatedButton 
                                            disabled = {isLoading}
                                            className = "w-full py-3.5"
                                        >
                                            {isLoading 
                                                ? <Loader2 className = "h-5 w-5 animate-spin mx-auto" /> 
                                                : "Log In"
                                            }
                                        </SolidAnimatedButton>

                                        <p className = "text-center text-zinc-500 text-sm">
                                            New here?

                                            <button
                                                type = 'button'
                                                onClick = {handleToggle}
                                                className = "font-bold text-white hover:text-pink-500 ml-2 transition-colors inline-flex items-center gap-1 group"
                                            >
                                                Create Account

                                                <ArrowRight className = "h-3 w-3 group-hover:translate-x-1 transition-transform text-pink-500" />
                                            </button>
                                        </p>
                                    </div>
                                </form>
                            </div>

                            {/* Signup form */}
                            <div className = {`absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.23, 1, 0.32, 1)] ${!isLogin ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"}`}>
                                <form 
                                    className = "p-6 sm:p-8 h-full overflow-y-auto custom-scrollbar flex flex-col" 
                                    onSubmit = {handleSubmit} 
                                    noValidate
                                >
                                    <div className = "flex-shrink-0 text-center mb-6 pt-2">
                                        <h2 className = "text-2xl sm:text-3xl font-black text-white uppercase tracking-tighter">
                                            Join PLUG.
                                        </h2>

                                        <p className = "text-center text-zinc-400 text-sm mt-1">
                                            Already have an account?

                                            <button 
                                                type = 'button' 
                                                onClick = {handleToggle} 
                                                className = "font-bold text-white hover:text-pink-500 ml-2 transition-colors"
                                            >
                                                Log In
                                            </button>
                                        </p>
                                    </div>

                                    {/* Role toggle */}
                                    <div className = "flex-shrink-0 grid grid-cols-2 gap-3 sm:gap-4 mb-6">
                                        {['student', 'host'].map((role) => {
                                            const isSelected = formData.role === role

                                            return (

                                                <div
                                                    key = {role}
                                                    onClick = {() => handleRoleChange(role)}
                                                    className = {`
                                                        cursor-pointer rounded-xl p-[1px] relative overflow-hidden group transition-all duration-300
                                                        ${isSelected 
                                                            ? 'shadow-[0_0_25px_rgba(236, 72, 153, 0.3)]' 
                                                            : 'hover:bg-zinc-800/50'
                                                        }
                                                    `}
                                                >
                                                    <div className = {`relative h-full bg-[#18181b] rounded-[11px] p-3 flex flex-col items-center justify-center gap-2 ${isSelected ? 'bg-[#18181b]/90' : ''}`}>
                                                        <div className = {`h-5 w-5 rounded-full flex items-center justify-center transition-all ${isSelected ? `${festiveGradient}` : "border border-zinc-600 bg-zinc-900"}`}>
                                                            {isSelected && (
                                                                <Check 
                                                                    size = {12} 
                                                                    className = "text-white font-bold" 
                                                                />
                                                            )}
                                                        </div>

                                                        <span className = {`text-xs font-bold uppercase tracking-wider ${isSelected ? 'text-white' : "text-zinc-500 group-hover:text-zinc-300"}`}>
                                                            {role}
                                                        </span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    
                                    <div className = "space-y-4 flex-grow">
                                        <div className = "grid grid-cols-2 gap-3 sm:gap-4">
                                            <FormInput 
                                                id = 'signup-firstname' 
                                                name = 'first_name' 
                                                type = 'text' 
                                                placeholder = "First Name"
                                                value = {formData.first_name} 
                                                onChange = {handleChange}
                                            />

                                            <FormInput
                                                id = 'signup-lastname'
                                                name = 'last_name'
                                                type = 'text'
                                                placeholder = "Last Name"
                                                value = {formData.last_name}
                                                onChange = {handleChange}
                                            />
                                        </div>

                                        <FormInput 
                                            id = 'signup-email' 
                                            name = 'email' 
                                            type = 'email' 
                                            placeholder = "Email ID" 
                                            value = {formData.email} 
                                            onChange = {handleChange} 
                                        />

                                        <FormInput 
                                            id = 'signup-password' 
                                            name = 'password' 
                                            type = 'password' 
                                            placeholder = 'Password' 
                                            value = {formData.password} 
                                            onChange = {handleChange}
                                        />

                                        <FormInput 
                                            id = 'signup-confirmPassword' 
                                            name = 'confirmPassword' 
                                            type = 'password' 
                                            placeholder = "Confirm Password" 
                                            value = {formData.confirmPassword} 
                                            onChange = {handleChange} 
                                        />
                                    </div>

                                    <div className = "flex-shrink-0 pt-6 pb-2">
                                        <SolidAnimatedButton 
                                            disabled = {isLoading}
                                            className = 'w-full py-3.5'
                                        >
                                            {isLoading 
                                                ? <Loader2 className = "h-5 w-5 animate-spin mx-auto" />
                                                : "Sign Up"}
                                        </SolidAnimatedButton>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>

    );

}

