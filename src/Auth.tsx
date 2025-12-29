import {useState} from "react";
import { useNavigate } from "react-router-dom";
import {getAccessToken} from "./Auth.ts";
import "./Auth.css";

interface AuthProps {
    onSignIn: (token: string) => void;
    onUseMockData: () => void;
}

function AuthPage({onSignIn, onUseMockData}: AuthProps) {
    const[loading,setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate= useNavigate();

    const handleGoogleSignIn = async ()=> {
        setLoading(true);
        setError("");
        try{
            const token = await getAccessToken();
            onSignIn(token);
        }
        catch (e){
            setError(e instanceof Error ? e.message: "Sign in failed");
            setLoading(false);
        }
    };
    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1 className="auth-title">Mail Automation Dashboard</h1>
                <p className="auth-subtitle">Sign in with your Google account to get started</p>
                <button className="auth-button" onClick={handleGoogleSignIn} disabled={loading}>{loading ? "Signing in...": "Sign in with Google"} </button>
                {error && <p className="auth-error"> {error}</p>}
                <button style={{marginTop:"10px",
                padding:"10px 14px",
              backgroundColor:"grey",
              color:"white",
              border:"none",
              borderRadius:"4px", cursor:"pointer"}} onClick={()=>{ onUseMockData(); navigate("/");}}>Use Mock Data</button>
            </div>
        </div>
    );
}
export default AuthPage;