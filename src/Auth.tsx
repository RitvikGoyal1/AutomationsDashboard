import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAccessToken, getActiveAccount } from "./Auth.ts";
import "./Auth.css";

interface AuthProps {
    onSignIn: (token: string) => void;
    onUseMockData: () => void;
}

interface SavedAccount {
    email: string;
    displayName: string | null;
}

const API_BASE = (
    import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? "" : "http://localhost:3001")
).replace(/\/$/, "");

function maskEmail(email: string): string {
    const [localPart, domain] = email.split("@");
    if (!localPart || !domain) return email;
    const masked = localPart.substring(0, 2) + "***";
    return `${masked}@${domain}`;
}

function AuthPage({ onSignIn, onUseMockData }: AuthProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch recent users from database
        fetch(`${API_BASE}/api/users/recent`)
            .then((res) => res.json())
            .then((data) => {
                if (data.users && data.users.length > 0) {
                    setSavedAccounts(data.users);
                }
            })
            .catch((err) => console.error("Failed to fetch recent users:", err));

        // Handle OAuth redirect
        const urlParams = window.location.search + window.location.hash;
        const hasAuthParams = urlParams.includes("code=") || urlParams.includes("error=");

        if (hasAuthParams) {
            handleAuthRedirect();
        }
    }, []);

    const handleAuthRedirect = async () => {
        try {
            const token = await getAccessToken();
            if (token) {
                await saveUserToDatabase();
                onSignIn(token);
                navigate("/inbox");
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "Sign in failed");
        }
    };

    const saveUserToDatabase = async () => {
        try {
            const account = await getActiveAccount();
            if (account) {
                await fetch(`${API_BASE}/api/user`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: account.username,
                        displayName: account.name || null,
                    }),
                });
            }
        } catch (e) {
            console.error("Failed to save user:", e);
        }
    };

    const handleSignIn = async () => {
        setLoading(true);
        setError("");
        try {
            const token = await getAccessToken();
            if (token) {
                await saveUserToDatabase();
                onSignIn(token);
                navigate("/inbox");
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "Sign in failed");
        } finally {
            setLoading(false);
        }
    };

    const handleQuickLogin = () => {
        // Just proceed with getting a token (MSAL will handle it)
        handleSignIn();
    };

    return (
        <div className="auth-container">
            {savedAccounts.length > 0 && (
                <div className="auth-sidebar">
                    <p className="auth-subtitle">Continue with:</p>
                    <div className="account-list">
                        {savedAccounts.map((account) => (
                            <button
                                key={account.email}
                                className="account-button"
                                onClick={handleQuickLogin}
                                disabled={loading}
                            >
                                <div className="account-avatar">
                                    {account.displayName?.[0]?.toUpperCase() ||
                                        account.email[0].toUpperCase()}
                                </div>
                                <div className="account-info">
                                    <div className="account-name">
                                        {account.displayName || maskEmail(account.email)}
                                    </div>
                                    <div className="account-email">{maskEmail(account.email)}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="auth-card">
                <h1 className="auth-title">Mail Automation Dashboard</h1>
                <p>
                    Please only use @outlook.com or @hotmail.com emails to test or use "Mock Data"
                </p>
                <button className="auth-button" onClick={handleSignIn} disabled={loading}>
                    {loading ? "Signing in..." : "Sign in with Microsoft"}
                </button>

                {error && <p className="auth-error">{error}</p>}

                <button
                    className="mock"
                    disabled={loading}
                    onClick={() => {
                        onUseMockData();
                        navigate("/inbox");
                    }}
                >
                    Use Mock Data
                </button>
            </div>
        </div>
    );
}

export default AuthPage;
