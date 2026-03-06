import { Link, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import SentEmail from "./classes/SentEmail";
import "./App.css";
import MicrosoftGraphServices from "./classes/MicrosoftGraphServices";
interface SentProps {
    emails: SentEmail[];
    accessToken: string | null;
    useMockData?: boolean;
}
// Similar to inbox but shows sent emails
function Sent({ emails, accessToken, useMockData }: SentProps) {
    const [displayEmails, setDisplayEmails] = useState<SentEmail[]>(emails);
    // Mock sent email data for those who didn't log in
    const mockEmails = (): SentEmail[] => [
        new SentEmail(
            "Mock1",
            "Just a Meeting Reminder",
            "Hey, I hope you are doing well. I just wanted to let you know that we have a meeting scheduled for tomorrow at 5 PM. Please remember to be there, on time! \nRegards,\nMe",
            new Date(),
            "peter@email.com"
        ),
        new SentEmail(
            "Mock2",
            "Employment Rule Book Project Update",
            "Hi! It's me! I was working on the Employment Rule Book and had some questions. I am not really sure how long it would take for me to get it up and running, I'd say roughly 2 weeks. I hope you understand. \nRegards,\nMe",
            new Date(Date.now() - 86400000),
            "samuel@mail.com"
        ),
        new SentEmail(
            "Mock3",
            "My Weekly Report Update",
            "Good Evening! Just wanted to let you know that I will submit the weekly report by day after tomorrow, 12 PM. Thanks!",
            new Date(Date.now() - 2 * 86400000),
            "donald@gmail.com"
        ),
        new SentEmail(
            "Mock4",
            "Cannot Process Payments",
            "Hi, I was trying to receive payments on our software and it didn't go through. Please let me know how to fix it when you have time.",
            new Date(Date.now() - 3 * 86400000),
            "john@gmail.com"
        ),
        new SentEmail(
            "Mock5",
            "Some Good News to Share",
            "Hey Mate, I got my promotion last week! I guess the boss does notice our hard work and dedication. Hope you get yours soon as well!",
            new Date(Date.now() - 3.5 * 86400000),
            "daniel@gmail.com"
        ),
    ];

    useEffect(() => {
        if (useMockData) {
            setDisplayEmails(mockEmails());
            return;
        }
        if (!accessToken) {
            setDisplayEmails([]);
            return;
        }
        const fetchSent = async () => {
            try {
                const svc = new MicrosoftGraphServices(accessToken);
                const sent = await svc.getSentEmails();
                setDisplayEmails(sent);
            } catch (e) {
                console.error(e);
                setDisplayEmails([]);
            }
        };
        fetchSent();
    }, [accessToken, useMockData]);

    return (
        <>
            {!accessToken && !useMockData ? (
                // if no access token and the user did not select mock data, send them back to login page
                <Navigate to="/" replace />
            ) : (
                // Otherwise display the Sent Emails or mock emails
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
                                <Link
                                    to="/sent"
                                    style={{ textDecoration: "none", color: "#1a73e8" }}
                                >
                                    Sent Emails ({displayEmails.length})
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
                                    style={{ textDecoration: "none", color: "#555" }}
                                >
                                    Backup
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div style={{ flex: 1, padding: "20px", overflowY: "auto" }}>
                        <h2>Sent Emails</h2>
                        {displayEmails.length === 0 && (
                            <div style={{ textAlign: "center", padding: "40px" }}>
                                <p>No sent emails found.</p>
                            </div>
                        )}

                        {displayEmails.length > 0 && (
                            <div>
                                {displayEmails.map((email) => (
                                    // Display each email with an option to full view as well
                                    <Link
                                        key={email.getId()}
                                        to="/sent/email"
                                        state={{ emailId: email.getId(), email, source: "sent" }}
                                        style={{ textDecoration: "none", color: "inherit" }}
                                    >
                                        <div
                                            style={{
                                                padding: "15px",
                                                borderBottom: "1px solid #ddd",
                                                backgroundColor: "white",
                                                cursor: "pointer",
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = "#d6d6e3";
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = "white";
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
                                                    {email.getRecipient()}
                                                </strong>
                                                <span style={{ fontSize: "12px", color: "#666" }}>
                                                    {new Date(email.getDate()).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: "14px", marginBottom: "5px" }}>
                                                {email.getSubject()}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "13px",
                                                    color: "#666",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {/* 100 characters preview */}
                                                {email.getBody().substring(0, 100)}...
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

export default Sent;
