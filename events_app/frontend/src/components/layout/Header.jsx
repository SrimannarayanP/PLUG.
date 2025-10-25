// Header.jsx


import React, {useState} from 'react';
import {Menu, X} from 'lucide-react';
import AnimatedBorderButton from '../ui/AnimatedBorderButton';


const Header = () => {

    const [isOpen, setIsOpen] = useState(false);

    const HeaderButton = ({children}) => (

        <button className = "bg-gray-200 text-black text-sm font-semibold px-4 py-1.5 rounded-full hover:bg-white transition-colors duration-300">
        {/* Basically this button has a gray background (200 means the shade of the color), black text, small font size (Tailwind's default small setting), semi-bold font weight, padding on x-axis of 4 and y-axis of 1.5, fully rounded corners, hover effect to change background to White and transition effect for colors with duration of 300ms. */}

            {children}  {/* This will be the the text on the button */}

        </button>

    );

    return (

        <header className = "fixed top-0 left-0 w-full z-50 p-4 text-white"> 
        {/* This header has a fixed position at the top left corner, full width, pops out of the screen 50 levels (z-50), padding of 4 (This 4 is in terms of Tailwind CSS' unit - almost 16px/1rem of padding is applied) from all sides & White text color. */}

            <div className = "w-full max-w-5xl mx-auto"> 
            {/* This div has a full width but a maximum width of 5xl (xl is a preset size in Tailwind) (which is 64rem or 1024px in Tailwind CSS) and is centered horizontally (x-axis) using auto margins on left & right. */}
                <div className = "flex justify-between items-center bg-gray-900/60 backdrop-blur-lg border border-gray-700 rounded-full p-2 px-4 sm:px-6"> {/* sm stands for small, lg - large */}
                {/* This div is a flex container with space between items (justify-between), items are centered vertically (items-center), has a semi-transparent dark gray background (gray-900 with 60% opacity), a backdrop blur effect with somewhat of a larger intensity, a border with dark gray color (gray-700), fully rounded corners, padding of 2 from all sides and padding of 4 on x-axis for small screens and 6 for larger screens (6 only when min-width >= 640px/40rem) */}
                    <div className = "text-xl sm-text:2xl font-bold tracking-tight"> {/* sm-text:2xl means text size is 2xl when screen size is larger, else the text size will be xl, bold font weight & letter spacing is tight (the letters are closer together (-0.025em) */}
                        events.
                    </div>

                    <nav className = "hidden md:flex items-center gap-6 text-sm font-medium"> {/* md - medium*/}

                        <a href = '#features' className = "hover:text-red-400 transition-colors">Features</a> {/* Links to Features page, shows color red of shade 400 when hovered upon, transition effect for colors */}
                        <a href = '#pricing' className = "hover:text-red-400 transition-colors">Pricing</a>
                        <a href = '#about' className = "hover:text-red-400 transition-colors">About</a>
                        <a href = '#contact' className = "hover:text-red-400 transition-colors">Contact</a>

                    </nav>
                    {/* This nav is hidden on screens lesser than md size & on bigger screens, it has a flex display. Items are centered, gap b/w each item is 6, font size is small, medium font weight */}

                    <div className = "hidden md:flex items-center gap-4"> {/* This div is hidden on screens smaller than md size & on bigger screens, it has a flex display. Items are centered, gap b/w each item is 4 */}

                        <button className = "text-sm font-medium hover:text-red-400 transition-colors">Log In</button>
                        <AnimatedBorderButton>Get Started</AnimatedBorderButton>

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
