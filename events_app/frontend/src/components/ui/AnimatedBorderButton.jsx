// AnimatedBorderButton.jsx


const AnimatedBorderButton = ({children, className = '', onClick}) => {

    return (
        
        // This button has a relative position, inline-flex display, centered items vertically, centered items horizontally (justify-center), padding of 1px on all sides, hidden overflow, small font size, medium font weight, Gray with 900 unit shade text color, fully rounded corners, belongs to a group (meaning same properties will apply to child elements as well), gradient to bottom-right, from Red of shade 500 to Orange of shade 400
        <button
            onClick = {onClick} 
            className = {`
                relative inline-flex items-center justify-center 
                p-[1.5px] 
                overflow-hidden
                text-xs font-bold uppercase tracking-widest text-white 
                rounded-full 
                group
                bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600
                shadow-lg hover:shadow-[0_0_20px_rgba(236, 72, 153, 0.4)]
                transition-all duration-300 ease-out
                transform active:scale-95
                ${className}
            `}
        >
            {/* By default, the button will only have a gradient bg. On hover, background becomes transparent revealing gradient, text snaps to White for contrast against the bright gradient */}
            <span className = "relative px-6 py-3 transition-all ease-out duration-300 bg-[#09090b] text-white rounded-full group-hover:bg-transparent w-full h-full flex items-center justify-center">
                {children}
            </span>
        </button>

    );

}

export default AnimatedBorderButton;
