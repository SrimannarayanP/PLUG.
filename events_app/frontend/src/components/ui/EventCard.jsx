// EventCard.jsx

import React from 'react'


const API_BASE_URL = import.meta.env.VITE_API_URL

const EventCard = ({event, onRegisterClick, onDetailsClick}) => {

    const posterUrl = event.poster_image
                        ? `${API_BASE_URL}${event.poster_image}`
                        : null;

    return (

        <div className = "bg-white rounded-xl shadow-lg overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl">

            {/* Image section */}
            {posterUrl ? (
                // If an image exists, render it
                <div className = "h-48 w-full overflow-hidden">
                    <img 
                        src = {posterUrl}
                        alt = {event.event_name}
                        className = "w-full h-full object-cover"
                    />
                </div>
            ) : (
                // Fallback for events with no image
                <div className = "h-48 w-full flex items-center justify-center" style = {{backgroundColor : '#eae5dc'}}>
                    <span className = 'text-sm' style = {{color : '#6f2d37'}}>No Image</span>
                </div>
            )}

            {/* Content section */}
            {/* 'flex-1' ensures this section expands to fill remaining space */}
            {/* "flex flex-col" ensures that button is placed at the bottom */}
            <div className = "p-6 flex flex-col justify-between flex-1">

                {/* Top half of the content */}
                <div>

                    {/* Categories */}
                    <div className = "mb-2">
                        {event.categories.map((category) => (
                            <span
                                key = {category}
                                className = "inline-block text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full"
                                style = {{backgroundColor : '#6f2d371a', color : '#6f2d37'}}
                            >
                                {category}
                            </span>
                        ))}
                    </div>

                    {/* Event name */}
                    <h3 className = "text-2xl font-bold mb-1" style = {{color : '#6f2d37'}}>
                        {event.event_name}
                    </h3>

                    {/* Organiser name */}
                    <p className = "text-sm text-gray-500 mb-2">
                        Hosted by:
                        <span className = "font-medium text-gray-700">
                            {event.organiser}
                        </span>
                    </p>

                    {/* Date & location */}
                    <div className = "text-sm text-gray-600 space-y-1 mb-4">
                        <p><strong>When:</strong> {event.start_date}</p>
                        <p><strong>Where:</strong> {event.location}</p>
                    </div>
                </div>

                {/* Button section */}
                <div>
                    {event.is_native ? (
                        <button
                            onClick = {(e) => {
                                e.stopPropagation()
                                onRegisterClick(event)
                            }}
                            className = "w-full px-4 py-2 rounded-lg text-white font-semibold transition-colors duration-200"
                            style = {{backgroundColor : '#c90000'}}
                            // Hover effect
                            onMouseOver = {(e) => e.currentTarget.style.backgroundColor = '#a30000'}
                            onMouseOut = {(e) => e.currentTarget.style.backgroundColor = '#c90000'}
                        >
                            Register Now
                        </button>
                    ) : (
                        <a
                            href = {event.register_link}
                            target = '_blank'
                            rel = "noopener noreferrer"
                            className = "block w-full text-center px-4 py-2 rounded-lg text-white font-semibold transition-colors duration-200"
                            style = {{backgroundColor : '#265742'}}
                            // Hover effect
                            onMouseOver = {(e) => e.currentTarget.style.backgroundColor = '#1a3a2b'}
                            onMouseOut = {(e) => e.currentTarget.style.backgroundColor = '#265742'}
                        >
                            Register (External)
                        </a>
                    )}
                </div>
            </div>

        </div>

    )

}


export default EventCard
