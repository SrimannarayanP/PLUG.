// AnimatedIsometricBackground.jsx


import React from 'react';


const AnimatedIsometricBackground = () => {

    return (

        <svg className = "absolute top-0 left-0 w-full h-full z-0" xmlns = 'http://www.w3.org/2000/svg' viewBox = "0 0 100 50" preserveAspectRatio = "xMidYMid slice">

            <defs>

                <linearGradient id = 'glowGradient' x1 = '0%' y1 = '0%' x2 = '100%' y2 = '100%'>

                    <stop offset = '0%' style = {{stopColor : '#f87171', stopOpacity : 1}}></stop> 
                    <stop offset = '100%' style = {{stopColor : '#ef4444', stopOpacity : 1}}></stop>

                </linearGradient>

                <style>

                    {`
                    
                        .path-animate {
                        
                            stroke-dasharray : 1000;
                            stroke-dashoffset : 1000;
                            animation : dash 20s linear infinite;
                        
                        }

                        
                        @keyframes dash {
                        
                            from {
                            
                                stroke-dashoffset : 2000;

                            }

                            to {
                            
                                stroke-dashoffset : 0;
                            
                            }

                        }

                        .grid-line {
                        
                            stroke : #1f2937;
                            stroke-width : 0.1;
                        
                        }

                    `}

                </style>

            </defs>

            <g id = 'grid'>

                <path className = 'grid-line' d = "M0 12.5 L100 37.5"/>
                <path className = 'grid-line' d = "M0 37.5 L100 12.5"/>
                <path className = 'grid-line' d = "M25 6.25 L75 18.75"/>
                <path className = 'grid-line' d = "M25 43.75 L75 18.75"/>
                <path className = 'grid-line' d = "M50 0 L100 12.5 L50 25 L0 12.5 Z"/>
                <path className = 'grid-line' d = "M50 25 L100 37.5 L50 50 L0 37.5 Z"/>
                <path className = 'grid-line' d = "M-10 18.75 L40 3.75"/>
                <path className = 'grid-line' d = "M60 12.5 L110 31.25"/>

            </g>

            <g id = 'highlights' className = 'opacity-70'>

                <path className = 'path-animate' d = "M0 25 L50 12.5 L100 25 L50 37.5 Z" stroke = 'url(#glowGradient)' fill = 'none' strokeWidth = '0.3'/>
                <path className = 'path-animate' d = "M50 0 L100 12.5 L75 18.75 L50 12.5 L25 18.75 L0 12.5 L25 6.25 Z" stroke = 'url(#glowGradient)' fill = 'none' strokeWidth = '0.3' style = {{animationDelay : '-10s', animationDirection : 'reverse'}}/>
                <path className = 'path-animate' d = "M0 37.5 L25 43.75 L50 37.5 L75 43.75 L100 37.5" stroke = 'url(#glowGradient)' fill = 'none' strokeWidth = '0.3' style = {{animationDelay : '-5s'}}/>
                
            </g>

        </svg>

    );

};


export default AnimatedIsometricBackground;




// "use client"; // Indicates that the component has to be processed on the client side


// import React from 'react';
// import {motion} from 'framer-motion';



// function FloatingPaths({position}) {

//     const paths = Array.from({length : 36}, (_, i) => ({

//         id : i,
//         d : `M-${380 - i * 5 * position} -${189 + i * 6}C - ${380 - i * 5 * position} -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${152 - i * 5 * position} ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${684 - i * 5 * position} ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}}`,
//         color : `rgba(15, 23, 42, ${0.1 + i * 0.03})`,
//         width : 0.5 + i * 0.03,

//     }));

//     return (

//         <div className = "absolute inset-0 pointer-events-none">

//             <svg className = "w-full h-full text-slate-950 dark:text-white" viewBox = "0 0 696 316" fill = 'none'>

//                 {paths.map((path) => {

//                     <motion.path 
//                         key = {path.id} 
//                         d = {path.d} 
//                         stroke = 'currentColor' 
//                         strokeWidth = {path.width} 
//                         strokeOpacity = {0.1 + path.id * 0.03} 
//                         initial = {{pathLength : 0.3, opacity : 0.6}} 
//                         animate = {{

//                             pathLength : 1,
//                             opacity : [0.3, 0.6, 0.3],
//                             pathOffset : [0, 1, 0]

//                         }}
//                         transition = {{

//                             duration : 20 + Math.random() * 10,
//                             repeat : Number.POSITIVE_INFINITY,
//                             ease : 'linear'

//                         }} />

//                 })}

//             </svg>

//         </div>
//     );

// }


// export default function App({

    

// })

