const BrandLogo = ({className}) => (

    <svg className = {className} viewBox = "0 0 24 24" fill = 'none' xmlns = 'http://www.w3.org/2000/svg'>

        <path d = "M12 2L2 7L12 12L22 7L12 2Z" stroke = 'currentColor' strokeWidth = '2' strokeLinecap = 'round' strokeLinejoin = 'round'></path>
        <path d = "M2 17L12 22L22 17" stroke = 'currentColor' strokeWidth = '2' strokeLinecap = 'round' strokeLinejoin = 'round'></path>
        <path d = "M2 12L12 17L22 12" stroke = 'currentColor' strokeWidth = '2' strokeLinecap = 'round' strokeLinejoin = 'round'></path>

    </svg>

);
const UserIcon = ({className}) => (

    <svg className = {className} viewBox = "0 0 24 24" xmlns = 'http://www.w3.org/2000/svg' width = '24' height = '24' fill = 'none' stroke = 'currentColor' strokeWidth = '2' strokeLinecap = 'round' strokeLinejoin = 'round'>

        <path d = "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>

        <circle cx = '12' cy = '7' r = '4'></circle>

    </svg>

);
const MailIcon = ({className}) => (

    <svg className = {className} xmlns = 'http://www.w3.org/2000/svg' width = '24' height = '24' viewBox = "0 0 24 24" fill = 'none' stroke = 'currentColor' strokeWidth = '2' strokeLinecap = 'round' strokeLinejoin = 'round'>

        <rect width = '20' height = '16' x = '2' y = '4' rx = '2'></rect>

        <path d = "M22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path> 

    </svg>

);
const LockIcon = ({className}) => (

    <svg className = {className} xmlns = 'http://www.w3.org/2000/svg' width = '24' height = '24' viewBox = "0 0 24 24" fill = 'none' stroke = 'currentColor' strokeWidth = '2' strokeLinejoin = 'round' strokeLinecap = 'round'>

        <rect width = '18' height = '11' x = '3' y = '11' rx = '2' ry = '2'></rect>

        <path d = "M7 11V7a5 5 0 0 1 10 0v4"></path>

    </svg>

);



export default {BrandLogo, UserIcon, MailIcon, LockIcon};
