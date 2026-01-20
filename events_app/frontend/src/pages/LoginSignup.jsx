// LoginSignup.jsx


import {useState} from 'react'
import {useNavigate, Link} from 'react-router-dom'
import {ArrowRight, Check} from 'lucide-react'

import FormInput from '../components/common/FormInput'
import SolidAnimatedButton from '../components/ui/SolidAnimatedButton'
import BackgroundPaths from '../components/ui/BackgroundPaths'

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
        organisation_name : '',
        phone : '',
    })

    const navigate = useNavigate()

    const handleChange = (e) => {
        const {name, value} = e.target

        setFormData(prev => ({...prev, [name] : value}))

        if (error) setError()
    };

    const handleRoleChange = (role) => {
        setFormData(prev => ({...prev, role : role}))
    }

    const handleToggle = () => {
        setIsLogin(!isLogin)
        setFormData({
            first_name : '',
            last_name : '',
            email : '', 
            password : '', 
            confirmPassword : '',
            role : 'student',
            organisation_name : '',
            phone : '',
        })
        setError('')
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setIsLoading(true);
        setError('');

        if (!isLogin && formData.password !== formData.confirmPassword) {
            setError("Passwords don't match");
            setIsLoading(false);

            return
        }

        if (!formData.email || !formData.password) {
            setError("Email & password are required");
            setIsLoading(false);

            return
        }

        if (!isLogin && (!formData.first_name || !formData.last_name)) {
            setError("Name is required for registration");
            setIsLoading(false);

            return
        }

        if (!isLogin && formData.role === 'host') {
            if (!formData.organisation_name || !formData.phone) {
                setError("Organisation details are required for hosts")
                setIsLoading(false)

                return
            }
        }

        const endpoint = isLogin ? '/api/token/' : '/api/user/register/'
        
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

            if (formData.role === 'host') {
                payload.organisation_name = formData.organisation_name
                payload.phone = formData.phone
            }
        }

        try {
            const response = await api.post(endpoint, payload);

            if (response.status === 200 || response.status === 201) {
                // Store tokens
                localStorage.setItem(ACCESS_TOKEN, response.data.access);
                localStorage.setItem(REFRESH_TOKEN, response.data.refresh);

                // Clear form
                setFormData({
                    first_name : '',
                    last_name : '', 
                    email : '', 
                    password : '', 
                    confirmPassword : '',
                    role : 'student',
                    organisation_name : '',
                    phone : '',
                })

                const userRole = response.data.user?.role || response.data.role

                if (userRole === 'host') {
                    navigate('/host/dashboard')
                } else {
                    navigate('/')
                }
            }
        } catch (error) {
            console.log("Auth error : ", error)

            const resData = error.response?.data

            if (resData?.detail) {
                setError(resData.detail)
            } else if (resData) {
                const firstKey = Object.keys(resData)[0]
                const firstError = resData[firstKey]
                
                if (Array.isArray(firstError)) {
                    setError(`${firstKey} : ${firstError[0]}`)
                } else if (typeof firstError === 'string') {
                    setError(`${firstKey} : ${firstError}`)
                } else {
                    setError("Invalid data provided.")
                }
            } else {
                setError("Authentication failed. Please check details.")
            }
        } finally {
            setIsLoading(false)
        }
        
    }

    const festiveGradient = "bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600"

    return (

        <main className = "relative flex flex-col items-center justify-center w-full min-h-screen font-sans text-white bg-[#09090b] overflow-hidden py-10 selection:bg-pink-500 selection:text-white">
            {/* Background wrapper */}
            <div 
                className = "absolute inset-0 opacity-[0.03] pointer-events-none"
                style = {{
                    backgroundImage : "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
                    backgroundSize : "40px 40px"
                }}
            ></div>

            {/* Background wrapper for BackgroundPaths */}
            <div className = "absolute inset-0 opacity-30 pointer-events-none mix-blend-screen">
                <BackgroundPaths />
            </div>
                
            <div className = "relative z-10 grid w-full max-w-6xl grid-cols-1 md:grid-cols-2 gap-8 lg:gap-24 items-center px-6">
                {/* Left side : Logo & tagline */}
                <div className = "flex flex-col items-center md:items-start text-center md:text-left space-y-8">
                    <div className = "relative group">
                        <div className = {`absolute -inset-10 blur-3xl -z-10 rounded-full opacity-40 transition-opacity duration-1000 group-hover:opacity-60 ${festiveGradient}`} />

                        <div className = "flex flex-col items-center md:items-start relative z-10">
                            <div className = "w-24 h-24 md:w-32 md:h-32 relative mb-2">
                                <div className = "absolute inset-0 bg-[#09090b] border-4 border-zinc-800 rounded-2xl transform -skew-x-12 overflow-hidden shadow-2xl">
                                    {/* Inner gradient core */}
                                    <div className = {`absolute inset-0 opacity-90 ${festiveGradient}`}></div>

                                    {/* P shape overlay */}
                                    <div 
                                        className = "absolute inset-0 bg-[#09090b]"
                                        style = {{clipPath : "polygon(35% 20%, 85% 20%, 85% 55%, 35% 55%, 35% 80%, 15% 80%, 15% 20%)"}}    
                                    ></div>

                                    {/* bl - bottom left */}
                                    <div className = "absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-white/20 to-transparent pointer-events-none"></div>
                                </div>
                            </div>

                            <h1 className = "text-7xl md:text-8xl lg:text-9xl font-black text-white uppercase tracking-tighter leading-none drop-shadow-2xl">
                                PLUG

                                {/* Festive gradient in the period */}
                                <span className = {`text-transparent bg-clip-text ${festiveGradient}`}>.</span>
                            </h1>
                        </div>
                    </div>

                    <p className = "text-xl lg:text-3xl text-zinc-300 max-w-md font-light tracking-wide">
                        Campus events. <br />

                        <span className = {`text-transparent font-black bg-clip-text ${festiveGradient} text-4xl lg:text-5xl uppercase tracking-tighter`}>
                            Redefined.
                        </span>
                    </p>
                </div>

                {/* Right side : Login/Signup form */}
                <div className = "flex items-center justify-center w-full">
                    <div 
                        className = "w-full max-w-md bg-[#18181b]/90 backdrop-blur-xl border border-zinc-800/50 rounded-3xl shadow-2xl overflow-hidden relative ring-1 ring-white/5" 
                        style = {{minHeight : '600px'}}
                    >
                        {error && (
                            <div className = "absolute top-0 left-0 right-0 p-3 bg-red-950/50 border-b border-red-500/20 backdrop-blur-sm text-center animate-in slide-in-from-top z-50">
                                <p className = "text-sm font-bold text-red-400 flex items-center justify-center gap-2">
                                    <span className = "w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    
                                    {error}
                                </p>
                            </div>
                        )}
                            
                        <div className = "absolute inset-0 overflow-hidden">
                        {/* Login form */}
                            <div className = {`absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.23, 1, 0.32, 1)] ${isLogin ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}`}>
                                <form 
                                    className = "p-8 space-y-6 h-full flex flex-col justify-center" 
                                    onSubmit = {handleSubmit} 
                                    noValidate
                                >
                                    <div className = "text-center space-y-2 mb-4">
                                        <h2 className = "text-3xl font-bold text-white tracking-tighter uppercase">
                                            Welcome Back
                                        </h2>

                                        <p className = "text-zinc-400 text-sm font-medium">
                                            Sign in to continue
                                        </p>
                                    </div>

                                    <div className = 'space-y-4'>
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
                                                    to = '/forgot-password'
                                                    className = "text-[10px] md:text-xs font-bold text-zinc-500 hover:text-pink-500 transition-colors uppercase tracking-widest"
                                                >
                                                    Forgot Password?
                                                </Link>
                                            </div>
                                        </div>
                                    </div>

                                    <div className = "pt-4 space-y-6">
                                        <SolidAnimatedButton disabled = {isLoading}>
                                            {isLoading ? "Authenticating..." : "Log In"}
                                        </SolidAnimatedButton>

                                        <p className = "text-center text-zinc-500 text-sm">
                                            New here?

                                            <button
                                                type = 'button'
                                                onClick = {handleToggle}
                                                className = "font-bold text-white hover:text-pink-500 ml-2 transition-colors inline-flex items-center gap-1 group"
                                            >
                                                Create Account

                                                <ArrowRight className = "w-3 h-3 group-hover:translate-x-1 transition-transform text-pink-500" />
                                            </button>
                                        </p>
                                    </div>
                                </form>
                            </div>

                            {/* Signup form */}
                            <div className = {`absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.23, 1, 0.32, 1)] ${!isLogin ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"}`}>
                                <form 
                                    className = "p-8 space-y-4 pt-12 h-full overflow-y-auto custom-scrollbar" 
                                    onSubmit = {handleSubmit} 
                                    noValidate
                                >
                                    <div className = "text-center mb-6">
                                        <h2 className = "text-3xl font-black text-white uppercase tracking-tighter">
                                            Join PLUG.
                                        </h2>

                                        <p className = "text-center text-zinc-400 text-sm mt-2">
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
                                    <div className = "grid grid-cols-2 gap-4 mb-6">
                                        {['student', 'host'].map((role) => {
                                            const isSelected = formData.role === role

                                            return (

                                                <div
                                                    key = {role}
                                                    onClick = {() => handleRoleChange(role)}
                                                    className = {`
                                                        cursor-pointer rounded-xl p-[1px] relative overflow-hidden group transition-all duration-300
                                                        ${isSelected ? 'shadow-[0_0_25px_rgba(236, 72, 153, 0.3)]' : 'hover:bg-zinc-800/50'}
                                                    `}
                                                >
                                                    <div className = {`relative h-full bg-[#18181b] rounded-[11px] p-3 flex flex-col items-center justify-center gap-2 ${isSelected ? 'bg-[#18181b]/90' : ''}`}>
                                                        <div className = {`w-5 h-5 rounded-full flex items-center justify-center transition-all ${isSelected ? `${festiveGradient}` : "border border-zinc-600 bg-zinc-900"}`}>
                                                            {isSelected && <Check size = {12} className = "text-white font-bold" />}
                                                        </div>

                                                        <span className = {`text-sm font-bold uppercase tracking-wider ${isSelected ? 'text-white' : "text-zinc-500 group-hover:text-zinc-300"}`}>
                                                            {role}
                                                        </span>
                                                    </div>
                                                </div>

                                            )
                                        })}
                                    </div>

                                    <div className = "grid grid-cols-2 gap-4">
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

                                    {formData.role === 'host' && (
                                        <div className = "animate-in slide-in-from-top-4 fade-in duration-300 space-y-4 pt-2">
                                            <div className = "border-t border-zinc-800/50 pt-4">
                                                <p className = {`text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-transparent bg-clip-text ${festiveGradient}`}>
                                                    Organisation Details
                                                </p>

                                                <div className = 'space-y-4'>
                                                    <FormInput 
                                                        id = 'organisation_name'
                                                        name = 'organisation_name'
                                                        placeholder = "Organisation Name"
                                                        value = {formData.organisation_name}
                                                        onChange = {handleChange}
                                                    />

                                                    <FormInput 
                                                        id = 'phone'
                                                        name = 'phone'
                                                        type = 'tel'
                                                        placeholder = "Phone Number"
                                                        value = {formData.phone}
                                                        onChange = {handleChange}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className = "pt-2 pb-8">
                                        <SolidAnimatedButton disabled = {isLoading}>
                                            {isLoading ? "Creating Account..." : "Sign Up"}
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

