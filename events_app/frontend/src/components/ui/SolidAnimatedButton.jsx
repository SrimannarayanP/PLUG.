// SolidAnimatedButton.jsx


import {Loader2} from 'lucide-react'


const SolidAnimatedButton = ({
    type = 'submit',
    children,
    disabled = false,
    isLoading = false,
    className = '',
    onClick,
    ...props
}) => {
    const isLocked = disabled || isLoading

    return (

        <button
            type = {type}
            disabled = {isLocked}
            onClick = {onClick}
            className = {`
                group relative flex w-full items-center justify-center overflow-hidden rounded-xl
                transition-all duration-300 ease-out
                focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-black
                px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl
                font-black uppercase tracking-widest text-white sm:text-base
                ${isLocked
                    ? "cursor-not-allowed opacity-60"
                    : "hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(236, 72, 153, 0.4)] active:scale-[0.98] shadow-lg"
                }
                ${className}
            `}
        >
                <span className = "absolute inset-0 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600" />

                {!isLocked && (
                    <span className = "absolute inset-0 bg-white/0 transition-colors duration-300 group-hover:bg-white/10 mix-blend-overlay" />
                )}

                {/* Text content */}
                <span className = "relative z-10 flex items-center gap-2 drop-shadow-md">
                    {isLoading && (
                        <Loader2 className = "h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    )}
                    
                    {children}
                </span>
        </button>

    )

}


export default SolidAnimatedButton
