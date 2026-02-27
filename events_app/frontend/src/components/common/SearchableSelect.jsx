// SearchableSelect.jsx


import {useState, useEffect, useRef} from 'react'
import {Check, ChevronsUpDown, Plus, Loader2, School} from 'lucide-react'

import apiPublic from '../../api/apiPublic'


export default function SearchableSelect({value, onChange, placeholder = "Select option...", endpoint = '', hasError = false}) {

    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [options, setOptions] = useState([])
    const [loading, setLoading] = useState(false)

    const wrapperRef = useRef(null)

    // Click outside to close the dropdown
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)

        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        if (!value?.name) {
            setSearchTerm('')
        }
    }, [value?.name])

    // Debounced search
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm.length < 2) {
                setOptions([])

                return
            }

            setLoading(true)

            try {
                const response = await apiPublic.get(`${endpoint}?search=${searchTerm}`)
                
                setOptions(response.data.results || response.data)
            } catch (error) {
                console.error("Search failed", error)
            } finally {
                setLoading(false)
            }
        }, 300)

        return () => clearTimeout(delayDebounceFn)
    }, [searchTerm, endpoint])

    const handleSelect = (option) => {
        onChange({
            id : option.id,
            name : option.name,
            isNew : false
        })

        setSearchTerm(option.name)
        setIsOpen(false)
    }

    const handleAddNew = () => {
        onChange({
            id : null,
            name : searchTerm,
            isNew : true
        })

        setIsOpen(false)
    }

    const displayValue = isOpen ? searchTerm : (value?.name || '')

    return (

        <div 
            className = 'relative'
            ref = {wrapperRef}
        >
            <div
                className = {`
                    flex items-center justify-between w-full px-4 py-3 bg-zinc-900/50 border border-zinc-700 rounded-xl text-white focus-within:border-orange-500
                    focus-within:ring-1 focus-within:ring-orange-500/20 cursor-text transition-all
                    ${hasError
                        ? "border-red-500 focus-within:border-red-500 focus-within:ring-red-500/20 bg-red-500/5"
                        : "border-zinc-700 focus-within:border-orange-500 focus-within:ring-orange-500/20"
                    }
                `}
                onClick = {() => setIsOpen(true)}
            >
                <div className = "flex items-center gap-3 w-full">
                    <School 
                        className = {`
                            h-4 w-4 text-zinc-500 shrink-0
                            ${hasError
                                ? 'text-red-500'
                                : 'text-zinc-500'
                            }
                        `}
                    />
                
                    <input 
                        type = 'text'
                        className = "bg-transparent border-none outline-none text-sm w-full placeholder:text-zinc-600 text-white"
                        placeholder = {placeholder}
                        value = {displayValue}
                        onChange = {(e) => {
                            setSearchTerm(e.target.value)

                            if (!isOpen) setIsOpen(true)
                        }}
                        onFocus = {() => setIsOpen(true)}
                    />
                </div>

                {loading ? (
                    <Loader2 className = "h-4 w-4 animate-spin text-zinc-500" />
                ) : (
                    <ChevronsUpDown className = "h-4 w-4 text-zinc-500 opacity-50" />
                )}
            </div>

            {isOpen && searchTerm.length > 0 && (
                <div className = "absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl max-h-60 overflow-auto animate-in fade-in slide-in-from-top-2">
                    {options.length > 0 ? (
                        <ul className = 'pl-1'>
                            {options.map((option, index) => (
                                <li
                                    key = {option.id || `unlisted-${index}`}
                                    onClick = {() => handleSelect(option)}
                                    className = "flex items-center justify-between px-3 py-2.5 text-sm text-zinc-300 rounded-lg hover:bg-zinc-800 hover:text-white cursor-pointer transition-colors"
                                >
                                    <div className = "flex flex-col">
                                        <div className = "flex items-center gap-2">
                                            <span className = 'font-medium'>
                                                {option.name} {option.campus ? `-${option.campus}` : ''}
                                            </span>

                                            {option.status === 'requested' && (
                                                <span className = "px-1.5 py-0.5 rounded text-[8px] uppercase tracking-widest bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                                    Requested
                                                </span>
                                            )}
                                        </div>

                                        <span className = "text-[10px] text-zinc-500">
                                            {option.city}, {option.state} {option.request_count ? `(${option.request_count} waiting)` : ''}
                                        </span>
                                    </div>

                                    {value?.id === option.id && option.id !== null && <Check className = "h-4 w-4 text-orange-500" />}
                                </li>
                            ))}
                        </ul>
                    ) : !loading && (
                        <div className = 'p-2'>
                            <button
                                type = 'button'
                                onClick = {handleAddNew}
                                className = "flex items-center gap-2 w-full px-3 py-2.5 text-sm text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 rounded-lg transition-colors text-left"
                            >
                                <Plus className = "h-4 w-4" />

                                <span>Select "<span className = 'font-bold'>{searchTerm}</span>" as Unlisted</span>
                            </button>

                            <p className = "px-3 py-2 text-[10px] text-zinc-500">
                                Can't find your college? Submit it for verification.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>

    )
    
}
