// AuthenticationForms.jsx


import FormInput from '../common/FormInput';
import {UserIcon, LockIcon, MailIcon} from '../common/Icons.jsx';


const LoginForm = ({onSwitch}) => (

    <div className = "flex flex-col h-full p-8 justify-center">

        <h2 className = "text-3xl font-bold mb-2 text-center">Welcome Back!</h2>

        <p className = "text-gray-400 mb-8 text-center">Sign in to explore more events.</p>

        <form className = "space-y-6">

            <FormInput icon = {<UserIcon className = "w-5 h-5" />} type = 'email' placeholder = "Email ID" />
            <FormInput icon = {<LockIcon className = "w-5 h-5" />} type = 'password' placeholder = 'Password' />

            <div className = 'text-right'>

                <a href = '#' className = "text-sm text:f87171 hover:underline">Forgot Password?</a>
            
            </div>

            <button type = 'submit' className = "w-full bg-f87171 text-white font-bold py-3 rounded-lg hover:bg-red-500 transition-all duration-300 shadow-lg shadow-f87171/20">Log In</button>

            <p className = "text-center text-gray-400 text-sm">
                Don't have an account?{' '}
                
                <button type = 'button' onClick = {onSwitch} className = "font-semibold text-f87171 hover:underline">Sign Up</button>
            
            </p>
        </form>
    </div>

);

const SignupForm = ({onSwitch}) => (

    <div className = "flex flex-col h-full p-8 justify-center">

        <h2 className = "text-3xl font-bold mb-2 text-center">Create Account</h2>

        <p className = "text-gray-400 mb-8 text-center">Start your events with us today.</p>
        
        <form className = 'space-y-6'>

            <FormInput icon = {<UserIcon className = "w-5 h-5" />} type = 'text' placeholder = 'Username' />
            <FormInput icon = {<MailIcon className = "w-5 h-5" />} type = 'email' placeholder = "Email ID" />
            <FormInput icon = {<LockIcon className = "w-5 h-5" />} type = 'password' placeholder = 'Password' />

            <button type = 'submit' className = "w-full bg-f87171 text-white font-bold py-3 rounded-lg hover:bg-red-500 transition-all duration-300 shadow-lg shadow-f87171/20">
                Create Account
            </button>

            <p className = "text-center text-gray-400 text-sm">
                Already have an account?{' '}
                
                <button type = 'button' onClick = {onSwitch} className = "font-semibold text-f87171 hover:underline">Log In</button>

            </p>
        </form>
    </div>

);



export const AuthContainer = ({isLoginView, onSwitch}) => {

    return (

        <div className = "relative w-full md:w-1/2 flex items-center justify-center p-4">
            <div className = "relative w-full max-w-md h-[600px] overflow-hidden rounded-2xl p-[1px] shadow-2xl shadow-black/50">
                <span className = "absolute inset-[-1000%] animate-[spin_6s_linear_infinite bg-[conic-gradient(from_90_deg_at_50%_50%, #f87171_0%, #ef4444_25%, #e11d48_50%, #f87171_100%)]" />

                <div className = "w-full h-full rounded-[15px] bg-black/90 backdrop-blur-xl text-white overflow-hidden">
                    <div className = "relative h-[200%] w-full transition-transform duration-700 ease-in-out" style = {{transform : isLoginView ? 'translateY(-50%)' : 'translateY(0%)'}}>
                        <div className = "h-1/2 w-full"><LoginForm onSwitch = {onSwitch} /></div>
                        <div className = "h-1/2 w-full"><SignupForm onSwitch = {onSwitch} /></div>
                    </div>
                </div>
            </div>
        </div>
        
    );  

};
