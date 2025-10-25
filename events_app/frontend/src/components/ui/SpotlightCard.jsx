// SpotlightCard.jsx


import React, {useRef, useEffect} from 'react';    // useRef & useEffect are React hooks


const SpotlightCard = ({children, className = ''}) => {

    const cardRef = useRef(null);
    // It allows you to persist values without re-rendering the element

    useEffect(() => {    // Check stackoverflow on how this works

        const card = cardRef.current;

        if (!card) return;

        const handleMouseMove = (e) => { // e is basically an event (like a mouse-click, key press etc.)

            const rect = card.getBoundingClientRect(); // card.getBoundingClientRect gives the size & position of the card relative to the viewport
            const x = e.clientX - rect.left; // .clientX gives the horizontal coordinate at which the event occurred
            const y = e.clientY - rect.top; // .clientY gives the vertical coordinate at which the event occurred; y = 

            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`); 


        };

        // handleMouseMove runs everytime the mouse is moved over a card. getBoundingClientRect gives the exact size & position of the card relative to the viewport.
        // (x, y) coordinates are basically the coordinates of the mouse pointer within the card (e.clientX - rect.left). This (x, y) is set as the new coordinates for 
        // the mouse pointer as (--mouse-x, --mouse-y). 

        card.addEventListener('mousemove', handleMouseMove);

        return () => {

            card.removeEventListener('mousemove', handleMouseMove);

        };

    }, []);

    return (

        <div ref = {cardRef} className = {`relative bg-gray-900 bg-opacity-60 border border-gray-800 rounded-2xl p-6 transition-all duration-300 group hover:border-red-500/50 spotlight-card ${className}`}>
            <div className = "absolute inset-0 rounded-2xl overflow-hidden z-0"> {/* Acts like a mask for the glowing effect */}
            {/* Absolute position, inset-0 (effectively means top, left, right, bottom all are set to 0, effectively spanning the containing element), 2xl rounded corners, hidden overflow, ensuring the glow never leaks out of the card, no protruding effect because of z-0 */}
                <div className = "absolute inset-[-100px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" style = {{

                    background : "radial-gradient(400px circle at var(--mouse-x) var(--mouse-y), rgba(239, 68, 68, 0.15), transparent 40%)",

                }}>
                {/* Absolute position, inset-[-100px] means that the glow element is larger than card by 100px on all sides. This ensures that the edges of the circular glow 
                are never visible, even at the end of the card; by default, the opacity is 0 (no glow). group-hover:opacity-100 - This is the trigger, when you hover over
                the parent class, this opacity comes into effect. transition-opacity duration-500 - allows for a smooth transition over 500ms */}
                </div>
            </div>
            <div className = "relative z-10 h-full">

                {children}

            </div>
        </div>

    )

};


export default SpotlightCard;
