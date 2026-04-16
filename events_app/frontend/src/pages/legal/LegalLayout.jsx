// LegalLayout.jsx


import {ArrowLeft} from 'lucide-react'
import {useNavigate} from 'react-router-dom'


export default function LegalLayout({title, children}) {

    const navigate = useNavigate()

    return (

        <div className = "min-h-screen bg-[#09090b] text-zinc-400 font-sans pb-24">
            <main className = "max-w-4xl mx-auto px-4 sm:px-6 pt-12">
                <button
                    onClick = {() => navigate(-1)}
                    className = "flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors mb-8"
                >
                    <ArrowLeft className = "h-4 w-4" />
                    
                    Back
                </button>

                <h1 className = "text-3xl md:text-5xl font-black uppercase tracking-tighter text-white mb-8">
                    {title}
                </h1>

                <div className = "prose prose-invert prose-zinc max-w-none prose-headings:text-white prose-a:text-orange-500">
                    {children}
                </div>
            </main>
        </div>

    )

}
