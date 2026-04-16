// LoadingSpinner.jsx


const LoadingSpinner = () => {

    return (

        // "flex justify-center items-center min-h-screen" centers the spinner in the middle of the page
        <div className = "flex justify-center items-center min-h-screen bg-[#09090b]">
            <div className = 'relative'>
                {/* Ambient glow behind the loading spinner */}
                <div className = "absolute inset-0 rounded-full blur-xl bg-orange-500/20 animate-pulse" />

                {/* Actual spinner */}
                <div className = "h-16 w-16 animate-spin rounded-full border-4 border-zinc-800 border-t-orange-500 border-r-pink-500" />
            </div>
        </div>

    )

}


export default LoadingSpinner
