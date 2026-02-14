// SearchableSelect.jsx


import {useState, useEffect, useRef} from 'react'
import {Check, ChevronsUpDown, Plus, Loader2, School} from 'lucide-react'

import apiPublic from '../../api/apiPublic'


export default function SearchableSelect({value, onChange, placeholder = "Select option...", endpoint = ''}) {

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
    })

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

    const displayValue = value?.name || searchTerm || ''

    return (

        <div 
            className = 'relative'
            ref = {wrapperRef}
        >
            <div
                className = "flex items-center justify-between w-full px-4 py-3 bg-zinc-900/50 border border-zinc-700 rounded-xl text-white focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500/20 cursor-text transition-all"
                onClick = {() => setIsOpen(true)}
            >
                <div className = "flex items-center gap-3 w-full">
                    <School className = "h-4 w-4 text-zinc-500 shrink-0" />
                
                    <input 
                        type = 'text'
                        className = "bg-transparent border-none outline-none text-sm w-full placeholder:text-zinc-600 text-white"
                        placeholder = {placeholder}
                        value = {isOpen ? searchTerm : displayValue}
                        onChange = {(e) => setSearchTerm(e.target.value)}
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
                            {options.map((option) => (
                                <li
                                    key = {option.id}
                                    onClick = {() => handleSelect(option)}
                                    className = "flex items-center justify-between px-3 py-2.5 text-sm text-zinc-300 rounded-lg hover:bg-zinc-800 hover:text-white cursor-pointer transition-colors"
                                >
                                    <div className = "flex flex-col">
                                        <span className = 'font-medium'>
                                            {option.name}
                                        </span>

                                        <span className = "text-[10px] text-zinc-500">
                                            {option.city}, {option.state}
                                        </span>
                                    </div>

                                    {value?.id === option.id && <Check className = "h-4 w-4 text-orange-500" />}
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

                                <span>Add "<span className = 'font-bold'>{searchTerm}</span>" manually</span>
                            </button>

                            <p className = "px-3 py-2 text-[10px] text-zinc-500">
                                Can't find your college? Add it to our list.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>

    )

}
