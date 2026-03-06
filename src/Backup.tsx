import { Link, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import ReceivedEmail from "./classes/ReceivedEmail";
import { getActiveAccount } from "./Auth.ts";
import "./App.css";

interface BackupProps {
    accessToken: string | null;
    useMockData?: boolean;
}

function Backup({ accessToken, useMockData }: BackupProps) {
    const [displayEmails, setDisplayEmails] = useState<ReceivedEmail[]>([]);
    const [loading, setLoading] = useState(false);

    const API_BASE = (
        import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? "" : "http://localhost:3001")
    ).replace(/\/$/, "");

    useEffect(() => {
        if (useMockData || !accessToken) {
            setDisplayEmails([]);
            return;
        }

        const fetchBackupEmails = async () => {
            setLoading(true);
            try {
                const account = await getActiveAccount();
                const userEmail = account?.username || "";
                
                console.log("🔍 Backup: Active account:", account);
                console.log("📧 Backup: User email:", userEmail);

                if (!userEmail) {
                    console.warn("⚠️ Backup: No user email found");
                    setDisplayEmails([]);
                    return;
                }

                console.log(`📥 Fetching backup emails for ${userEmail}`);
                const response = await fetch(
                    `${API_BASE}/api/emails?userEmail=${encodeURIComponent(userEmail)}`
                );
                
                console.log(`📥 Backup response status: ${response.status}`);
                
                if (!response.ok) {
                    throw new Error("Failed to fetch emails");
                }

                const data = await response.json();
                console.log(`✅ Backup: Retrieved ${data.emails.length} emails from database`);
                
                const emails = data.emails.map(
                    (email: any) =>
                        new ReceivedEmail(
                            email.email_id,
                            email.subject,
                            "", // We don't store the body in the database
                            new Date(email.received_datetime),
                            email.sender
                        )
                );
                setDisplayEmails(emails);
            } catch (error) {
                console.error("❌ Error fetching backup emails:", error);
                setDisplayEmails([]);
            } finally {
                setLoading(false);
            }
        };

        fetchBackupEmails();
    }, [accessToken, useMockData]);

    return (
        <>
            {!accessToken && !useMockData ? (
                <Navigate to="/" replace />
            ) : (
                <div style={{ display: "flex", height: "100vh" }}>
                    <div
                        style={{
                            width: "250px",
                            backgroundColor: "#f5f5f5",
                            padding: "20px",
                            borderRight: "1px solid #ddd",
                        }}
                    >
                        <h2>Mail Dashboard</h2>
                        {/* Sidebar navigation*/}
                        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                            <li style={{ marginBottom: "10px" }}>
                                <Link to="/inbox" style={{ textDecoration: "none", color: "#555" }}>
                                    Inbox
                                </Link>
                            </li>
                            <li style={{ marginBottom: "10px" }}>
                                <Link to="/sent" style={{ textDecoration: "none", color: "#555" }}>
                                    Sent Emails
                                </Link>
                            </li>
                            <li style={{ marginBottom: "10px" }}>
                                <Link to="/Tasks" style={{ textDecoration: "none", color: "#555" }}>
                                    Tasks
                                </Link>
                            </li>
                            <li style={{ marginBottom: "10px" }}>
                                <Link
                                    to="/backup"
                                    style={{ textDecoration: "none", color: "#1a73e8" }}
                                >
                                    Backup ({displayEmails.length})
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div style={{ flex: 1, padding: "20px", overflowY: "auto" }}>
                        <h2>Email Backup</h2>
                        {loading && (
                            <div style={{ textAlign: "center", padding: "40px" }}>
                                <p>Loading emails from backup...</p>
                            </div>
                        )}

                        {!loading && displayEmails.length === 0 && (
                            <div style={{ textAlign: "center", padding: "40px" }}>
                                <p>No emails in backup.</p>
                            </div>
                        )}

                        {!loading && displayEmails.length > 0 && (
                            <div>
                                {displayEmails.map((email) => (
                                    // Display each email
                                    <div
                                        key={email.getId()}
                                        style={{
                                            padding: "15px",
                                            borderBottom: "1px solid #ddd",
                                            backgroundColor: "white",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                marginBottom: "5px",
                                            }}
                                        >
                                            <strong style={{ fontSize: "14px" }}>
                                                {email.getSender()}
                                            </strong>
                                            <span style={{ fontSize: "12px", color: "#666" }}>
                                                {new Date(email.getDate()).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: "14px", marginBottom: "5px" }}>
                                            {email.getSubject()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

export default Backup;
