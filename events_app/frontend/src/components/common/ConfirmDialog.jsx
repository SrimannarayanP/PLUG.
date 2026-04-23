// ConfirmDialog.jsx


import {AlertTriangle, X, Loader2, Loader} from 'lucide-react'
import {useEffect} from 'react'
import {createPortal} from 'react-dom'


export default function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title = "Are you sure?",
    message = "This action cannot be undone.",
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDestructive = false, // Set true for deletes to make the button Red
    isLoading = false
}) {

    // Prevent the background from scrolling while open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }

        return () => {document.body.style.overflow = 'unset'}
    }, [isOpen])

    // Let users close with Esc key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) onClose()
        }

        window.addEventListener('keydown', handleKeyDown)

        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, onClose])

    if (!isOpen) return null

    const festiveGradient = "bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 hover:opacity-90"
    const destructiveStyle = "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 hover:border-red-500"

    return createPortal(

        <div
            className = "fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6"
            role = 'alertdialog'
            aria-model = 'true'
        >   
            {/* Disable background click while loading */}
            <div
                className = "absolute inset-0 bg-[#09090b]/80 backdrop-blur-sm animate-in fade-in duration-200"
                onClick = {!isLoading ? onClose : undefined}
            />

            <div className = "relative w-full max-w-md bg-[#18181b] border border-zinc-800 rounded-3xl shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-200">
                {!isLoading && (
                    <button
                        onClick = {onClose}
                        className = "absolute top-4 right-4 p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
                    >
                        <X size = {20} />
                    </button>
                )}

                <div className = "flex flex-col items-center text-center">
                    <div
                        className = {`
                            h-16 w-16 rounded-2xl flex items-center justify-center mb-6 shadow-inner border
                            ${isDestructive
                                ? "bg-red-500/10 border-red-500/20 text-red-500"
                                : "bg-orange-500/10 border-orange-500/20 text-orange-500"
                            }
                        `}
                    >
                        <AlertTriangle className = "h-8 w-8" />
                    </div>

                    <h2 className = "text-xl sm:text-2xl font-black text-white uppercase tracking-wider mb-3">
                        {title}
                    </h2>

                    <p className = "text-zinc-400 text-sm leading-relaxed mb-8">
                        {message}
                    </p>
                </div>

                <div className = "flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
                    <button
                        onClick = {onClose}
                        disabled = {isLoading}
                        className = "flex-1 px-4 py-3 rounded-xl font-bold uppercase tracking-widest text-xs border border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                    >
                        {cancelText}
                    </button>

                    <button
                        onClick = {onConfirm}
                        disabled = {isLoading}
                        className = {`
                            flex-1 px-4 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all shadow-lg active:scale-95
                            ${isDestructive
                                ? destructiveStyle
                                : festiveGradient
                            }
                            ${!isDestructive && 'text-white'}
                        `}
                    >
                        {isLoading && <Loader2 className = "h-4 w-4 animate-spin" />}
                        {isLoading ? 'Processing...' : confirmText}
                    </button>
                </div>
            </div>
        </div>,

        document.body

    )

}
