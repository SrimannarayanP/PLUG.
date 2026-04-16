// ContactUs.jsx


import LegalLayout from './LegalLayout'


export default function ContactUs() {

    return (

        <LegalLayout title="Contact Us">
            <p>We are here to help. If you have any issues with your tickets or account, please reach out to us.</p>

            <div className = "bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 mt-8 space-y-6">
                <div>
                    <h3 className = "text-white font-bold mb-1">
                        Email Support
                    </h3>

                    <p>For payment issues, ticket retrieval or technical support, please email us at SUPPORT_EMAIL</p>

                    <a
                        href = "mailto:[SUPPORT EMAIL ADDRESS]"
                        className = "text-orange-500 font-bold"
                    >
                        [SUPPORT EMAIL ADDRESS]
                    </a>

                    <p className = "text-sm mt-2">
                        Expect a response within 24-48 hours.
                    </p>
                </div>

                <div>
                    <h3 className = "text-white font-bold mb-1">
                        Operating Address
                    </h3>

                    <p>
                        PLUG. <br />
                        [PHYSICAL_ADDRESS - LINE 1]<br />
                        [CITY, STATE, ZIP CODE] <br />
                        [COUNTRY]
                    </p>
                </div>

                <div>
                    <h3 className = "text-white font-bold mb-1">
                        Phone
                    </h3>

                    <p>[YOUR PHONE NUMBER]</p>
                </div>
            </div>
        </LegalLayout>

    )

}
