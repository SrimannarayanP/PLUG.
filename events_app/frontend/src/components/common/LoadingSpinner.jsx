// LoadingSpinner.jsx


const LoadingSpinner = () => {

    return (

        // "flex justify-center items-center min-h-screen" centers the spinner in the middle of the page
        <div className = "flex justify-center items-center min-h-screen bg-[#09090b]">
            <div className = "relative flex items-center justify-center">
                {/* Ambient glow behind the loading spinner */}
                <div
                    className = "absolute h-32 w-32 animate-pulse transform-gpu"
                    style = {{background : 'radial-gradient(circle, rgba(249, 115, 22, 0.15) 0%, transparent 70%)'}}
                />

                {/* Actual spinner */}
                <div className = "h-16 w-16 animate-spin rounded-full border-4 border-zinc-800 border-t-orange-500 border-r-pink-500 relative z-10 transform-gpu" />
            </div>
        </div>

    )

}


export default LoadingSpinner
