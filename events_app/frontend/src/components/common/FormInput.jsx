// FormInput.jsx


const FormInput = ({id, name, type, placeholder, value, onChange, required = true, className = "", Icon}) => {

    const isDateType = type === 'date' || type === 'datetime-local' || type === 'time' 

    return (

        <div className = {`relative mb-5 group ${className}`}>
            {Icon && (
                <div className = "absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none transition-colors group-focus-within:text-yellow-400">
                    <Icon className = "w-5 h-5" />
                </div>
            )}
            
            <input 
                id = {id}
                name = {name}
                type = {type}
                placeholder = " "
                value = {value}
                onChange =  {onChange}
                required = {required}
                style = {{
                    colorScheme : 'dark',
                    boxShadow : "0 0 0 30px #09090b inset",
                    WebkitTextFillColor : 'white'
                }}
                className = {`
                    block w-full 
                    py-4 bg-transparent text-white font-medium border-2 border-zinc-700 rounded-xl appearance-none 
                    focus:outline-none focus:ring-0 focus:border-yellow-500 focus:shadow-[0_0_15px_rgba(249, 115, 22, 0.2)] 
                    peer transition-all duration-300

                    // Hiding native browser icons for date picker
                    [&::-webkit-calendar-picker-indicator]:hidden
                    [&::-webkit-calendar-picker-indicator]:bg-transparent

                    ${Icon 
                        ? "pl-12 pr-4" 
                        : 'px-4'
                    }
                `}
            />

            <label
                htmlFor = {id}
                className = {`
                    absolute text-sm duration-300 transform bg-zinc-900 px-2 ml-2 rounded text-zinc-400 cursor-text z-20 pointer-events-none origin-[0] bg-[#09090b]
                    top-2 scale-75 -translate-y-4

                    ${!isDateType
                        ? "peer-placeholder-shown:bg-transparent peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2"
                        : ""
                    }

                    peer-focus:bg-[#09090b] peer-focus:text-yellow-500 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4

                    ${Icon && !isDateType
                        ? "peer-placeholder-shown:translate-x-7"
                        : ""
                    }
                `}
            >
                {type === 'datetime-local' && !value
                    ? placeholder
                    : placeholder
                }
            </label>

        </div>

    )

}


export default FormInput
