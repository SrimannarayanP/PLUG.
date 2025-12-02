// FeaturedEventHero.jsx

import React from 'react'


const API_BASE_URL = import.meta.env.VITE_API_URL


const FeaturedEventHero = ({event, onRegisterClick, onDetailsClick}) => {

    // We must add the full, absolute URL to the image. API will send a relative path. We prepend the relative path with our base URL from the .env file. There's a 
    // fallback also in case the event has no image.
    const posterUrl = event.poster_image
                        ? `${API_BASE_URL}${event.poster_image}`
                        : 'default-placeholder-image.png'

    return (

        // 'relative' : This is the parent container. We set this so that the text overlay (which is 'absolute') will adjust itself within the container.
        // 'overflow-hidden' : So that the image's rounded corners can be clipped.
        <div 
            className = "relative bg-black text-white rounded-xl shadow-2xl overflow-hidden mb-8 md:mb-12 transition-all duration-300 hover:shadow-red-500/30 cursor-pointer group"
            onClick = {() => onDetailsClick(event)}
        >

            {/* Background Image */}
            {/* "w-full h-96" sets a fixed height for the hero-section */}
            {/* 'object-cover' ensures that the image fills the container without stretching */}
            {/* 'opacity-50' makes the image semi-transparent so that the text can be placed on top of it */}
            <img
                src = {posterUrl}
                alt = {event.event_name}
                className = "w-full h-64 md:h-96 object-cover opacity-60 transition-transform duration-700 ease-out group-hover:scale-105"
            />

            {/* Text Overlay */}
            {/* "absolute top-0 left-0 w-full h-full" stretches the overlay to be the exact same size as the parent, sitting on top of the image.*/}
            {/* "flex flex-col justify-end" is a flex container that aligns all the text content to the bottom-left corner */}
            <div className = "absolute top-0 left-0 w-full h-full p-6 md:p-12 flex flex-col justify-end">

                {/* Featured badge */}
                <h2 className = "text-xs md:text-sm font-bold uppercase tracking-widest text-red-400 font-outfit mb-2">
                    Featured Event
                </h2>

                {/* Event name */}
                <h1 className = "text-3xl md:text-6xl font-black text-white mb-2 font-outfit leading-tight">
                    {event.event_name}
                </h1>

                {/* The event date */}
                <p className = "text-sm md:text-xl text-gray-200 mb-4">
                    {event.start_date}
                </p>

                <button
                    onClick = {(e) => {e.stopPropagation(); onRegisterClick(event);}}
                    className = "mt-2 px-6 py-3 md:py-2 rounded-lg text-white font-semibold text-sm md:text-base shadow-lg transform transition-transform active:scale-95"
                    style = {{backgroundColor : '#c90000', width : 'fit-content'}}
                >
                    Register Now
                </button>
            </div>
        </div>
    )

}


export default FeaturedEventHero
