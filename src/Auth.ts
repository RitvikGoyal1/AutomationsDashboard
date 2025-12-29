const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send"
].join(" ");

export async function getAccessToken(): Promise<string> {
    await ensureGisLoaded();
    return new Promise((resolve, reject)=>{
        const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope:SCOPES,
            prompt:"",
            callback:(response: {access_token?: string; error?: string}) =>{
                if (response.access_token) resolve (response.access_token);
                else reject(new Error(response.error || "Failed to get access token"));

            },
        });
        tokenClient.requestAccessToken();
    });
}

function ensureGisLoaded(): Promise<void> {
    return new Promise((resolve)=>{
        if ((window as any).google?.accounts?.oauth2) return resolve();
        const check = () => {
            if ((window as any).google?.accounts?.oauth2) resolve();
            else setTimeout(check,50);

        };
        check();
    });
}

