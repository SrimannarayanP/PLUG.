// SpotlightCard.jsx


import {useRef, useEffect} from 'react' // useRef & useEffect are React hooks


const SpotlightCard = ({
    children, 
    className = ''
}) => {

    const cardRef = useRef(null)
    // It allows you to persist values without re-rendering the element

    useEffect(() => {    // Check stackoverflow on how this works
        const card = cardRef.current

        if (!card) return

        const handleMouseMove = (e) => { // e is basically an event (like a mouse-click, key press etc.)
            const rect = card.getBoundingClientRect() // card.getBoundingClientRect gives the size & position of the card relative to the viewport
            const x = e.clientX - rect.left // .clientX gives the horizontal coordinate at which the event occurred
            const y = e.clientY - rect.top // .clientY gives the vertical coordinate at which the event occurred; y = 

            card.style.setProperty('--mouse-x', `${x}px`)
            card.style.setProperty('--mouse-y', `${y}px`)
        };

        // handleMouseMove runs everytime the mouse is moved over a card. getBoundingClientRect gives the exact size & position of the card relative to the viewport.
        // (x, y) coordinates are basically the coordinates of the mouse pointer within the card (e.clientX - rect.left). This (x, y) is set as the new coordinates for 
        // the mouse pointer as (--mouse-x, --mouse-y). 

        card.addEventListener('mousemove', handleMouseMove)

        return () => {

            card.removeEventListener('mousemove', handleMouseMove)

        }

    }, [])

    return (

        <div 
            ref = {cardRef} 
            className = {`relative bg-gray-900/60 bg-opacity-60 border border-white/10 rounded-3xl overflow-hidden
                transition-colors duration-500 group hover:border-orange-500/50 
                spotlight-card ${className}
            `}
        >
            <div 
                className = "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style = {{background : "radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(249, 115, 22, 0.1), transparent 40%)"}}
            /> {/* Acts like a mask for the glowing effect */}

            <div className = "relative z-10 h-full">
                {children}
            </div>
        </div>

    )

}


export default SpotlightCard
