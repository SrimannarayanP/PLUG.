// InfoPanel.jsx


import {BrandLogo} from '../common/Icons.jsx';


const InfoPanel = () => {

    return (

        <div className = "hidden md:flex w-1/2 flex-col items-center justify-center text-white text-center p-12">
            <div className = "flex items-center space-x-4 mb-6">

                <BrandLogo className = "w-16 h-16 text-f87171" />

                <h1 className = "text-5xl font-bold tracking-wider">events.</h1>

            </div>

            <p className = "text-lg text-gray-300 max-w-sm">Campus events - Simplified</p>

        </div>

    );

}


export default InfoPanel;
