/* global chrome */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "startCanvasLogin") {
        const clientId = "180240000000000199";
        const redirectUri = chrome.identity.getRedirectURL("oauth2response");
        const authUrl = `https://ufldev.instructure.com/login/oauth2/auth?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}`;

        chrome.identity.launchWebAuthFlow({
            url: authUrl,
            interactive: true
        }, (redirectUrl) => {
            if (chrome.runtime.lastError || !redirectUrl) {
                sendResponse({ status: "error", message: chrome.runtime.lastError?.message || "Login cancelled" });
                return;
            }

            const url = new URL(redirectUrl);
            const authCode = url.searchParams.get("code");

            if (authCode) {
                // IMPORTANT: The fetch must happen here
                fetch('https://crosscurrented-roselle-prototypical.ngrok-free.dev/api/canvas/exchange/', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'ngrok-skip-browser-warning': 'true'
                    },
                    body: JSON.stringify({ code: authCode })
                })
                .then(res => res.json())
                .then(data => {
                    if (data.access_token) {
                        chrome.storage.local.set({ 
                            canvasToken: data.access_token, 
                            isLoggedIn: true 
                        }, () => {
                            // Tell the LoginPanel it was successful
                            sendResponse({ status: "success" });
                        });
                    } else {
                        sendResponse({ status: "error", message: "Exchange failed: " + JSON.stringify(data) });
                    }
                })
                .catch(err => sendResponse({ status: "error", message: err.message }));
            } else {
                sendResponse({ status: "error", message: "No code found in redirect" });
            }
        });

        return true; // REQUIRED for async sendResponse
    }
});