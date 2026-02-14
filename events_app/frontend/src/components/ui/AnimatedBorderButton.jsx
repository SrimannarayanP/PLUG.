// AnimatedBorderButton.jsx


const AnimatedBorderButton = ({children, className = '', onClick, ...props}) => {

    return (
        
        // This button has a relative position, inline-flex display, centered items vertically, centered items horizontally (justify-center), padding of 1px on all sides, hidden overflow, small font size, medium font weight, Gray with 900 unit shade text color, fully rounded corners, belongs to a group (meaning same properties will apply to child elements as well), gradient to bottom-right, from Red of shade 500 to Orange of shade 400
        <button
            onClick = {onClick}
            type = 'button'
            className = {`
                group relative 
                w-full sm:w-auto
                inline-flex items-center justify-center 
                rounded-xl p-[2px]
                transition-all duration-300 ease-out
                focus:outline-none focus:ring-4 focus:ring-pink-500/20
                active:scale-[0.98]
                shadow-[0_0_20px_-5px_rgba(236, 72, 153, 0.3)]
                hover:shadow-[0_0_25px_-5px_rgba(236, 72, 153, 0.6)]
                ${className}
            `}
            {...props}
        >
            <div className = "absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 bg-[length:200%_200%] animate-gradient-xy" />

            {/* By default, the button will only have a gradient bg. On hover, background becomes transparent revealing gradient, text snaps to White for contrast against the bright gradient */}
            <span className = {`
                    relative flex h-full w-full items-center justify-center
                    rounded-[10px] bg-[#09090b]
                    px-8 py-3.5 
                    text-sm font-bold uppercase tracking-wider text-white
                    transition-all duration-300 ease-out
                    group-hover:bg-opacity-0
                    group-hover:text-white
                `}
            >
                {children}
            </span>
        </button>

    );

}

export default AnimatedBorderButton
