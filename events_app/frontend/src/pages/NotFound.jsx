// NotFound.jsx


import {ArrowLeft, Compass, Home} from 'lucide-react'
import {useNavigate} from 'react-router-dom'

import Logo from '../components/common/Logo'

import BackButton from '../components/common/BackButton'


export default function NotFound() {

    const navigate = useNavigate()
    
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
            <div className = "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] bg-pink-500/10 blur-[120px] rounded-full pointer-events-none z-0" />
            
            {/* Header / Logo */}
            <div className = "relative z-10 p-6 md:p-10 flex justify-between items-center w-full max-w-7xl mx-auto">
                <BackButton />
                
                <Logo
                    className = "h-8 w-8"
                    textSize = 'text-2xl'
                />
            </div>

            {/* Main Content */}
            <div className = "relative z-10 flex flex-1 flex-col items-center justify-center px-4 text-center">
                <div className = "mb-8 p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 shadow-2xl">
                    <Compass className = "h-16 w-16 text-zinc-500 animate-[spin_4s_linear_infinite]" />
                </div>

                <h1 className = "text-7xl md:text-9xl font-black uppercase tracking-tighter leading-none mb-4">
                    <span className = {`bg-clip-text text-transparent ${festiveGradient}`}>
                        404
                    </span>
                </h1>

                <h2 className = "text-2xl md:text-3xl font-bold text-white mb-4 tracking-wide">
                    Lost in the Crowd
                </h2>

                <p className = "text-sm md:text-base text-zinc-400 max-w-md mx-auto mb-10 leading-relaxed">
                    The event or page you're looking for doesn't exist, has been moved or you took a wrong turn at the main stage.
                </p>

                <div className = "flex justify-center w-full">
                    <button
                        onClick = {() => navigate('/')}
                        className = "flex items-center justify-center gap-2 w-full sm:w-auto px-10 py-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-black uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(255, 255, 255, 0.1)] hover:scale-[0.98] transition-all"
                    >
                        <Home className = "h-5 w-5" />

                        Return to Main Page
                    </button>
                </div>
            </div>

            <div className = "relative z-10 p-6 text-center">
                <p className = "text-[10px] uppercase font-mono tracking-widest text-zinc-600">
                    System Error • PLUG.
                </p>
            </div>
        </div>

    )
    
}
