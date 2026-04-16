// AnimatedIsometricBackground.jsx


const AnimatedIsometricBackground = () => {

    return (

        <svg 
            className = "absolute inset-0 w-full h-full z-0 pointer-events-none"
            xmlns = 'http://www.w3.org/2000/svg'
            viewBox = "0 0 100 60"
            preserveAspectRatio = "xMidYMid slice"
        >
            <defs>
                <linearGradient 
                    id = 'glowGradient' 
                    x1 = '0%' 
                    y1 = '0%' 
                    x2 = '100%' 
                    y2 = '100%'
                >
                    <stop 
                        offset = '0%' 
                        style = {{
                            stopColor : '#f87171', 
                        }}
                    />

                    <stop 
                        offset = '100%' 
                        style = {{
                            stopColor : '#ef4444', 
                        }} 
                    />
                </linearGradient>

                <style>
                    {`
                        .grid-line {
                            stroke : #1f2937;
                            stroke-width : 0.1;
                            vector-effect : non-scaling-stroke;
                            opacity : 0.6;
                        }
                        
                        .path-animate {
                            stroke-dasharray : 1000;
                            stroke-dashoffset : 1000;
                            animation : dash 22s linear infinite;
                        }

            
                        @keyframes dash {
                            from {
                                stroke-dashoffset : 2000;
                            }

                            to {
                                stroke-dashoffset : 0;
                            }
                        }

                        // For smaller screens
                        @media (max-width : 768px) {
                            .path-animate {
                                animation-duration : 30s;
                                opacity : 0.5;
                            }
                        }
                        
                        @media (prefers-reduced-motion : reduce) {
                            .path-animate {
                                animation : none;
                                stroke-dashoffset : 0;
                            }
                        }
                    `}
                </style>
            </defs>

            <g id = 'grid'>
                <path
                    className = 'grid-line'
                    d = "M0 15 L100 40"
                />

                <path
                    className = 'grid-line'
                    d = "M0 40 L100 15"
                />

                <path
                    className = 'grid-line'
                    d = "M25 8 L75 20"
                />

                <path
                    className = 'grid-line'
                    d = "M25 48 L75 20"
                />

                <path
                    className = 'grid-line'
                    d = "M50 0 L100 15 L50 30 L0 15 Z"
                />
                
                <path
                    className = 'grid-line'
                    d = "M50 30 L100 45 L50 60 L0 45 Z"
                />

                <path 
                    className = 'grid-line' 
                    d = "M10 22 L40 6" 
                />

                <path 
                    className = 'grid-line' 
                    d = "M60 15 L110 35" 
                />
            </g>

            <g
                id = 'highlights'
                className = 'opacity-70'
            >
                <path
                    className = 'path-animate'
                    d = "M0 30 L50 15 L100 30 L50 45 Z"
                    stroke = 'url(#glowGradient)'
                    fill = 'none'
                    strokeWidth = '0.3'
                />

                <path
                    className = 'path-animate'
                    d = "M50 0 L100 15 L75 20 L50 15 L25 20 L0 15 L25 8 Z"
                    stroke = 'url(#glowGradient)'
                    fill = 'none'
                    strokeWidth = '0.3'
                    style = {{
                        animationDelay : '-12s', 
                        animationDirection : 'reverse'
                    }}
                />

                <path
                    className = 'path-animate'
                    d = "M0 45 L25 52 L50 45 L75 52 L100 45"
                    stroke = 'url(#glowGradient)'
                    fill = 'none'
                    strokeWidth = '0.3'
                    style = {{animationDelay : '-6s'}}
                />
            </g>
        </svg>

    )

}


export default AnimatedIsometricBackground
