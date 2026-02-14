// BackgroundPaths.jsx



"use client" // Renders the component on the client side

import {motion} from 'framer-motion'
import {useMemo, useState, useEffect} from 'react'


function useFloatingPaths() {
    // Safe default for server side rendering to prevent hydration mismatch. Default is desktop view.
    const [pathCount, setPathCount] = useState(36)

    useEffect(() => {
        const mobileQuery = window.matchMedia('(max-width : 640px)')
        const tabletQuery = window.matchMedia('(max-width : 1024px)')
        
        const updatePathCount = () => {
            if (mobileQuery.matches) {
                setPathCount(15)
            } else if (tabletQuery.matches) {
                setPathCount(24)
            } else {
                setPathCount(36)
            }
        }

        // Initial path count
        updatePathCount()

        // Real-time event listeners for orientation change
        mobileQuery.addEventListener('change', updatePathCount)
        tabletQuery.addEventListener('change', updatePathCount)

        return () => {
            mobileQuery.removeEventListener('change', updatePathCount)
            tabletQuery.removeEventListener('change', updatePathCount)
        }
    }, [])

    return pathCount
}

function FloatingPaths({position}) {
    const pathCount = useFloatingPaths()

    const paths = useMemo(() => {

        return Array.from({length : pathCount}, (_, i) => ({
            id : i,
            d : `M-${380 - i * 5 * position} -${189 + i * 6} C-${380 - i * 5 * position} -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6}
                ${152 - i * 5 * position} ${343 - i * 6} C${616 - i * 5 * position} ${470 - i * 6} ${684 - i * 5 * position} ${875 - i * 6} ${684 - i * 5 * position} 
                ${875 - i * 6}`,
            width : Math.min(1.2, 0.6 + i * 0.025),
            opacity : Math.min(0.6, 0.1 + i * 0.03)
        }))
    
    }, [pathCount, position])

    return (
            
        <svg
            className = "absolute inset-0 w-full h-full text-yellow-400 opacity-60"
            viewBox = "0 0 696 316"
            preserveAspectRatio = "xMidyMid slice"
            fill = 'none'
        >
            {paths.map((path) => (
                <motion.path 
                    key = {path.id}
                    d = {path.d}
                    stroke = 'currentColor' // Inherits the Yellow from the parent svg class
                    strokeWidth = {path.width}
                    strokeOpacity = {path.opacity}
                    vectorEffect = 'non-scaling-stroke'
                    initial = {{
                        pathLength : 0.3,
                        opacity : 0
                    }}
                    animate = {{
                        pathLength : 1,
                        opacity : [path.opacity * 0.5, path.opacity, path.opacity * 0.5],
                        pathOffset : [0, 1, 0]
                    }}
                    transition = {{
                        duration : 20 + Math.random() * 10,
                        repeat : Infinity,
                        ease : 'linear',
                        repeatType : 'loop'
                    }}
                />
            ))}
        </svg>

    )
}


export default function BackgroundPaths() {

    return (

        <div className = "absolute inset-0 pointer-events-none overflow-hidden bg-black">
            <FloatingPaths position = {1} /> {/* +ve position for 1 flow direction */}
            <FloatingPaths position = {-1} /> {/* -ve position for inverse flow direction */}

            {/* Vignette to fade edges */}
            <div className = "absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-40" />
        </div>

    )

}
