// SolidAnimatedButton.jsx


import React from 'react';


const SolidAnimatedButton = ({type = 'submit', children, disabled = false}) => (

    <button 
        type = {type}
        disabled = {disabled} 
        className = "relative group w-full text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500 transition-transform duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden">

            <span className = "absolute inset-0 bg-gradient-to-r from-[#f87171] to-[#ef4444]"></span>
            <span className = "absolute inset-0 bg-gradient-to-r from-[#ef4444] to-[#f87171] opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out"></span>
            <span className = "relative z-10">

                {disabled ? "Logging In..." : children} 

            </span>

    </button>

);


export default SolidAnimatedButton;
