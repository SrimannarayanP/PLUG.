// FormInput.jsx


const FormInput = ({id, name, type = 'text', placeholder, label, value, onChange, required = true, className = '', Icon, ...props}) => {

    return (

        <div className = "relative mb-6 group w-full">
            {Icon && (
                <div className = "absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors duration-300 group-focus-within:text-yellow-500 z-10 pointer-events-none">
                    <Icon className = "h-5 w-5" />
                </div>
            )}
            
            <input 
                id = {id}
                name = {name}
                type = {type}
                value = {value}
                onChange =  {onChange}
                required = {required}
                {...props}
                placeholder = ' ' // Required for floating label
                className = {`
                    peer
                    block w-full rounded-xl 
                    border border-zinc-700
                    bg-transparent
                    text-zinc-100 font-medium
                    px-4 py-3.5
                    transition-all duration-300 ease-out
                    
                    ${Icon
                        ? 'pl-11'
                        : 'px-4'
                    }

                    focus:border-yellow-500
                    focus:outline-none
                    focus:ring-4 focus:ring-yellow-500/10

                    autofill:bg-zinc-900
                    [-webkit-autofill]:shadow-[0_0_0_100px_#09090b_inset]
                    [-webkit-autofill]:text-fill-color-zinc-100

                    [&::-webkit-calendar-picker-indicator]:invert
                    [&::-webkit-calendar-picker-indicator]:opacity-60
                    [&::-webkit-calendar-picker-indicator]:hover:opacity-100
                    [&::-webkit-calendar-picker-indicator]:cursor-pointer

                    ${className}
                `}
            />

            {Icon && (
                <div className = "absolute left-4 top-[1.1rem] text-zinc-500 transition-colors duration-300 peer-focus:text-yellow-500 pointer-events-none">
                    <Icon className = "h-5 w-5" />
                </div>
            )}

            <label
                htmlFor = {id}
                className = {`
                    absolute left-3 z-10
                    cursor-text
                    px-1
                    pointer-events-none
                    transition-all duration-300 ease-out
                    origin-[0]

                    -top-2.5
                    text-xs
                    text-zinc-400
                    bg-zinc-950

                    peer-placeholder-shown:top-3.5
                    peer-placeholder-shown:text-base
                    peer-placeholder-shown:text-zinc-500
                    peer-placeholder-shown:bg-transparent

                    peer-focus:-top-2.5
                    peer-focus:font-semibold
                    peer-focus:text-xs
                    peer-focus:text-yellow-500
                    peer-focus:bg-zinc-950

                    ${Icon ? "peer-placeholder-shown:left-10 peer-focus:left-3" : ''}
                `}
            >
                {label || placeholder}
            </label>

        </div>

    )

}


export default FormInput
