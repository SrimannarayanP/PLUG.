// SearchBar.jsx


import {Search} from 'lucide-react'
import {useEffect, useRef} from 'react'


const SearchBar = ({onSearch}) => {

    const [localQuery, setLocalQuery] = useState('')

    const isFirstRender = useRef(true)

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false

            return
        }

        const timer = setTimeout(() => {
            onSearch(localQuery)
        }, 400)

        return () => clearTimeout(timer)
    }, [localQuery, onSearch])

    return (

        <div className = "relative w-full md:w-72 mt-4 ml-4 md:mt-0 md:ml-6 md:mb-4">
            <div className = "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className = "h-4 w-4 text-zinc-500" />
            </div>

            <input
                type = 'text'
                placeholder = "Search guests..."
                value = {localQuery}
                onChange = {(e) => setLocalQuery(e.target.value)}
                className = "block w-full pl-10 pr-3 py-2.5 md:py-2 border border-zinc-800 focus:border-orange-500/50 rounded-lg bg-zinc-950 text-zinc-200 text-sm placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all shadow-inner"
            />
        </div>

    )
    
}


export default SearchBar
