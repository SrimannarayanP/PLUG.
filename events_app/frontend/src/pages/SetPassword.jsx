// SetPassword.jsx


import {useState} from 'react'
import {useParams, useNavigate, Link} from 'react-router-dom'
import {CheckCircle, KeyRound, Loader2, AlertTriangle, Eye, EyeOff, ArrowRight, Check} from 'lucide-react'
import {toast} from 'react-hot-toast'

import api from '../api/api'

import FormInput from '../components/common/FormInput'
import SolidAnimatedButton from '../components/ui/SolidAnimatedButton'


export default function SetPassword() {

    const {uid, token} = useParams()
    const navigate = useNavigate()

    const [formData, setFormData] = useState({
        password : '',
        confirm_password : '',
    })

    const [status, setStatus] = useState('idle') // idle | loading | success | error
    const [errorMessage, setErrorMessage] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const handleChange = (e) => {
        setFormData({...formData, [e.target.name] : e.target.value})

        // Clear errors when typing
        if (errorMessage) setErrorMessage('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        setStatus('loading')
        setErrorMessage('')
        
        if (formData.password !== formData.confirm_password) { 
            setErrorMessage("Passwords do not match!")
            setStatus('error')

            return
        }

        if (formData.password.length < 8) {
            setErrorMessage("Password must be atleast 8 characters.")
            setStatus('error')

            return
        }

        try {
            await api.post('/api/auth/password-set/', {
                uid : uid,
                token : token,
                password : formData.password,
            })

            setStatus('success')
            toast.success("Password updated successfully!")

            setTimeout(() => navigate('/login'), 3000)
        } catch (err) {
            console.error(err)

            setStatus('error')

            if (err.response?.data) {
                const data = err.response.data
                const firstError = data.error || Object.values(data).flat()[0] || "Link invalid or expired."
                
                setErrorMessage(firstError)
            } else {
                setErrorMessage("Something went wrong. Please try again.")
            }
        } 
    }

    const festiveGradient = "bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600"

    return (

        <div className = "min-h-[100dvh] bg-[#09090b] text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans selection:bg-pink-500 selection:text-white">
            {/* Background wrapper */}
            <div 
                className = "absolute inset-0 opacity-[0.03] pointer-events-none z-0"
                style = {{
                    backgroundImage : "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
                    
                }}
            />
            
            {/* Ambient glow */}
            <div className = {`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 sm:h-96 w-64 sm:w-96 ${festiveGradient} blur-[100px] sm:blur-[120px] opacity-20 rounded-full pointer-events-none z-0`} />

            <div className = "relative z-10 w-full max-w-[380px] sm:max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className = "bg-[#18181b]/90 backdrop-blur-xl border border-zinc-800/50 p-6 sm:p-8 rounded-3xl shadow-2xl ring-1 ring-white/5 relative overflow-hidden">
                    {status === 'success' ? (
                        <div className = "text-center py-4">
                            <div className = "h-16 w-16 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6 rounded-2xl shadow-[0_0_20px_rgba(16, 185, 129, 0.2)]">
                                <CheckCircle 
                                    className = "h-8 w-8 text-emerald-500" 
                                    strokeWidth = {1.5}
                                />
                            </div>

                            <h2 className = "text-2xl sm:text-3xl font-black text-white mb-2 uppercase tracking-tighter">
                                All Set!
                            </h2>

                            <p className = "text-zinc-400 mb-8 font-medium text-sm leading-relaxed px-4">
                                Your password has been updated. <br /> Redirecting you to login...
                            </p>

                            {/* Progress Bar */}
                            <div className = "h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden mb-6">
                                <div className = "h-full w-full bg-emerald-500 animate-[shrink_3s_linear_forwards]" />
                            </div>
                            
                            <Link
                                to = '/login'
                                className = "block w-full"
                            >
                                <SolidAnimatedButton className = 'w-full'>
                                    Login Now
                                </SolidAnimatedButton>
                            </Link>
                        </div>
                    ) : (
                        <div className = "flex flex-col h-full">
                            <div className = "flex flex-col items-center mb-6 sm:mb-8 text-center">
                                <div className = "h-12 w-12 bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 rounded-xl rotate-3 shadow-lg ring-1 ring-orange-500/20">
                                    <KeyRound
                                        className = "text-orange-500 h-6 w-6"
                                        strokeWidth = {1.5}
                                    />
                                </div>

                                <h1 className = "text-2xl sm:text-3xl font-black text-white uppercase tracking-tighter">
                                    Set New Password
                                </h1>

                                <p className = "text-zinc-500 mt-2 text-xs font-bold uppercase tracking-wide">
                                    Create a strong password
                                </p>
                            </div>

                            {status === 'error' && (
                                <div className = "bg-red-950/30 border border-red-900/50 text-red-400 p-3 mb-6 text-xs md:text-sm font-medium flex items-center gap-3 rounded-lg animate-in slide-in-from-top-2">
                                    <AlertCircle className = "w-5 h-5 shrink-0" />

                                    {error}
                                </div>
                            )}

                            <form
                                onSubmit = {handleSubmit}
                                className = 'space-y-5'
                            >
                                <div className = "relative group">
                                    <FormInput 
                                        id = 'password'
                                        name = 'password'
                                        type = {showPassword ? 'text' : 'password'}
                                        placeholder = "New Password"
                                        value = {formData.password}
                                        onChange = {handleChange}
                                        className = 'pr-12'
                                    />

                                    <button
                                        type = 'button'
                                        onClick = {() => setShowPassword(!showPassword)}
                                        className = "absolute right-0 top-0 bottom-0 px-4 text-zinc-500 hover:text-white transition-colors flex items-center justify-center"
                                        tabIndex = {-1}
                                    >
                                        {showPassword ? <EyeOff size = {18} /> : <Eye size = {18} />}
                                    </button>
                                </div>

                                <div className = "relative group">
                                    <FormInput 
                                        id = 'confirm_password'
                                        name = 'confirm_password'
                                        type = 'password'
                                        placeholder = "Confirm Password"
                                        value = {formData.confirm_password}
                                        onChange = {handleChange}
                                    />

                                    <button
                                        type = 'button'
                                        onClick = {() => setShowPassword(!showPassword)}
                                        className = "absolute right-0 top-0 bottom-0 px-4 text-zinc-500 hover:text-white transition-colors flex items-center justify-center"
                                        tabIndex = {-1}
                                    >
                                        {showPassword ? <EyeOff size = {18} /> : <Eye size = {18} />}
                                    </button>
                                </div>

                                <div className = 'pt-4'>
                                    <SolidAnimatedButton 
                                        disabled = {status === 'loading'}
                                        className = 'w-full'
                                    >
                                        {status === 'loading' ? (
                                            <span className = "flex items-center justify-center gap-2">
                                                <Loader2 className = "h-4 w-4 animate-spin" />

                                                Updating...
                                            </span>
                                        ) : (
                                            <span className = "flex items-center justify-center gap-2">
                                                Reset Password

                                                <ArrowRight className = "h-4 w-4" />
                                            </span>
                                        )}
                                    </SolidAnimatedButton>
                                </div>
                            </form>
                        </div>
                    )}
                </div>

                {status !== 'success' && (
                    <div className = "mt-8 text-center">
                        <Link
                            to = '/login'
                            className = "text-xs text-zinc-600 font-bold uppercase tracking-widest hover:text-white transition-colors p-2"
                        >
                            Cancel & Return to Login
                        </Link>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes shrink {
                    from {width : 100%;}
                    to {width : 0%;}
                }
            `}</style>
        </div>

    )

}
