// RequestPasswordLink.jsx


import {AlertTriangle, ArrowLeft, CheckCircle, Loader2, Mail} from 'lucide-react'
import {useState} from 'react'
import {Link, useNavigate} from 'react-router-dom'

import api from '../api/api'

import FormInput from '../components/common/FormInput'
import SolidAnimatedButton from '../components/ui/SolidAnimatedButton'


export default function RequestPasswordLink() {

    const navigate = useNavigate()

    const [email, setEmail] = useState('')
    const [status, setStatus] = useState('idle') // idle | loading | success | error
    const [message, setMessage] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()

        setStatus('loading')
        setMessage('')

        try {
            await api.post('/api/auth/password-reset/', {email})

            setStatus('success')
            setMessage("Password reset successfully!")

            setTimeout(() => {
                navigate('/login')
            }, 3000)
        } catch (err) {
            console.error(err)

            setStatus('error')
            setMessage(err.response?.data?.error || "Request failed. Please check the email & retry.")
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
                    backgroundSize : "40px 40px"
                }}
            />

            {/* Ambient glow */}
            <div className = {`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 sm:h-96 w-64 sm:w-96 ${festiveGradient} blur-[100px] sm:blur-[120px] opacity-20 pointer-events-none rounded-full z-0`} />

            <div className = "relative z-10 w-full max-w-[380px] sm:max-w-md animate-in fade-in zoom-in-95 duration-500">
                {status !== 'success' && (
                    <Link
                        to = '/login'
                        className = "inline-flex items-center text-zinc-500 hover:text-white mb-6 transition-colors text-xs font-bold uppercase tracking-widest group p-2 -ml-2"
                    >
                        <ArrowLeft className = "h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform"/>
                        
                        Back to Login
                    </Link>
                )}

                <div className = "bg-[#18181b]/90 backdrop-blur-xl border border-zinc-800/50 p-6 sm:p-8 w-full shadow-2xl relative rounded-3xl ring-1 ring-white/5 overflow-hidden">
                    {status === 'success' ? (
                        <div className = "text-center-py-4">
                            <div className = "h-16 w-16 bg-zinc-900/80 border border-zinc-700/50 flex items-center justify-center mx-auto mb-6 rounded-2xl shadow-lg ring-1 ring-emerald-500/20">
                                <CheckCircle 
                                    className = "h-8 w-8 text-emerald-500" 
                                    strokeWidth = {1.5}
                                />
                            </div>

                            <h2 className = "text-2xl sm:text-3xl font-black text-white mb-3 uppercase tracking-tighter">
                                Check Inbox
                            </h2>

                            <p className = "text-zinc-400 mb-8 font-medium text-sm leading-relaxed px-2">
                                We've sent a password reset link to <br />

                                <span className = {`text-transparent bg-clip-text font-bold ${festiveGradient} break-all block mt-1`}>
                                    {email}
                                </span>
                            </p>

                            <Link
                                to = '/login'
                                className = "block w-full"
                            >
                                <SolidAnimatedButton className = 'w-full'>
                                    Return to Login
                                </SolidAnimatedButton>
                            </Link>
                        </div>
                    ) : (
                        <form
                            onSubmit = {handleSubmit}
                            className = "flex flex-col h-full"
                        >
                            <div className = "flex flex-col items-center mb-6 sm:mb-8 text-center">
                                <div className = "h-12 w-12 bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 rounded-xl shadow-lg">
                                    <Mail 
                                        className = "text-pink-500 h-6 w-6"
                                        strokeWidth = {1.5}
                                    />
                                </div>

                                <h1 className = "text-2xl sm:text-3xl font-black text-white uppercase tracking-tighter">
                                    Forgot Password?
                                </h1>

                                <p className = "text-zinc-500 mt-2 text-xs font-bold uppercase tracking-wide">
                                    Enter the registered email address
                                </p>
                            </div>

                            {status === 'error' && (
                                <div className = "bg-red-950/30 border-l-4 border-red-900/50 text-red-400 p-3 mb-6 text-xs font-medium flex items-start gap-3 rounded-r-lg animate-in slide-in-from-top-2">
                                    <AlertTriangle className = "h-4 w-4 shrink-0 mt-0.5" />

                                    <span className = 'leading-snug'>
                                        {message}
                                    </span>
                                </div>
                            )}

                            <div className = 'space-y-6'>
                                <FormInput 
                                    id = 'email'
                                    name = 'email'
                                    type = 'email'
                                    placeholder = "Email Address"
                                    value = {email}
                                    onChange = {(e) => setEmail(e.target.value)}
                                    className = "h-12 placeholder:normal-case"
                                />

                                <div className = 'pt-2'>
                                    <SolidAnimatedButton 
                                        disabled = {status === 'loading'}
                                        className = "h-12 w-full"
                                    >
                                        {status === 'loading' ? (
                                            <span className = "flex items-center justify-center gap-2">
                                                <Loader2 className = "h-4 w-4 animate-spin" />

                                                Sending...
                                            </span>
                                        ) : (
                                            "Send Reset Link"
                                        )}
                                    </SolidAnimatedButton>
                                </div>
                            </div>
                        </form>
                    )}
                </div>

                {/* Footer */}
                <div className = "mt-8 text-center">
                    <p className = {`text-[10px] font-black tracking-[0.2em] text-transparent bg-clip-text ${festiveGradient} opacity-50 select-none`}>
                        PLUG.
                    </p>
                </div>
            </div>
        </div>

    )

}
