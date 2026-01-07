// Footer.jsx


import AnimatedBorderButton from '../ui/AnimatedBorderButton'


const Footer = () => {

    <footer className = "bg-gray-900 text-gray-400">
    {/* This footer has a Gray background of shade 900 with Gray text of shade 400 */}
        <div className = "container mx-auto py-12 px-4">
        {/* Container with auto horizontal margins, padding of 12 on the y-axis & padding of 4 on the x-axis */}
            <div className = "text-center mb-8 border-b border-gray-800 pb-8">
            {/* Centered text with bottom margin of 8 & a Gray bottom border of shade 800 with a padding of 8 from the bottom border */}
                <h2 className = "text-3xl font-bold text-white mb-2">Ready to Dive In?</h2>
                {/* Text with a size of 3xl, bold font style, White text, bottom margin of 2 units */}

                <p className = "mb-6">Join thousands of students & make your campus life unforgettable.</p>
                {/* Text with a bottom margin of 6 units */}

                <AnimatedBorderButton className = "h-14 w-64 text-lg">Sign Up Now - It's Free!</AnimatedBorderButton>
            </div>

            <div className = "flex flex-col md:flex-row justify-between items-center text-sm">
            {/* Flex container with row direction on screens bigger than medium size & column direction on smaller screens, justified spacing between items, centered items, small text size  */}
                <p>&copy; 2025 events. All rights reserved.</p>

                <div className = "flex flex-col md:flex-row justify-between items-center text-sm">
                    <a href = '#' className = "hover:text-white">Privacy Policy</a>

                    <a href = '#' className = "hover:text-white">Terms of Service</a>

                    <a href = '#' className = "hover:text-white">Contact Us</a>
                </div>
            </div>
        </div>
    </footer>

}


export default Footer
