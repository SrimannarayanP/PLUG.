// Footer.jsx


import {Link} from 'react-router-dom'

import AnimatedBorderButton from '../ui/AnimatedBorderButton'

import {useAuth} from '../../context/AuthContext'
import { isAxiosError } from 'axios'


const Footer = () => {

    const {isAuthenticated} = useAuth()

    const currentYear = new Date().getFullYear()

    return (

        <footer className = "bg-[#121215] border-t border-zinc-800/50 text-zinc-400 mt-auto relative z-10">
        {/* This footer has a Gray background of shade 900 with Gray text of shade 400 */}
            <div className = "container mx-auto px-4 py-12">
            {/* Container with auto horizontal margins, padding of 12 on the y-axis & padding of 4 on the x-axis */}
                {!isAuthenticated && (
                    <div className = "text-center mb-8 border-b border-zinc-800/50 pb-8">
                    {/* Centered text with bottom margin of 8 & a Gray bottom border of shade 800 with a padding of 8 from the bottom border */}
                        <h2 className = "text-3xl font-bold text-white mb-2">Ready to Dive In?</h2>
                        {/* Text with a size of 3xl, bold font style, White text, bottom margin of 2 units */}

                        <p className = "mb-6 text-zinc-400">
                            Join thousands of students & make your campus life unforgettable.
                        </p>
                        {/* Text with a bottom margin of 6 units */}

                        <AnimatedBorderButton className = "h-14 w-64 text-lg">
                            Sign Up Now - It's Free!
                        </AnimatedBorderButton>
                    </div>
                )}

                <div className = "flex flex-col md:flex-row justify-between items-center text-sm gap-4">
                {/* Flex container with row direction on screens bigger than medium size & column direction on smaller screens, justified spacing between items, centered items, small text size  */}
                    <p>&copy; {currentYear} PLUG. All rights reserved.</p>

                    <div className = "flex flex-col md:flex-row items-center gap-4 md:gap-6 text-sm">
                        <Link
                            to = '/privacy-policy'
                            className = "hover:text-white transition-colors"
                        >
                            Privacy Policy
                        </Link>

                        <Link
                            to = '/terms-conditions'
                            className = "hover:text-white transition-colors"
                        >
                            Terms of Service
                        </Link>

                        <Link
                            to = '/refund-policy'
                            className = "hover:text-white transition-colors"
                        >
                            Refund Policy
                        </Link>

                        <Link
                            to = '/contact-us'
                            className = "hover:text-white transition-colors"
                        >
                            Contact Us
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    
    )

}


export default Footer
