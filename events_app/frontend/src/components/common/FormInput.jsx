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
            className = "block w-full px-4 py-3 bg-[#6f2d37] text-[#eae5dc] border-2 border-[#eae5dc]/30 rounded-lg appearance-none focus:outline-none focus:ring-0 focus:border-[#c90000] peer transition-colors duration-300" 
        />

        <label
            htmlFor = {id}
            className = "absolute text-sm duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-[#6f2d37] px-2 peer-focus:px-2 peer-focus:text-[#c90000] peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 text-[#eae5dc]/70"
        >
            {placeholder}
        </label>

    </div>

);


export default FormInput;
