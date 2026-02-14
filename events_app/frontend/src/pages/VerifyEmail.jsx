// VerifyEmail.jsx


import {useState, useEffect, useRef} from 'react'
import {useNavigate} from 'react-router-dom'
import {toast} from 'react-hot-toast'
import {Mail, ArrowRight, AlertCircle, Loader2} from 'lucide-react'

import api from '../api/api'


export default function VerifyEmail() {

    const navigate = useNavigate()

    const [otp, setOtp] = useState(['', '', '', '', '', ''])
    const [loading, setLoading] = useState(false)
    const [resending, setResending] = useState(false)
    const [timer, setTimer] = useState(0) // Timer for resend cooldown

    const inputRefs = useRef([])

    // Timer countdown logic
    useEffect(() => {
        let interval
        
        if (timer > 0) {
            interval = setInterval(() => setTimer((prev) => prev - 1), 1000)
        }

        return () => clearInterval(interval)
    }, [timer])

    // Handle typing in a box
    const handleChange = (index, value) => {
        // Allow only numbers
        if (!/^\d*$/.test(value)) return

        const newOtp = [...otp]

        newOtp[index] = value.substring(value.length - 1)
        
        setOtp(newOtp)

        // Move to next input if previous value is entered.
        if (value && index < 5) {
            inputRefs.current[index + 1].focus()
        }
    }

    // Handle backspace
    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus()
        }
    }

    // Handle paste
    const handlePaste = (e) => {
        e.preventDefault()

        const pastedData = e.clipboardData.getData('text').slice(0, 6)

        if (!/^\d*$/.test(pastedData)) return

        const digits = pastedData.split('')
        const newOtp = [...otp]

        // This is like correlating each box with each digit of the OTP
        digits.forEach((digit, index) => {
            if (index < 6) newOtp[index] = digit
        })

        setOtp(newOtp)

        // Tells which box to focus on next
        const nextFocus = Math.min(digits.length, 5)

        inputRefs.current[nextFocus].focus()
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        const code = otp.join('')

        if (code.length !== 6) {
            toast.error("Please enter the full 6-digit code")

            return
        }
        
        setLoading(true)

        try {
            await api.post('/api/auth/verify-otp/', {otp : code})

            toast.success("Email verified! Welcome aboard.")

            navigate('/onboarding')
        } catch (err) {
            console.error(err)

            const msg = err.response?.data?.error || "Verification failed"

            toast.error(msg)

            setOtp(['', '', '', '', '', ''])

            inputRefs.current[0].focus()
        } finally {
            setLoading(false)
        }
    }

    const handleResend = async () => {
        if (timer > 0) return

        setResending(true)

        try {
            await api.post('/api/auth/resend-otp/')

            toast.success("New code sent to your email.")

            setTimer(60) // 60 second cooldown before allowing resend again
        } catch (err) {
            toast.error("Failed to resend code.")
        } finally {
            setResending(false)
        }
    }

    return (

        <div className = "min-h-[100dvh] bg-[#09090b] text-white flex flex-col justify-center items-center p-4 md:p-6 relative overflow-hidden font-sans selection:bg-orange-500 selection:text-white">
            {/* Background texture */}
            <div 
                className = "fixed inset-0 opacity-[0.03] pointer-events-none z-0"
                style = {{
                    backgroundImage : "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
                    backgroundSize : "40px 40px"
                }}
            />

            {/* Ambient glow */}
            <div className = "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 sm:h-96 w-64 sm:w-96 bg-orange-500/20 blur-[100px] sm:blur-[120px] rounded-full pointer-events-none z-0" />

            <div className = "w-full max-w-[400px] md:max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-500">
                {/* Header card */}
                <div className = "text-center mb-8">
                    <div className = "h-16 w-16 mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mb-6 shadow-xl relative group ring-1 ring-white/5">
                        <div className = "absolute inset-0 bg-orange-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />

                        <Mail className = "h-8 w-8 text-orange-500 relative z-10" />
                    </div>

                    <h1 className = "text-2xl sm:text-3xl font-black uppercase tracking-tight mb-3">
                        Check your inbox
                    </h1>

                    <p className = "text-zinc-500 text-sm sm:text-base leading-relaxed px-2">
                        We've sent a 6-digit verification code to your email. <br className = "hidden md:block" />
                        Enter it below to verify your account.
                    </p>
                </div>

                <form
                    onSubmit = {handleSubmit}
                    className = 'space-y-8'
                >
                    <div className = "grid grid-cols-6 gap-2 sm:gap-3 px-1">
                        {otp.map((digit, index) => (
                            <div
                                key = {index}
                                className = "relative aspect-[4/5] sm:aspect-square"
                            >
                                <input 
                                    ref = {(el) => (inputRefs.current[index] = el)}
                                    type = 'text'
                                    inputMode = 'numeric'
                                    pattern = '\d*'
                                    maxLength = {1}
                                    autoComplete = 'one-time-code'
                                    value = {digit}
                                    onChange = {(e) => handleChange(index, e.target.value)}
                                    onKeyDown = {(e) => handleKeyDown(index, e)}
                                    onPaste = {handlePaste}
                                    className = {`
                                        h-full w-full text-center text-xl sm:text-2xl font-bold bg-[#18181b] border-2 rounded-xl focus:outline-none transition-all
                                        duration-200
                                        ${digit
                                            ? "border-orange-500 text-white shadow-[0_0_15px_rgba(249, 115, 22, 0.15)] bg-zinc-900"
                                            : "text-zinc-500 focus:text-white border-zinc-800 focus:border-zinc-600 hover:border-zinc-700"
                                        } 
                                    `}
                                />
                            </div>
                        ))}
                    </div>

                    <button
                        type = 'submit'
                        disabled = {loading || otp.join('').length !== 6}
                        className = {`
                            w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all duration-300 touch-manipulation
                            ${otp.join('').length === 6 && !loading
                                ? "bg-white hover:bg-zinc-200 text-black shadow-lg shadow-white/10 active:scale-95"
                                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                            }    
                        `}
                    >
                        {loading ? (
                            <>
                                <Loader2 className = "h-4 w-4 animate-spin" />

                                <span className = 'opacity-80'>
                                    Verifying...
                                </span>
                            </>
                        ) : (
                            <>
                                Verify Email <ArrowRight className = "h-4 w-4" />
                            </>
                        )}
                    </button>
                </form>

                {/* Resend link */}
                <div className = "mt-8 text-center space-y-4">
                    <button
                        onClick = {handleResend}
                        disabled = {timer > 0 || resending}
                        className = {`
                            text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 mx-auto transition-colors p-2 rounded-lg
                            ${timer > 0
                                ? "text-zinc-600 cursor-not-allowed"
                                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                            }    
                        `}
                    >
                        {resending ? (
                            <Loader2 className = "h-3 w-3 animate-spin" />
                        ) : (
                            timer > 0 ? (
                                <>
                                    Resend code in 
                                    
                                    <span className = "font-mono text-orange-500 w-9 text-center inline-block">
                                        00:{timer.toString().padStart(2, '0')}
                                    </span>
                                </>
                            ) : (
                                <>
                                    Didn't receive code?

                                    <span className = "text-white underline decoration-zinc-700 underline-offset-4 decoration-2">
                                        Resend
                                    </span>
                                </>
                            )
                        )}
                    </button>

                    <div className = "flex items-center justify-center gap-2 text-[10px] text-zinc-700 uppercase tracking-widest">
                        <AlertCircle className = "h-3 vw-3" />

                        Check spam folder if missing
                    </div>
                </div>
            </div>
        </div>

    )

}
