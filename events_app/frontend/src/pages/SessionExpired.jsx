// SessionExpired.jsx


import {ArrowRight, Timer} from 'lucide-react'
import {useNavigate} from 'react-router-dom'

import BackgroundPaths from '../components/ui/BackgroundPaths'
import SolidAnimatedButton from '../components/ui/SolidAnimatedButton'


export default function SessionExpired() {

    const navigate = useNavigate()
    
    const festiveGradient = "bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600"

    return (

        <main className = "relative w-full min-h-[100dvh] font-sans text-white bg-[#09090b] flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden selection:bg-pink-500 selection:text-white">
            {/* Background Texture */}
            <div 
                className = "absolute inset-0 opacity-[0.03] pointer-events-none z-0"
                style = {{
                    backgroundImage : "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
                    backgroundSize : "40px 40px"
                }}
            />

            <div className = "fixed inset-0 opacity-30 pointer-events-none mix-blend-screen z-0">
                <BackgroundPaths />
            </div>
            
            <div className = "relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
                <div className = "bg-[#18181b]/90 backdrop-blur-xl border border-zinc-800/50 rounded-3xl shadow-2xl p-8 sm:p-10 text-center ring-1 ring-white/5">
                    <div className = "mx-auto h-20 w-20 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mb-6 shadow-xl relative overflow-hidden">
                        <div className = {`absolute inset-0 opacity-20 ${festiveGradient}`} />

                        <Timer className = "h-10 w-10 text-orange-500 relative z-10" />
                    </div>
                    
                    <h1 className = "text-3xl font-black uppercase tracking-tighter text-white mb-3">
                        Session <span className = "text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">Expired</span>
                    </h1>

                    <p className = "text-zinc-400 text-sm mb-8 font-medium leading-relaxed">
                        For your security, you have been logged due to inactivity. Please log in again to continue.
                    </p>

                    <SolidAnimatedButton
                        onClick = {() => navigate('/login')}
                        className = "w-full py-4 uppercase tracking-widest text-sm"
                    >
                        Log In Again <ArrowRight className = "h-4 w-4 ml-2 inline-block" />
                    </SolidAnimatedButton>
                </div>
            </div>
        </main>

    )

}
