// HostScanner.jsx


import React, {useState} from 'react'
import {Scanner} from '@yudiel/react-qr-scanner'
import apiPublic from '../api/apiPublic'


export default function HostScanner() {

    const [scanResult, setScanResult] = useState(null) // 'success', 'warning', 'error'
    const [scanMessage, setScanMessage] = useState("Ready to Scan")
    const [attendeeInfo, setAttendeeInfo] = useState(null)
    const [isScanning, setIsScanning] = useState(true) // To pause scan after a hit

    const handleScan = async (detectedCodes) => {

        // The library returns an array of codes. We take the 1st 1.
        if(!isScanning || !detectedCodes || detectedCodes.length === 0) return;

        const rawToken = detectedCodes[0].rawValue

        if (!rawToken) return;

        setIsScanning(false) // Pause scanning immediately while we process
        setScanMessage("Verifying...")

        try {
            // Send token to backend
            const response = await apiPublic.post('/api/ticket/verify-ticket/', {
                token : rawToken
            })
            const data = response.data

            if (data.status === 'success') {
                setScanResult('success') // Green
                setScanMessage("VALID TICKET!")
                setAttendeeInfo(data.attendee)
            } else if (data.status === 'warning') {
                setScanResult('warning') // Yellow
                setScanMessage(data.message) // "ALREADY CHECKED IN"
                setAttendeeInfo(data.attendee)
            } else {
                setScanResult('error') // Red
                setScanMessage("INVALID TICKET") // "INVALID TICKET"
            }
        } catch (err) {
            setScanResult('error')
            setScanMessage(err.response?.data?.error || "Network Error")
        }
    }

    const resetScaner = () => {
        setScanResult(null)
        setScanMessage("Ready to Scan")
        setAttendeeInfo(null)
        setIsScanning(true) // Resume camera
    }

    const getBgColor = () => {
        if (scanResult === 'success') return 'bg-green-600';
        if (scanResult === 'warning') return 'bg-yellow-500';
        if (scanResult === 'error') return 'bg-red-600';
        return 'bg-black'; // Default
    }

    const resetScanner = () => {
        setScanResult(null)
        setScanMessage("Ready to Scan")
        setAttendeeInfo(null)
        setIsScanning(true)
    }

    return (

        <div className = {`min-h-screen flex flex-col ${getBgColor()} transition-colors duration-300`}>
            {/* Header */}
            <div className = "p-4 text-white text-center font-bold text-xl bg-black/20">
                Ticket Scanner
            </div>

            {/* Camera area */}
            <div className = "flex-1 flex items-center justify-center p-4">
                {isScanning ? (
                    <div className = "w-full max-w-md border-4 border-white/50 rounded-xl overflow-hidden shadow-2xl">
                        <Scanner 
                            onScan = {handleScan}
                            allowMultiple = {false}
                            scanDelay = {2000} // Wait 2 seconds between scans
                            components = {{audio : false, torch : true}} // Enable flashlight toggle
                        />
                    </div>
                ) : (
                    <div className = "bg-white w-full max-w-md p-8 rounded-2xl shadow-2xl text-center animate slide-up">
                        <h2 className = {`text-4xl font-black mb-2 ${
                            scanResult === 'error' ? 'text-red-600' :
                            scanResult === 'warning' ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                            {scanMessage}
                        </h2>

                        {attendeeInfo && (
                            <div className = "mt-4 text-left bg-gray-100 p-4 rounded-lg">
                                <p className = "text-lg font-bold text-gray-800">{attendeeInfo.name}</p>
                                <p className = "text-sm text-gray-600">{attendeeInfo.email}</p>

                                <div className = "mt-2 border-t border-gray-300 pt-2 flex justify-between">
                                    <span className = "text-xs font-bold text-gray-500">COLLEGE</span>
                                    <span className = "text-xs text-gray-800">{attendeeInfo.college}</span>
                                </div>

                                <div className = "flex justify-between">
                                    <span className = "text-xs font-bold text-gray-500">ID #</span>
                                    <span className = "text-xs text-gray-800">{attendeeInfo.student_id}</span>
                                </div>

                                {attendeeInfo.dob && (
                                    <div className = "flex justify-between bg-red-100 p-1 mt-2 rounded">
                                        <span className = "text-xs font-bold text-red-700">DOB (CHECK ID)</span>
                                        <span className = "text-xs font-bold text-red-700">{attendeeInfo.dob}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            onClick = {resetScanner}
                            className = "mt-8 w-full py-4 bg-black text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform"
                        >
                            Scan Next
                        </button>
                    </div>
                )}
            </div>
        </div>

    )

}
