// BackButton.jsx


import {useNavigate} from 'react-router-dom'
import {ArrowLeft} from 'lucide-react'


export default function BackButton({to, label = 'Back', className = '', ...props}) {
    
    const navigate = useNavigate()

    const handleBack = () => {
        if (to) {
            // If a specific destination is provided, go there.
            navigate(to)
        } else {
            // Otherwise, go back 1 step in history.
            navigate(-1)
        }
    }

    return (

        <button
            onClick = {handleBack}
            {...props}
            className = {`group flex items-center gap-3 text-zinc-400 text-sm hover:text-white transition-colors font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-full ${className}`}
            aria-label = {label || "Back"}
        >
            <div className = "flex items-center justify-center h-10 sm:h-11 w-10 sm:w-11 rounded-full bg-zinc-900/80 group-hover:bg-zinc-800 group-active:bg-zinc-700 border border-zinc-800 group-hover:border-zinc-700 backdrop-blur-md transition-all group-hover:-translate-x-1 duration-300 ease-out group-active:scale-90 shadow-lg shadow-black/20">
                <ArrowLeft className = "h-5 w-5 text-white" />
            </div>

            {label && (
                <span className = "hidden sm:block text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                    {label}
                </span>
            )}
        </button>

    )

}
