// Header.jsx


import {Building2, ChevronDown, GraduationCap, LayoutDashboard, LogOut, Menu, Ticket, User, X} from 'lucide-react'
import {useEffect, useRef, useState} from 'react'
import {Link, useNavigate, useLocation} from 'react-router-dom'

import {useAuth} from '../../context/AuthContext'

import Logo from '../common/Logo'

import AnimatedBorderButton from '../ui/AnimatedBorderButton'


const Header = () => {

    const {isAuthenticated, user, logout} = useAuth()

    const [isOpen, setIsOpen] = useState(false)
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)

    const managesHost = Boolean(user?.profile?.host_type)

    const navigate = useNavigate()
    const location = useLocation()
    const dropdownRef = useRef(null)

    const isHostRoute = location.pathname.startsWith('/host')

    const festiveGradient = "bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600"
    
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20)

        window.addEventListener('scroll', handleScroll)

        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    // Close mobile menu when route changes
    useEffect(() => {
        setIsOpen(false)
        setIsProfileDropdownOpen(false)
    }, [location.pathname])

    // Close dropdown if clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsProfileDropdownOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)

        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleLogout = () => {
        logout()

        setIsOpen(false)

        navigate('/login')
    }

    const handleDashboardClick = () => {
        setIsOpen(false)

        if (isHostRoute) {
            navigate('/host/dashboard')
        } else {
            navigate('/student/dashboard')
        }
    }

    return (

        <header className = {`
            fixed top-0 left-0 w-full z-50 transition-all duration-300 
            ${isScrolled 
                ? 'py-3' 
                : "py-4 md:py-6"
            }
        `}>
            <div className = "w-full max-w-7xl mx-auto px-4 sm:px-6 relative">
                {/* Main Navbar Container */}
                <div className = {`
                    flex justify-between items-center rounded-full p-2 pl-5 pr-3 md:px-6 transition-all duration-300
                    ${isScrolled
                        ? "bg-[#18181b]/90 backdrop-blur-xl border border-zinc-800 shadow-xl"
                        : "bg-[#18181b]/60 backdrop-blur-md border border-white/5"
                    }
                `}>
                    {/* Logo */}
                    <Link
                        to = '/'
                        className = "flex items-center gap-2 group z-50 shrink-0"
                    >
                        <Logo
                            className = "h-8 w-8"
                            showText = {true}
                            textSize = "text-xl md:text-2xl"
                        />
                    </Link>

                    {/* Desktop Menu Bar */}
                    <nav className = "hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-zinc-400 absolute left-1/2 -translate-x-1/2">
                        <Link
                            to = '/'
                            className = "hover:text-white transition-colors duration-300"
                        >
                            Discover
                        </Link>

                        {isHostRoute && managesHost && (
                            <Link
                                to = '/host/create-event'
                                className = "hover:text-white transition-colors duration-300"
                            >
                                Create Event
                            </Link>
                        )}
                    </nav>

                    {/* Desktop Action Buttons */}
                    <div className = "hidden md:flex items-center gap-4 shrink-0">
                        {isAuthenticated ? (
                            <>
                                {managesHost && (
                                    <Link
                                        to = {isHostRoute ? '/' : '/host/dashboard'}
                                        className = "flex items-center gap-2 px-4 py-2 rounded-full font-bold uppercase tracking-widest text-[10px] transition-all bg-zinc-900 border border-zinc-800 hover:border-orange-500/50 text-zinc-400 hover:text-white"
                                    >
                                        {isHostRoute ? (
                                            <GraduationCap
                                                size = {14}
                                                className = 'text-blue-500'
                                            />
                                        ) : (
                                            <Building2
                                                size = {14}
                                                className = 'text-orange-500'
                                            />
                                        )}
                                    </Link>
                                )}

                                <div
                                    className = 'relative'
                                    ref = {dropdownRef}
                                >
                                    <button
                                        onClick = {() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                                        className = "group flex items-center gap-3 bg-zinc-800/50 hover:bg-zinc-800 text-white pl-1 pr-4 py-1.5 rounded-full border border-zinc-700 transition-all"
                                    >
                                        <div className = "h-7 w-7 rounded-full bg-gradient-to-tr from-orange-500 to-purple-600 flex items-center justify-center shadow-lg">
                                            <User className = "h-4 w-4 text-white" />
                                        </div>

                                        <span className = "text-xs font-bold uppercase tracking-wide">
                                            Account
                                        </span>

                                        <ChevronDown className = {`
                                            h-3 w-3 text-zinc-500 transition-transform duration-200
                                            ${isProfileDropdownOpen
                                                ? 'rotate-180'
                                                : ''
                                            }
                                        `}/>
                                    </button>

                                    {/* Desktop dropdown */}
                                    {isProfileDropdownOpen && (
                                        <div className = "absolute right-0 top-full mt-3 w-56 bg-[#18181b] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 origin-top-right">
                                            <div className = "flex flex-col text-sm font-medium text-zinc-300 py-1.5">
                                                <button
                                                    onClick = {handleDashboardClick}
                                                    className = "flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 transition-colors text-left hover:text-white"
                                                >
                                                    {isHostRoute ? (
                                                        <LayoutDashboard size = {16} />
                                                    ) : (
                                                        <Ticket size = {16} />
                                                    )}

                                                    {isHostRoute ? 'Dashboard' : "My Tickets"}
                                                </button>

                                                <Link
                                                    to = '/profile'
                                                    className = "flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 hover:text-white transition-colors"
                                                >
                                                    <User size = {16} />

                                                    My Profile
                                                </Link>

                                                <div className = "h-px bg-zinc-800 my-1 mx-4" />

                                                <button
                                                    onClick = {handleLogout}
                                                    className = "flex items-center gap-3 px-4 py-3 text-red-400 text-left hover:bg-red-500/10 transition-colors"
                                                >
                                                    <LogOut size = {16} />

                                                    Log Out    
                                                </button> 
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <Link to = '/login'>
                                <AnimatedBorderButton>Sign In</AnimatedBorderButton>
                            </Link>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <div className = "md:hidden flex items-center shrink-0">
                        <button
                            onClick = {() => setIsOpen(!isOpen)}
                            className = "p-2 text-zinc-400 hover:text-white transition-colors"
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
                    <div className = "absolute top-full left-0 w-full mt-4 px-4 md:hidden z-40">
                        <div className = "bg-[#18181b]/95 backdrop-blur-2xl border border-zinc-800 rounded-3xl p-6 shadow-2xl animate-in slide-in-from-top-2">
                            <nav className = "flex flex-col gap-4 text-center">
                                <Link
                                    to = '/'
                                    onClick = {() => setIsOpen(false)}
                                    className = "text-zinc-300 text-lg hover:text-white font-bold py-2"
                                >
                                    Discover
                                </Link>

                                {isHostRoute && managesHost && (
                                    <Link
                                        to = '/host/create-event'
                                        onClick = {() => setIsOpen(false)}
                                        className = "text-zinc-300 text-lg hover:text-white font-bold py-2"
                                    >
                                        Create Event
                                    </Link> 
                                )}

                                <div className = "h-px bg-zinc-800 w-full my-2" />

                                {isAuthenticated ? (
                                    <div className = "flex flex-col gap-3">
                                        <button
                                            onClick = {handleDashboardClick} 
                                            className = "w-full py-3.5 rounded-xl bg-white text-black font-bold uppercase text-sm shadow-lg active:scale-95 transition-transform"
                                        >
                                            {isHostRoute ? "Host Dashboard" : "My Tickets"}
                                        </button>

                                        {managesHost && (
                                            <Link
                                                to = {isHostRoute ? '/' : '/host/dashboard'}
                                                onClick = {() => setIsOpen(false)}
                                                className = "w-full py-3.5 rounded-xl text-white font-bold uppercase text-sm shadow-lg active:scale-95 transition-transform flex justify-center items-center gap-2 border border-zinc-700 bg-zinc-800/50"
                                            >
                                                {isHostRoute ? (
                                                    <GraduationCap
                                                        size = {16}
                                                        className = 'text-blue-500'
                                                    />
                                                ) : (
                                                    <Building2
                                                        size = {16}
                                                        className = 'text-orange-500'
                                                    />
                                                )}

                                                Switch to {isHostRoute ? "Student Mode" : "Host Mode"}
                                            </Link>
                                        )}

                                        <Link
                                            to = '/profile'
                                            onClick = {() => setIsOpen(false)}
                                            className = "py-2 text-zinc-400 text-sm hover:text-white font-bold uppercase tracking-widest mt-2"
                                        >
                                            My Profile
                                        </Link>

                                        <button
                                            onClick = {handleLogout}
                                            className = "py-2 text-red-400/90 text-sm hover:text-red-400 font-bold uppercase tracking-widest"
                                        >
                                            Log Out
                                        </button>
                                    </div>
                                ) : (
                                    <Link
                                        to = '/login'
                                        onClick = {() => setIsOpen(false)}
                                    >
                                        <button
                                            className = {`
                                                w-full py-3.5 rounded-xl text-white text-sm font-bold uppercase ${festiveGradient} shadow-lg active:scale-95
                                                transition-transform
                                            `}
                                        >
                                            Sign In
                                        </button>
                                    </Link>
                                )}
                            </nav>
                        </div>
                    </div>
                )}
            </div>
        </header>

    )

}


export default Header
