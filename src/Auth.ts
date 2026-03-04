import { InteractionRequiredAuthError, PublicClientApplication } from "@azure/msal-browser";

const CLIENT_ID = import.meta.env.VITE_AZURE_CLIENT_ID;
const SCOPES = ["Mail.Read", "Mail.Send", "User.Read", "offline_access"];

const msalInstance = new PublicClientApplication({
    auth: {
        clientId: CLIENT_ID,
        authority: "https://login.microsoftonline.com/consumers/",
        redirectUri: window.location.origin,
    },
    cache: {
        cacheLocation: "sessionStorage",
    },
});

let isInitialized = false;

async function initializeMsal(): Promise<void> {
    if (isInitialized) return;
    await msalInstance.initialize();
    isInitialized = true;
}

export async function getAccessToken(): Promise<string | null> {
    if (!CLIENT_ID) {
        throw new Error("!!Client ID not found!!");
    }
    await initializeMsal();
    const request = { scopes: SCOPES };

    const redirectResult = await msalInstance.handleRedirectPromise();
    if (redirectResult?.account) {
        msalInstance.setActiveAccount(redirectResult.account);
    }

    const account = msalInstance.getActiveAccount() || msalInstance.getAllAccounts()[0];
    if (!account) {
        await msalInstance.loginRedirect(request);
        return null;
    }

    msalInstance.setActiveAccount(account);

    try {
        const tokenResult = await msalInstance.acquireTokenSilent({ ...request, account });
        return tokenResult.accessToken;
    } catch (e) {
        if (e instanceof InteractionRequiredAuthError) {
            await msalInstance.acquireTokenRedirect(request);
            return null;
        }
        throw e;
    }
}

export async function getActiveAccount() {
    await initializeMsal();
    return msalInstance.getActiveAccount();
}
