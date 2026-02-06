import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAccessToken } from "./Auth.ts";
import "./Auth.css";

interface AuthProps {
  onSignIn: (token: string) => void;
  onUseMockData: () => void;
}

function AuthPage({ onSignIn, onUseMockData }: AuthProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const hasAuthParams =
      window.location.search.includes("code=") ||
      window.location.search.includes("error=") ||
      window.location.search.includes("state=") ||
      window.location.hash.includes("code=") ||
      window.location.hash.includes("error=") ||
      window.location.hash.includes("state=");
    if (!hasAuthParams) {
      setLoading(false);
      return () => {
        isMounted = false;
      };
    }
    const init = async () => {
      try {
        const token = await getAccessToken();
        if (!isMounted) return;
        if (token) {
          onSignIn(token);
          navigate("/inbox");
        }
      } catch (e) {
        if (!isMounted) return;
        setError(e instanceof Error ? e.message : "Sign in failed");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    init();
    return () => {
      isMounted = false;
    };
  }, [onSignIn, navigate]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getAccessToken();
      if (token) {
        onSignIn(token);
        navigate("/inbox");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Mail Automation Dashboard</h1>
        <p className="auth-subtitle">
          Sign in with your Microsoft account to get started
        </p>
        <button
          className="auth-button"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in with Microsoft"}{" "}
        </button>
        {error && <p className="auth-error"> {error}</p>}
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
