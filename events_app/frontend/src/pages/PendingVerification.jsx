// PendingVerification.jsx


import {ArrowLeft, ShieldAlert} from 'lucide-react'
import {Link} from 'react-router-dom'


export default function PendingVerification() {

    return (

        <div className = "min-h-[calc(100vh-72px)] flex flex-col items-center justify-center p-4 text-center">
            <div className = "h-24 w-24 rounded-full bg-orange-500/10 flex items-center justify-center mb-6 border border-orange-500/20">
                <ShieldAlert className = "h-12 w-12 text-orange-500" />
            </div>

            <h1 className = "text-3xl font-black text-white mb-4 uppercase tracking-tight">
                Profile Under Review
            </h1>

            <p className = "text-zinc-400 max-w-md mb-8 leading-relaxed">
                Your host application for PLUG. has been received. Our team is currently verifying your organisation's details. You will receive an email once your dashboard is unlocked.
            </p>

            <Link
                to = '/'
                className = "flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold uppercase tracking-widest text-xs transition-colors border border-zinc-800"
            >
                <ArrowLeft className = "h-4 w-4" />

                Return to Discover
            </Link>
        </div>

    )

}
