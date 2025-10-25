// LandingPage.jsx


// import React from 'react';
import {ArrowRight, Calendar, Users, Heart, Mic, Film, Dumbbell, Code, Share2} from 'lucide-react';

import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import AnimatedIsometricBackground from '../components/ui/AnimatedIsometricBackground';
import AnimatedBorderButton from '../components/ui/AnimatedBorderButton';
import SpotlightCard from '../components/ui/SpotlightCard';


const HeroSection = () => (

    <section className = "relative min-h-screen flex items-center justify-center text-white text-center overflow-hidden">
    {/* Section with relative position, min height as screen height, flex display, centered items, center justified, White text, centered text, hidden overflow */}

        <AnimatedIsometricBackground />

        <div className = "relative z-10 p-4">

            <h1 className = "text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tighter mb-4 leading-tight" style = {{textShadow : "0px 4px 20px rgba(0, 0, 0, 0.5)"}}>
            {/* Text size of 7xl for screens greater than medium size, 5xl for small screens & 4xl for smaller screens, extra bold font style, tighter letter spacing, bottom margin of 4 units & tight line height */}

                Your Campus, Your Events.<br/><span className = "text-red-400"> Unforgettable.</span>

            </h1>

            <p className = "max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-gray-300 mb-8" style = {{textShadow : "0 2px 10px rgba(0, 0, 0, 0.7)"}}>
            {/* Text with max width of 2xl units, auto horizontal margins, base text size, xl text size for screen sizes greater than medium screen & large text size for screens greater than small but smaller than medium, Gray colored text of shade 300 & bottom margin of 8 units */}

                From workshops to parties, find everything happening around you in one place.

            </p>

            <div className = "flex flex-col sm:flex-row gap-4 justify-center">
            {/* Flex container in row direction for screens greater than small size & column direction for screens greater than small size, gap of 4 b/w each item, items are justified in the center */}

                <AnimatedBorderButton className = "h-14 w-64 text-lg">

                    <span className = "flex items-center justify-center gap-2">

                        Find Your Next Adventure <ArrowRight size = {20}/>

                    </span>

                </AnimatedBorderButton>

                <button className = "bg-gray-700 bg-opacity-50 hover:bg-opacity-80 border border-gray-600 text-white font-bold py-3 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                {/* Button with Gray background of shade 700, background opacity of 50 units, when hovered upon - the opacity changes to 80 units, Gray border of shade 600, White text, bold font, padding of 3 on the y-axis, padding of 8 on the x-axis, fully rounded corners, large text size, transition all the elements in the butotn for a duration of 300ms; the button will change its scale & a large shadow shows when interacted with */}

                    Host an Event

                </button>

            </div>
        </div>

    </section>

);
const ComputerLineArt = () => (

    <div className = "w-full h-full flex items-center justify-center p-4">

        <svg viewBox = "0 0 100 60" xmlns = 'http://www.w3.org/2000/svg' className = "w-full h-auto max-w-sm">

            <defs>

                <style>

                    {`
                    
                        .comp-line {
                        
                            stroke : #4b5563;
                            stroke-width : 0.5;
                            fill : none;

                        }

                        .comp-highlight {
                        
                            stroke : url(#glowGradient);
                            stroke-width : 0.6;
                            fill : none;

                        }

                        .path-animate-fast {
                        
                            stroke-dasharray : 500;
                            stroke-dashoffset : 500;
                            animation : dash-fast 8s linear infinite;
                        
                        }


                        @keyframes dash-fast {
                        
                            from {
                            
                                stroke-dashoffset : 1000;

                            }

                            to {
                            
                                stroke-dashoffset : 0;

                            }

                        }
                    
                    `}

                </style>

            </defs>
                        
            <rect x = '15' y = '5' width = '70' height = '40' rx = '3' className = 'comp-line'/>

            <path d = "M 18 10 H 82" className = "comp-highlight path-animate-fast" style = {{animationDelay : '-2s'}}/> {/* The animation will start as if it had already been playing for 2 sec */} 
            <path d = "M 18 15 H 60" className = 'comp-line'/>
            <path d = "M 18 20 H 75" className = "comp-highlight path-animate-fast"/>
            <path d = "M 18 25 H 50" className = 'comp-line'/>
            <path d = "M 18 30 H 82" className = "comp-highlight path-animate-fast" style = {{animationDelay : '-5s'}}/>
            <path d = "M 18 35 H 65" className = "comp-line"/>
            <path d = "M 45 45 L 40 55 H 60 L 55 45 Z" className = 'comp-line'/>

            <rect x = '35' y = '55' width = '30' height = '2' rx = '1' className = 'comp-line'/>

        </svg>

    </div>

);
const FeatureCard = ({icon, children, className, title, description}) => (

    <SpotlightCard className = {`flex flex-col ${className}`}>

        {children || (

            <> {/* This is basically a div but without a formal name for it. It doens't add nodes to the DOM tree & it's placed under the parent element*/}
            
                <div className = "text-red-400 mb-4">{icon}</div>

                <h3 className = "text-xl font-bold mb-2 text-white">{title}</h3>

                <p className = "text-gray-400 flex-grow">{description}</p>
            
            </>

        )}

    </SpotlightCard>

);
const FeaturesSection = () => (

    <section id = 'features' className = "relative py-20 px-4 bg-black text-white">

        <div className = "absolute top-0 left-0 w-full h-full z-0 opacity-10" style = {{backgroundImage : "radial-gradient(circle, rgba(239, 68, 68, 0.1) 0%, rgba(0, 0, 0, 0) 60%"}}></div>
        <div className = "container mx-auto relative z-10">
            <div className = "text-center mb-12">

                <h2 className = "text-3xl sm:text-4xl font-extrabold tracking-tight">An Ecosystem Built For Students</h2>

                <p className = "text-lg text-gray-400 mt-2 max-w-2xl mx-auto">Discover, create & connect like never before</p>

            </div>
            <div className = "grid grid-cols-1 md:grid-cols-3 gap-8">

                <FeatureCard className = "md:col-span-2 md:row-span-2 min-h-[300px]">

                    <div className = "flex flex-col md:flex-row h-full">
                        <div className = "md:w-1/2 p-4">
                            <div className = "text-red-400 mb-4"><Calendar size = {32} /></div>

                            <h3 className = "text-2xl font-bold mb-2 text-white">Discover What's On</h3>

                            <p className = "text-gray-400">Explore a central hub for all campus activites. From club events to guest lectures, find everything happening around you in one place.</p>

                        </div>
                        <div className = 'md:w-1/2'>
                        
                            <ComputerLineArt />
                        
                        </div>
                    </div>

                </FeatureCard>
                <FeatureCard icon = {<Users size = {32}/>} title = "RSVP in a Tap" description = "Instantly RSVP to save your spot & add events to your personal schedule. See which of your friends are going too." />
                <FeatureCard icon = {<Share2 size = {32}/>} title = "Coordinate with Friends" description = "Easily share events with your friends through anny app. Plan your week & make sure no one gets left behind." />

            </div>
        </div>

    </section>

);
const CategoryCard = ({icon, title, bgImage}) => (

    <div className = "group relative rounded-xl overflow-hidden w-64 h-80 flex-shrink-0 cursor-pointer snap-center">

        <img src = {bgImage} alt = {title} className = "absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"/>

        <div className = "absolute inset-0 bg-black bg-opacity-60 group-hover:bg-opacity-40 transition-all duration-300"></div>
        <div className = "relative h-full flex flex-col justify-end p-6 text-white">
            <div className = "text-red-400 mb-2 transition-transform duration-300 group-hover:-translate-y-1">{icon}</div>

            <h3 className = "text-2xl font-bold tracking-tight">{title}</h3>

        </div>

    </div>

);
const CategoriesSection = () => {

    const Categories = [

        {icon : <Mic size = {32}/>, title : "Concerts & Shows", bgImage : ''},
        {icon : <Dumbbell size = {32}/>, title : "Sports & Wellness", bgImage : ''},
        {icon : <Code size = {32}/>, title : "Tech & Workshops", bgImage : ''},
        {icon : <Film size = {32}/>, title : "Arts & Culture", bgImage : ''},
        {icon : <Users size = {32}/>, title : "Social Mixers", bgImage : ''},
        {icon : <Heart size = {32}/>, title : "Volunteering", bgImage : ''}

    ];

    return (

        <section id = 'categories' className = "py-20 bg-black text-white">

            <div className = "container mx-auto">
                <div className = "text-center mb-12 px-4">

                    <h2 className = "text-3xl sm:text-4xl font-extrabold tracking-tight">Find Your Vibe</h2>

                    <p className = "text-lg text-gray-400 mt-2 max-w-2xl mx-auto">Whatever you're into, there's an event for it.</p>

                </div>
            </div>
            <div className = "flex gap-8 pb-8 overflow-x-auto snap-x snap-mandatory" style = {{scrollBarWidth : 'none', msOverflowStyle : 'none'}}>
                <div className = "flex-shrink-0 w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/6"></div>

                {Categories.map(cat => <CategoryCard key = {cat.title} {...cat} />)}

                <div className = "flex-shrink-0 w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/6"></div>
            </div>

        </section>

    );

};
const LandingPage = () => {

    return (

        <>
        
            <Header />

            <main>

                <HeroSection />

                <FeaturesSection />

                <CategoriesSection />

            </main>

            <Footer />

        </>

    );

};


export default LandingPage;
