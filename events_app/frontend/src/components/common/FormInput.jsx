// FormInput.jsx


import {AlertCircle} from 'lucide-react'


const FormInput = ({id, name, type = 'text', placeholder, label, value, onChange, required = true, className = '', icon : Icon, error, ...props}) => {

    return (

        <div className = 'w-full'>
            <div className = "relative group w-full">
                {Icon && (
                    <div 
                        className = {`
                            absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 pointer-events-none z-10
                            ${error
                                ? 'text-red-500'
                                : "text-zinc-500 group-focus-within:text-yellow-500"
                            }
                        `}
                    >
                        <Icon className = "h-5 w-5" />
                    </div>
                )}
                
                <input 
                    id = {id || name}
                    name = {name}
                    type = {type}
                    value = {value}
                    onChange =  {onChange}
                    required = {required}
                    placeholder = ' ' // Required for floating label
                    autoComplete = 'off'
                    {...props}
                    className = {`
                        peer block w-full rounded-xl bg-transparent font-medium px-4 py-3.5 transition-all duration-300 ease-out focus:outline-none
                        
                        ${Icon ? 'pl-11' : 'px-4'}

                        ${error
                            ? "border-2 border-red-500/80 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                            : "border border-zinc-700 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-500/10"
                        }

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

                <label
                    htmlFor = {id || name}
                    className = {`
                        absolute left-3 z-10 cursor-text px-1 pointer-events-none transition-all duration-300 ease-out origin-[0] -top-2.5 text-xs bg-zinc-950
                        
                        peer-placeholder-shown:top-3.5
                        peer-placeholder-shown:text-base
                        peer-placeholder-shown:bg-transparent

                        peer-focus:-top-2.5
                        peer-focus:font-semibold
                        peer-focus:text-xs
                        peer-focus:bg-zinc-950

                        ${error
                            ? "text-red-500 peer-placeholder-shown:text-red-500/70 peer-focus:text-red-500"
                            : "text-zinc-400 peer-placeholder-shown:text-zinc-500 peer-focus:text-yellow-500"
                        }

                        ${Icon ? "peer-placeholder-shown:left-10 peer-focus:left-3" : ''}
                    `}
                >
                    {label || placeholder}
                </label>
            </div>

            {error && (
                <p className = "mt-2 ml-1 text-xs font-bold text-red-500 flex items-center gap-1.5 animate-in slide-in-from-top-1">
                    <AlertCircle className = "h-3 w-3" />

                    {error}
                </p>
            )}
        </div>

    )

}


export default FormInput
