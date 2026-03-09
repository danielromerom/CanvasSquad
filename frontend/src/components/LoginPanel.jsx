/* global chrome */

export default function LoginPanel({ setLogin }) {
    
    const handleLogin = () => {
        // We send a message to background.js to start the OAuth flow
        chrome.runtime.sendMessage({ action: "startCanvasLogin" }, (response) => {
            if (response && response.status === "success") {
                console.log("Success! Authorization Code:", response.code);
                
                // For now, we simulate a successful login state
                // In the next step, you'll exchange this code for a real token
                setLogin(true);
            } else {
                console.error("Login failed:", response?.message);
                alert("Login failed: " + (response?.message || "Unknown error"));
            }
        });
    }

    return (
        <div className="flex flex-col items-center justify-center border-2 border-gray-400 rounded-xl mt-20 p-5">
            <img 
                src={chrome.runtime.getURL("CompassLogoPlain.png")}
                alt="Compass Logo" 
                style={{ width: '60px', height: '60px', objectFit: 'contain' }} 
            />
            <div className="mb-4 font-bold">Welcome!</div>
            <div className="mb-6 text-center text-sm">Click the button below to authorize Compass with your Canvas account.</div>
            <button 
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                onClick={handleLogin}
            >
                Authorize
            </button>
        </div>
    );
}