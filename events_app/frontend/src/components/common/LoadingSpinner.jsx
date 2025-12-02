// LoadingSpinner.jsx



import React from 'react'


const LoadingSpinner = () => {

    return (
        // "flex justify-center items-center min-h-screen" centers the spinner in the middle of the page
        <div className = "flex justify-center items-center min-h-screen">
            {/* "border-t-2 border-b-2" creates the 'gap' in the circle */}
            <div
                className = "animate-spin rounded-full h-32 w-32 border-t-2 border-b-2"
                style = {{borderColor : '#6f2d37'}}
            ></div>
        </div>
    )

}


export default LoadingSpinner
