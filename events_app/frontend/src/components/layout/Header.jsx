// Header.jsx


import {useState, useEffect} from 'react'
import {Menu, X, Zap} from 'lucide-react'
import {useNavigate, Link} from 'react-router-dom'
import {jwtDecode} from 'jwt-decode'

import {ACCESS_TOKEN} from '../../constants'

import AnimatedBorderButton from '../ui/AnimatedBorderButton' 


const Header = () => {

    const [isOpen, setIsOpen] = useState(false)
    const [userRole, setUserRole] = useState(null)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const navigate = useNavigate()

    const festiveGradient = "bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600"
    const festiveTextGradient = "text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600"

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
            navigate('/student/dashboard')
        }
    }

    return (

        <header className = "fixed top-0 left-0 w-full z-50 p-4">
            <div className = "w-full max-w-7xl mx-auto">
                {/* Main Navbar Container */}
                <div className = "flex justify-between items-center bg-[#18181b]/80 backdrop-blur-md border border-zinc-800 rounded-full p-2 px-6 shadow-2xl">
                    {/* Logo */}
                    <Link
                        to = '/'
                        className = "text-2xl font-black tracking-tighter text-white uppercase flex items-center gap-1 group"
                    >
                        <Zap className = "w-6 h-6 text-white fill-white group-hover:text-orange-500 transition-colors duration-300" />

                        PLUG

                        <span className = {festiveTextGradient}>.</span>
                    </Link>

                    {/* Desktop Menu Bar */}
                    <nav className = "hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-zinc-400">
                        <Link
                            to = '/'
                            className = "hover:text-white transition-colors duration-300"
                        >
                            Discover
                        </Link>

                        {userRole === 'host' && (
                            <Link
                                to = '/host/create-event'
                                className = "hover:text-white transition-colors duration-300"
                            >
                                Create
                            </Link>
                        )}
                    </nav>

                    {/* Action Buttons */}
                    <div className = "hidden md:flex items-center gap-6">
                        {isLoggedIn ? (
                            <>
                                <button
                                    onClick = {handleLogout}
                                    className = "text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                                >
                                    Log Out
                                </button>

                                <div onClick = {handleDashboardClick}>
                                    <AnimatedBorderButton>
                                        {userRole === 'host' 
                                            ? "Host Dashboard" 
                                            : "My Tickets"
                                        }
                                    </AnimatedBorderButton>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link to = '/login'>
                                    <AnimatedBorderButton>Sign In</AnimatedBorderButton>
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <div className = 'md:hidden'>
                        <button
                            onClick = {() => setIsOpen(!isOpen)}
                            className = "focus:outline-none p-2 text-zinc-400 hover:text-white transition-colors"
                        >
                            {isOpen 
                                ? <X size = {24} /> 
                                : <Menu size = {24} />
                            }
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {isOpen && (
                    <div className = "md:hidden mt-2 bg-[#18181b] border border-zinc-800 rounded-2xl p-6 animate-in slide-in-from-top-5 shadow-2xl duration-300">
                        <nav className = "flex flex-col gap-6 text-center">
                            <Link
                                to = '/'
                                onClick = {() => setIsOpen(false)}
                                className = "text-zinc-400 hover:text-white text-sm font-bold uppercase tracking-widest"
                            >
                                Discover
                            </Link>

                            {userRole === 'host' && (
                                <Link 
                                    to = '/host/create-event'
                                    onClick = {() => setIsOpen(false)}
                                    className = "text-zinc-400 hover:text-white text-sm font-bold uppercase tracking-widest"
                                >
                                    Create Event
                                </Link> 
                            )}

                            <div className = "h-px bg-zinc-800 w-full my-2"></div>

                            {isLoggedIn ? (
                                <>
                                    <div onClick = {() => {handleDashboardClick(); setIsOpen(false)}}>
                                        <button className = {`w-full py-3 rounded-xl text-white font-bold uppercase tracking-wider text-sm ${festiveGradient}`}>
                                            {userRole === 'host' ? "Host Dashboard" : "My Tickets"}
                                        </button>
                                    </div>

                                    <button
                                        onClick = {handleLogout}
                                        className = "text-zinc-500 hover:text-red-400 text-xs font-bold uppercase tracking-widest"
                                    >
                                        Log Out
                                    </button>
                                </>
                            ) : (
                                <Link
                                    to = '/login'
                                    onClick = {() => setIsOpen(false)}
                                >
                                    <button className = {`w-full py-3 rounded-xl text-white font-bold uppercase tracking-wider text-sm ${festiveGradient}`}>
                                        Sign In
                                    </button>
                                </Link>
                            )}
                        </nav>
                    </div>
                )}
            </div>
        </header>

    )

}


export default Header
