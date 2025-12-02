// Header.jsx


import React, {useState, useEffect} from 'react';
import {Menu, X} from 'lucide-react';
import {useNavigate, Link} from 'react-router-dom'

import AnimatedBorderButton from '../ui/AnimatedBorderButton';
import {ACCESS_TOKEN} from '../../constants'
import {jwtDecode} from 'jwt-decode' 


const Header = () => {

    const [isOpen, setIsOpen] = useState(false)
    const [userRole, setUserRole] = useState(null)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        checkAuthStatus()

        window.addEventListener('storage', checkAuthStatus)

        return () => window.removeEventListener('storage', checkAuthStatus)
    }, [])

    const checkAuthStatus = () => {
        const token = localStorage.getItem(ACCESS_TOKEN)

        if (!token) {
            setIsLoggedIn(false)
            setUserRole(null)
            
            return
        }

        try {
            const decoded = jwtDecode(token)
            const tokenExpiration = decoded.exp
            const now = Date.now() / 1000

            if (tokenExpiration < now) {
                // Token is expired
                handleLogout()
            } else {
                // Token is valid
                setIsLoggedIn(true)
                setUserRole(decoded.role)
            }
        } catch (error) {
            // Token is corrupt
            handleLogout()
        }
    }

    const handleLogout = () => {
        localStorage.clear()
        
        setIsLoggedIn(false)
        setUserRole(null)

        navigate('/login')
    }

    const handleDashboardClick = () => {
        if (userRole === 'host') {
            navigate('/host/dashboard')
        } else {
            navigate('/student_dashboard')
        }
    }

    return (

        <header className = "fixed top-0 left-0 w-full z-50 p-4 text-white"> 
        {/* This header has a fixed position at the top left corner, full width, pops out of the screen 50 levels (z-50), padding of 4 (This 4 is in terms of Tailwind CSS' unit - almost 16px/1rem of padding is applied) from all sides & White text color. */}
            <div className = "w-full max-w-7xl mx-auto"> 
            {/* This div has a full width but a maximum width of 5xl (xl is a preset size in Tailwind) (which is 64rem or 1024px in Tailwind CSS) and is centered horizontally (x-axis) using auto margins on left & right. */}
                <div className = "flex justify-between items-center bg-[#6f2d37]/90 backdrop-blur-lg border border-[#c90000]/30 rounded-full p-2 px-4 sm:px-6 shadow-lg shadow-[#6f2d37]/20"> {/* sm stands for small, lg - large */}
                {/* This div is a flex container with space between items (justify-between), items are centered vertically (items-center), has a semi-transparent dark gray background (gray-900 with 60% opacity), a backdrop blur effect with somewhat of a larger intensity, a border with dark gray color (gray-700), fully rounded corners, padding of 2 from all sides and padding of 4 on x-axis for small screens and 6 for larger screens (6 only when min-width >= 640px/40rem) */}
                    {/* text:2xl means text size is 2xl, letter spacing is tight (the letters are closer together (-0.025em), black font, Outfit font style & text colour of #eae5dc */}
                    <Link 
                        to = '/'
                        className = "text-2xl font-black tracking-tight font-outfit text-[#eae5dc]"
                    >
                        events.
                    </Link> 

                    {/* This nav is hidden on screens lesser than md size & on bigger screens, it has a flex display. Items are centered, gap b/w each item is 8, font size is small, medium font weight, text colour of #eae5dc with 80 opacity */}
                    <nav className = "hidden md:flex items-center gap-8 text-sm font-medium text-[#eae5dc]/80"> {/* md - medium*/}
                        {/* Links to Discover page, shows color red of shade 400 when hovered upon, transition effect for colors */}
                        <Link 
                            to = '/'
                            className = "hover:text-[#eae5dc] transition-colors"
                        >
                            Discover
                        </Link>

                        {userRole === 'host' && (
                            <Link
                                to = '/host/create-event'
                                className = "hover:text-[#eae5dc] transition-colors"
                            >
                                Create
                            </Link>
                        )}
                    </nav>

                    <div className = "hidden md:flex items-center gap-4"> {/* This div is hidden on screens smaller than md size & on bigger screens, it has a flex display. Items are centered, gap b/w each item is 4 */}
                        {isLoggedIn ? (
                            <>
                                <button
                                    onClick = {handleLogout}
                                    className = "text-sm font-medium text-[#eae5dc] hover:text-white transition-colors"
                                >
                                    Log Out
                                </button>

                                <div onClick = {handleDashboardClick}>
                                    <AnimatedBorderButton>{userRole === 'host' ? "Host Dashboard" : "My Tickets"}</AnimatedBorderButton>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link
                                    to = '/login'
                                    className = "text-sm font-medium text-[#eae5dc] hover:text-white transition-colors"
                                >
                                    Log In
                                </Link>

                                <Link to = '/login'>
                                    <AnimatedBorderButton>Get Started</AnimatedBorderButton>
                                </Link>
                            </>
                        )}
                    </div>
                    
                    <div className = 'md:hidden'> {/* This div is only for the screen sizes smaller than md*/}

                        <button onClick = {() => setIsOpen(!isOpen)} className = "focus:outline-none p-2"> {/* Removes browser's default outline when clicked upon */}

                            {isOpen ? <X size = {24} /> : <Menu size = {24} />} {/* If isOpen is true, show X (cross) icon else show Menu (hamburger) icon. Size of both icons is 24px */}

                        </button>

                    </div>

                    {/* If isOpen is true, show the following div */}
                    {isOpen && (    
                        
                        <div className = "md:hidden mt-2 bg-gray-900/80 backdrop-blur-lg rounded-2xl p-4 border border-gray-700">
                        {/* This screen is only for sizes smaller than md, has a top margin of 2, Gray background of shade 900 with 80% opacity, large backdrop blur effect, rounded corners of 2xl size, padding of 4 on all sides, border with Gray color of shade 700 */}
                            
                            <nav className = "flex flex-col gap-4 text-center">
                            {/* This nav bar has a flex display with column direction, gap of 4 b/w each item & text is centered. */}

                                <a href = '#features' onClick = {() => setIsOpen(false)} className = "hover:text-red-400 transition-colors">Features</a> {/* Links to features page, shows Red of shade 400 whe hovered upon with a transition effect. Only works when setIsOpen is false*/}
                                <a href = '#pricing' onClick = {() => setIsOpen(false)} className = "hover:text-red-400 transition-colors">Pricing</a>
                                <a href = '#about' onClick = {() => setIsOpen(false)} className = "hover:text-red-400 transition-colors">About</a>
                                <a href = '#contact' onClick = {() => setIsOpen(false)} className = "hover:text-red-400 transition-colors">Contact</a>

                            </nav>


                        </div>

                    )} 

                </div>

            </div>

        </header>

    );

}


export default Header;
