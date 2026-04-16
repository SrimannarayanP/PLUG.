// Unauthorized.jsx


import {ArrowLeft, LogIn, ShieldAlert} from 'lucide-react'
import {useLocation, useNavigate} from 'react-router-dom'

import Logo from '../components/common/Logo'


export default function Unauthorized() {

    const navigate = useNavigate()
    const location = useLocation()

    const festiveGradient = "bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600"

    return (

        <div className = "min-h-screen bg-[#09090b] text-white font-sans relative overflow-hidden selection:bg-pink-500 selection:text-white flex flex-col">
            {/* Background Texture */}
            <div
                className = "absolute inset-0 opacity-[0.03] pointer-events-none z-0"
                style = {{
                    backgroundImage : "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
                    backgroundSize : "40px 40px"
                }}
            />

            {/* Ambient Glow */}
            <div className = "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] bg-red-500/10 blur-[120px] rounded-full pointer-events-none z-0" />
        
            {/* Header/Logo */}
            <div className = "relative z-10 p-6 md:p-10 flex justify-between items-center w-full max-w-7xl mx-auto">
                <Logo 
                    className = "h-8 w-8"
                    textSize = 'text-2xl'
                />
            </div>

            {/* Main Content */}
            <div className = "relative z-10 flex flex-1 flex-col items-center justify-center px-4 text-center">
                <div className = "mb-8 p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 shadow-2xl relative overflow-hidden">
                    <div className = "absolute inset-0 bg-red-500/10 animate-pulse" />

                    <ShieldAlert className = "h-16 w-16 text-red-500 relative z-10" />
                </div>

                <h1 className = "text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-4">
                    Access <br className = 'sm:hidden' />
                    
                    <span className = {`bg-clip-text text-transparent ${festiveGradient}`}>
                        Denied
                    </span>
                </h1>

                <h2 className = "text-xl md:text-2xl font-bold text-white mb-4 tracking-wide">
                    Restricted Territory
                </h2>

                <p className = "text-sm md:text-base text-zinc-400 max-w-md mx-auto mb-10 leading-relaxed">
                    You do not have the required permissions to view this page. If you believe this is an error, ensure you are logged into the correct account.
                </p>

                <div className = "flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto max-w-xs sm:max-w-none mx-auto">
                    <button
                        onClick = {() => navigate(-1)}
                        className = "flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-black font-bold uppercase tracking-wider text-sm shadow-[0_0_20px_rgba(255, 255, 255, 0.1)] hover:bg-zinc-200 hover:scale-[0.98] transition-all"
                    >
                        <ArrowLeft className = "h-4 w-4" />

                        Go Back
                    </button>

                    <button
                        onClick = {() => navigate('/login', {state : {from : location.pathname}})}
                        className = "flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-bold uppercase tracking-wider text-sm hover:bg-zinc-800 hover:border-zinc-700 hover:scale-[0.98] transition-all"
                    >
                        <LogIn className = "h-4 w-4 text-zinc-400" />

                        Switch Account
                    </button>
                </div>
            </div>

            <div className = "relative z-10 p-6 text-center">
                <p className = "text-[10px] uppercase font-mono tracking-widest text-zinc-600">
                    Security Policy • PLUG.
                </p>
            </div>
        </div>

    )

}
