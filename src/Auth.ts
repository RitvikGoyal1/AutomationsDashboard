import type { AuthenticationResult } from "@azure/msal-browser";
import {
  InteractionRequiredAuthError,
  PublicClientApplication,
} from "@azure/msal-browser";
const CLIENT_ID = import.meta.env.VITE_AZURE_CLIENT_ID;
const TENANT_ID = import.meta.env.VITE_AZURE_TENANT_ID || "common";
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

let initializationPromise: Promise<void> | null = null;
let isInitialized = false;
let redirectPromise: Promise<AuthenticationResult | null> | null = null;

async function initializeMsal(): Promise<void> {
  if (isInitialized) return;
  if (initializationPromise) return initializationPromise;

  initializationPromise = msalInstance.initialize();
  await initializationPromise;
  isInitialized = true;
  initializationPromise = null;
}

async function handleRedirect(): Promise<AuthenticationResult | null> {
  if (redirectPromise) return redirectPromise;
  redirectPromise = msalInstance.handleRedirectPromise().finally(() => {
    redirectPromise = null;
  });
  return redirectPromise;
}

export async function getAccessToken(): Promise<string | null> {
  if (!CLIENT_ID) {
    throw new Error("!!Client ID not found!!");
  }
  await initializeMsal();
  const request = { scopes: SCOPES };
  const redirectResult = await handleRedirect();
  if (redirectResult?.account) {
    msalInstance.setActiveAccount(redirectResult.account);
  }
  let account =
    msalInstance.getActiveAccount() || msalInstance.getAllAccounts()[0];
  if (!account) {
    await msalInstance.loginRedirect(request);
    return null;
  }
  msalInstance.setActiveAccount(account);
  if (!account) {
    throw new Error("!!Login Failed!!");
  }
  try {
    const tokenResult = await msalInstance.acquireTokenSilent({
      ...request,
      account,
    });
    return tokenResult.accessToken;
  } catch (e) {
    if (e instanceof InteractionRequiredAuthError) {
      await msalInstance.acquireTokenRedirect(request);
      return null;
    }
    throw e;
  }
}
