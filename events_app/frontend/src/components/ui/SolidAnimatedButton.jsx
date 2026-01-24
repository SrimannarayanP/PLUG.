// SolidAnimatedButton.jsx


const SolidAnimatedButton = ({
    type = 'submit', 
    children, 
    disabled = false, 
    className = '', 
    onClick
}) => (

    <button
        type = {type}
        disabled = {disabled}
        onClick = {onClick}
        className = {`
            relative group w-full
            text-white font-black uppercase tracking-widest text-sm
            py-4 px-6 rounded-xl
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950 focus:ring-pink-500
            transition-all duration-300 ease-out
            transform hover:-translate-y-1 active:scale-95
            disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
            overflow-hidden
            shadow-lg hover:shadow-[0_0_25px_rgba(236, 72, 153, 0.4)]
            ${className}
        `}
    >
            <span className = "absolute inset-0 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600" />
            {/* Hover highlight - mix-blend-overlay adds a glossy effect*/}
            <span className = "absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out mix-blend-overlay" />
            {/* Text content */}
            <span className = "relative z-10 flex items-center justify-center gap-2 drop-shadow-md">
                {children} 
            </span>
    </button>

)


export default SolidAnimatedButton
