// LoginSignup.jsx


import React, {useState, useEffect, useRef} from 'react';
import FormInput from '../components/common/FormInput';
import SolidAnimatedButton from '../components/ui/SolidAnimatedButton';
import BackgroundPaths from '../components/ui/BackgroundPaths';
import api from '../api';
import {useNavigate} from 'react-router-dom';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../constants';


export default function LoginSignup() {

    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name : '',
        email : '',
        password : '',
        confirmPassword : ''
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        
        const {name, value} = e.target;

        setFormData(prev => ({...prev, [name] : value}));

        if (error) setError();

    };
    const handleToggle = () => {

        setIsLogin(!isLogin);
        setFormData({name : '', email : '', password : '', confirmPassword : ''});
        setError();

    };
    const handleSubmit = async (e) => {

        e.preventDefault();

        setIsLoading(true);
        setError();

        if (!isLogin && formData.password !== formData.confirmPassword) {
            
            setError("Passwords don't match");
            setIsLoading(false);

            return;

        }
        if (!formData.email || !formData.password) {

            setError("Email & password are required");
            setIsLoading(false);

            return;

        }
        if (!isLogin && !formData.name) {

            setError("Name is required for registration");
            setIsLoading(false);

            return;

        }

        const endpoint = isLogin ? 'http://127.0.0.1:8000/api/token/' : 'http://127.0.0.1:8000/api/user/register/';
        const payload = isLogin 
        ? {email : formData.email, password : formData.password}
        : {username : formData.name, email : formData.email, password : formData.password};

        try {

            const response = await api.post(endpoint, payload);

            if (response.status === 200 || response.status === 201) {

                localStorage.setItem(ACCESS_TOKEN, response.data.access);
                localStorage.setItem(REFRESH_TOKEN, response.data.refresh);

                setFormData({name : '', email : '', password : '', confirmPassword : ''})

                navigate('/success_login');

            }

        } catch (error) {

            console.log("Auth error : ", error);

        } finally {

            setIsLoading(false);

        }
        
    };

    return (

        <main className = "relative flex flex-col items-center justify-center w-full h-screen min-h-screen font-sans text-white bg-black overflow-hidden">
            
            <BackgroundPaths />

            <div className = "absolute inset-0 bg-black/60 z-0"></div>
            <div className = "relative z-10 grid w-full max-w-6xl grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-center px-4">
                {/* Left side : Logo & tagline */}
                <div className = "flex flex-col items-center md:items-start text-center md:text-left">

                    <h1 className = "text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600 mb-4">
                        events.
                    </h1>

                    <p className = "text-xl lg:text-2xl text-gray-300 max-w-md">
                        Campus events - redefined.
                    </p>

                </div>
                {/* Right side : Login/Signup form */}
                <div className = "flex items-center justify-center">
                    <div className = "w-full max-w-md bg-gray-900 bg-opacity-80 backdrop-blur-sm rounded-2xl shadow-2xl shadow-red-900/20 overflow-hidden relative transition-all duration-700 ease-in-out"
                        style = {{minHeight : '550px'}}>
                        <div className = "absolute inset-0 overflow-hidden">
                        {/* Login form */}
                            <div className = {`absolute inset-0 transition-all duration-700 ease-in-out ${isLogin ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}`}>

                                <form className = "p-8 space-y-6 h-full flex flex-col justify-center" onSubmit = {handleSubmit} noValidate>

                                    <h2 className = "text-4xl font-extrabold text-center text-white">Welcome Back</h2>

                                    <p className = "text-center text-gray-400">
                                        Don't have an account?

                                        <button type = 'button' onClick = {handleToggle} className = "font-medium text-red-500 hover:text-red-400 ml-2 focus:outline-none">Sign Up</button>

                                    </p>

                                    <FormInput id = 'login-email' name = 'email' type = 'email' placeholder = "Email ID" value = {formData.email} onChange = {handleChange}  />
                                    <FormInput id = 'login-password' name = 'password' type = 'password' placeholder = 'Password' value = {formData.password} onChange = {handleChange} />

                                    <div className = "pt-4">

                                        <SolidAnimatedButton disabled = {isLoading}>{isLoading ? "Loading..." : 'Log In'}</SolidAnimatedButton>

                                    </div>

                                </form>

                            </div>
                            {/* Signup form */}
                            <div className = {`absolute inset-0 transition-all duration-700 ease-in-out ${!isLogin ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}`}>

                                <form className = "p-8 space-y-6" onSubmit = {handleSubmit} noValidate>

                                    <h2 className = "text-4xl font-extrabold text-center text-white">Create Account</h2>

                                    <p className = "text-center text-gray-400">
                                        Already have an account?

                                        <button type = 'button' onClick = {handleToggle} className = "font-medium text-red-500 hover:text-red-400 ml-2 focus:outline-none">Log In</button>

                                    </p>

                                    <FormInput id = 'signup-name' name = 'name' type = 'text' placeholder = 'Name' value = {formData.name} onChange = {handleChange} />
                                    <FormInput id = 'signup-email' name = 'email' type = 'email' placeholder = "Email ID" value = {formData.email} onChange = {handleChange} />
                                    <FormInput id = 'signup-password' name = 'password' type = 'password' placeholder = 'Password' value = {formData.password} onChange = {handleChange} />
                                    <FormInput id = 'signup-confirmPassword' name = 'confirmPassword' type = 'password' placeholder = "Confirm Password" value = {formData.confirmPassword} onChange = {handleChange} />

                                    <div className = 'pt-4'>

                                        <SolidAnimatedButton disabled = {isLoading}>{isLoading ? 'Loading...' : 'Sign Up'}</SolidAnimatedButton>

                                    </div>

                                </form>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
        </main>

    );

}

