// FormInput.jsx


const FormInput = ({id, name, type, placeholder, value, onChange, required = true}) => (

    <div className = "relative mb-4">

        <input 

            id = {id}
            name = {name}
            type = {type}
            placeholder = " "
            value = {value}
            onChange =  {onChange}
            required = {required}
            className = "block w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-red-500 focus:border-transparent transition-all duration-300 peer"

        />

        <label
        
            htmlFor = {id}
            className = "absolute left-4 top-3 text-gray-500 transition-all duration-300 pointer-events-none peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-red-400 peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-red-400 bg-gray-900 px-1"
        
        >

            {placeholder}

        </label>

    </div>

);


export default FormInput;
