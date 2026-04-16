// HostScanner.jsx


import {AlertTriangle, ArrowLeft, CheckCircle, Keyboard, Loader2, X, XCircle, Zap, ZapOff} from 'lucide-react'
import {useState} from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import {Scanner} from '@yudiel/react-qr-scanner'

import api from '../api/api'


export default function HostScanner() {

    const navigate = useNavigate()
    const {eventId} = useParams()

    // State
    const [isScanning, setIsScanning] = useState(true) // To pause scan after a hit
    const [torchEnabled, setTorchEnabled] = useState(false)
    const [manualEntryOpen, setManualEntryOpen] = useState(false)
    const [manualCode, setManualCode] = useState('')

    // Result state
    const [scanStatus, setScanStatus] = useState('idle') // idle | loading | success | warning | error
    const [resultMessage, setResultMessage] = useState('')
    const [attendeeInfo, setAttendeeInfo] = useState(null)

    const triggerHaptic = (type) => {
        if (navigator.vibrate) {
            if (type === 'success') navigator.vibrate([50, 50, 50]) // Double tap
            else if (type === 'error') navigator.vibrate([200, 100, 200]) // Long buzz
            else navigator.vibrate(50) // Single tap
        }
    }

    const processTicket = async (payload) => {
        setIsScanning(false)
        setManualEntryOpen(false)
        setScanStatus('loading')
        triggerHaptic('tap')

        try {
            const response = await api.post('/api/scanner/verify/', payload)
            const data = response.data

            setAttendeeInfo(data.attendee || null)

            if (data.status === 'success') {
                setScanStatus('success')
                setResultMessage("ACCESS GRANTED")
                triggerHaptic('success')
            } else if (data.status === 'warning') {
                setScanStatus('warning')
                setResultMessage(data.message || "ALREADY CHECKED IN")
                triggerHaptic('error')
            } else {
                setScanStatus('error')
                setResultMessage("INVALID TICKET")
                triggerHaptic('error')
            }
        } catch (err) {
            console.error(err)

            setScanStatus('error')
            setAttendeeInfo(null)
            setResultMessage(err.response?.data?.error || "Network/Server Error")
            triggerHaptic('error')
        }
    }

    const handleScan = (detectedCodes) => {
        // The library returns an array of codes. We take the 1st 1.
        if(!isScanning || !detectedCodes || detectedCodes.length === 0) return;

        const rawToken = detectedCodes[0].rawValue

        if (rawToken) return processTicket({token : rawToken})
    }

    const handleManualSubmit = (e) => {
        e.preventDefault()

        if (manualCode.trim().length > 0) {
            processTicket({
                ticket_code : manualCode,
                event_id : eventId
            })
        }
    }

    const resetScanner = () => {
        setScanStatus('idle')
        setResultMessage('')
        setManualCode('')
        setAttendeeInfo(null)
        setIsScanning(true) // Resume camera
    }

    const getThemeColor = () => {
        switch (scanStatus) {
            case 'success': return 'bg-green-600'
            case 'warning': return 'bg-yellow-500'
            case 'error': return 'bg-red-600'
            case 'loading': return 'bg-zinc-900'
            default: return 'bg-black'
        }
    }

    return (

        <div className = {`fixed inset-0 z-[9999] w-full overflow-hidden flex flex-col ${getThemeColor()} transition-colors duration-300`}>
            <div className = "flex-1 relative bg-black">
                <div className = "absolute top-0 left-0 right-0 p-4 sm:p-6 pt-6 sm:pt-8 flex justify-between items-center z-30 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                    {/* Header */}
                    <button
                        onClick = {() => navigate('/host/dashboard')}
                        className = "pointer-events-auto p-3 bg-white/10 backdrop-blur-md rounded-full text-white active:scale-95 transition-transform border-white/20 hover:bg-white/20"
                    >
                        <ArrowLeft className = "h-5 w-5" />
                    </button>

                    <div className = "text-white font-mono text-xs md:text-sm font-bold tracking-widest opacity-80 uppercase bg-black/40 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
                        {isScanning ? "Live Scanner" : 'Result'}
                    </div>

                    <button
                        onClick = {() => setTorchEnabled(!torchEnabled)}
                        className = {`
                            pointer-events-auto p-3 rounded-full transition-all active:scale-95 border
                            ${torchEnabled
                                ? "bg-yellow-400 text-black border-yellow-400 shadow-[0_0_15px_rgba(250, 204, 21, 0.5)]"
                                : "bg-white/10 text-white backdrop-blur-md border-white/20 hover:bg-white/20"
                            }
                        `}
                    >
                        {torchEnabled
                            ? <ZapOff className = "h-5 w-5" />
                            : <Zap className = "h-5 w-5" />
                        }
                    </button>
                </div>

                {/* Camera area */}
                {isScanning && (
                    <>
                        <div className = "absolute inset-0 z-0">
                            <Scanner 
                                onScan = {handleScan}
                                allowMultiple = {false}
                                scanDelay = {2000}
                                constraints = {{
                                    facingMode : 'environment',
                                    advanced : [{torch : torchEnabled}]
                                }}
                                styles = {{
                                    container : {
                                        height : '100%', width : '100%'
                                    },
                                    video : {
                                        objectFit : 'cover'
                                    }
                                }}
                                components = {{
                                    audio : false, // Handle audio/haptics manually
                                    onOff : false,
                                    torch : false, // Own custom button
                                    finder : false, // Custom overlay
                                }}
                            />
                        </div>

                        <div className = "absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                            <div className = "absolute inset-0 shadow-[0_0_0_9999px_rgba(0, 0, 0, 0.6)]" />

                            <div className = "h-64 w-64 border-2 border-white/20 rounded-xl relative overflow-hidden">
                                <div className = "absolute top-0 left-0 h-8 w-8 border-t-4 border-l-4 border-orange-500 rounded-tl-lg" />
                                <div className = "absolute top-0 right-0 h-8 w-8 border-t-4 border-r-4 border-orange-500 rounded-tr-lg" />
                                <div className = "absolute bottom-0 left-0 h-8 w-8 border-t-4 border-l-4 border-orange-500 rounded-bl-lg" />
                                <div className = "absolute bottom-0 right-0 h-8 w-8 border-b-4 border-r-4 border-orange-500 rounded-br-lg" />

                                <div className = "absolute top-0 left-0 h-0.5 w-full bg-orange-500 shadow-[0_0_8px_2px_rgba(249, 115, 22, 0.8)] animate-[scan_2s_ease-in-out_infinite]" />
                            </div>
                        </div>

                        {/* Manual Entry Trigger */}
                        <div className = "absolute bottom-0 left-0 right-0 p-8 pb-12 flex justify-center z-20 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none">
                            <button
                                onClick = {() => setManualEntryOpen(true)}
                                className = "pointer-events-auto flex items-center gap-3 px-8 py-4 bg-zinc-900/90 backdrop-blur-md border border-zinc-700/50 rounded-full text-white font-bold text-sm uppercase tracking-widest shadow-[0_8px_30px_rgba(0, 0, 0, 0.5)] hover:bg-zinc-800 active:scale-95 transition-all"
                            >
                                <Keyboard className = "h-5 w-5 text-orange-500" />

                                Enter Code Manually
                            </button>
                        </div>
                    </>
                )}

                {!isScanning && (
                    <div className = "absolute inset-0 z-30 bg-black/40 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-200">
                        {scanStatus === 'loading' && <Loader2 className = "h-16 w-16 text-white animate-spin mb-4" />}
                        {scanStatus === 'success' && <CheckCircle className = "h-24 w-24 text-white drop-shadow-lg mb-4" />}
                        {scanStatus === 'warning' && <AlertTriangle className = "h-24 w-24 text-white drop-shadow-lg mb-4" />}
                        {scanStatus === 'error' && <XCircle className = "h-24 w-24 text-white drop-shadow-lg mb-4" />}
                    
                        <h2 className = "text-3xl md:text-5xl font-black text-white text-center uppercase tracking-tighter drop-shadow-md mb-2">
                            {resultMessage}
                        </h2>

                        {attendeeInfo && (
                            <div className = "bg-white/95 backdrop-blur w-full max-w-sm rounded-xl p-5 shadow-2xl mt-6 text-zinc-900 transform transition-all">
                                <div className = "text-center border-b border-gray-200 pb-3 mb-3">
                                    <h3 className = "text-xl font-bold truncate">
                                        {attendeeInfo.name}
                                    </h3>

                                    <p className = "text-sm text-zinc-500 truncate">
                                        {attendeeInfo.email}
                                    </p>
                                </div>

                                <div className = 'space-y-3'>
                                    {attendeeInfo.school_college && (
                                        <div className = "flex justify-between items-center">
                                            <span className = "text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                                Institution
                                            </span>

                                            <span className = "text-sm font-semibold text-right truncate max-w-[60%]">
                                                {attendeeInfo.school_college}
                                            </span>
                                        </div>
                                    )}

                                    {attendeeInfo.student_id_number && (
                                        <div className = "flex justify-between items-center">
                                            <span className = "text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                                ID Number
                                            </span>

                                            <span className = "font-mono text-sm bg-zinc-100 px-2 py-1 rounded">
                                                {attendeeInfo.student_id_number}
                                            </span>
                                        </div>
                                    )}

                                    {attendeeInfo.date_of_birth && (
                                        <div className = "flex justify-between items-center bg-red-50 p-2 rounded-lg border border-red-100">
                                            <span className = "text-xs font-bold text-red-600 uppercase">
                                                Check Age
                                            </span>

                                            <span className = "text-sm font-bold text-red-700">
                                                {attendeeInfo.date_of_birth}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <button
                            onClick = {resetScanner}
                            className = "mt-8 w-full max-w-xs py-4 bg-white text-black font-black text-lg uppercase tracking-widest rounded-xl shadow-xl active:scale-95 transition-transform hover:bg-gray-100"
                        >
                            Scan Next
                        </button>
                    </div>
                )}
            </div>

            {manualEntryOpen && (
                <div className = "absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className = "bg-[#18181b] w-full max-w-sm rounded-2xl border border-zinc-800 p-6 shadow-2xl animate-in slide-in-from-bottom-10">
                        <div className = "flex justify-between items-center mb-6">
                            <h3 className = "text-lg font-bold text-white uppercase tracking-wider">
                                Manual Entry
                            </h3>

                            <button
                                onClick = {() => setManualEntryOpen(false)}
                                className = "text-zinc-500 hover:text-white"
                            >
                                <X className = "h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit = {handleManualSubmit}>
                            <div className = 'space-y-4'>
                                <div>
                                    <label className = "text-xs font-bold text-zinc-500 uppercase ml-1 block mb-2">
                                        Ticket Code / Token
                                    </label>

                                    <input 
                                        type = 'text'
                                        value = {manualCode}
                                        onChange = {(e) => setManualCode(e.target.value)}
                                        placeholder = "Enter code here..."
                                        className = "w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-colors font-mono"
                                        autoFocus
                                    />
                                </div>

                                <button
                                    type = 'submit'
                                    disabled = {!manualCode}
                                    className = "w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Verify Code
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>

    )

}
