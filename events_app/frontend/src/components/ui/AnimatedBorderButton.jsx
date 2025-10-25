// AnimatedBorderButton.jsx


import React from 'react';

const AnimatedBorderButton = ({children, className}) => {

    return (

        <button className = {`relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium text-gray-900 rounded-full group bg-gradient-to-br from-red-500 to-orange-400 ${className}`}>
        {/* This button has a relative position, inline-flex display, centered items vertically, centered items horizontally (justify-center), padding of 0.5 units on all sides, hidden overflow, small font size, medium font weight, Gray with 900 unit shade text color, fully rounded corners, belongs to a group (meaning same properties will apply to child elements as well), gradient to bottom-right, from Red of shade 500 to Orange of shade 400 */}
            <span className = "relative px-5 py-2.5 transition-all ease-in duration-75 bg-black rounded-full group-hover:bg-opacity-0 text-white w-full h-full flex items-center justify-center">
            {/* This span tag has a relative position, padding of 5 units on x-axis, padding of 2.5 units on y-axis, transition all the elements in the span with ease-in effect and duration of 75ms, Black background color, fully rounded corners, when the parent button is hovered upon, the background opacity becomes 0 (bg-opacity-0), White text color, full width, full height, flex display (all the child elements will be positioned according to the span's dimensions), centered items vertically & horizontally. */}
                {children}

            </span>

        </button>

    );

}

export default AnimatedBorderButton;
