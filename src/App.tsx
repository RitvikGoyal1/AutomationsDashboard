import { useState, useEffect } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import EmailFullView from "./EmailFullView";
import Auth from "./Auth.tsx";
import { getActiveAccount } from "./Auth.ts";
import "./App.css";
import MicrosoftGraphServices from "./classes/MicrosoftGraphServices.ts";
import ReceivedEmail from "./classes/ReceivedEmail";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Sent from "./Sent.tsx";
import Tasks from "./Tasks.tsx";
import Backup from "./Backup.tsx";
import MistralServices from "./classes/MistralServices.ts";
import User from "./classes/User";
import { mergeSortEmailsBySubject } from "./MergeSort";
function App() {
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [useMockData, setUseMockData] = useState(false);
    const [emails, setEmails] = useState<ReceivedEmail[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [searchSubject, setSearchSubject] = useState<string>("");
    const [searchResults, setSearchResults] = useState<ReceivedEmail[]>([]);
    const [showSearchResult, setShowSearchResult] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    // decode jwt to get user info
    const decodeJwt = (token: string) => {
        try {
            const parts = token.split(".");
            const payload = parts[1];
            const decoded = atob(payload);
            return JSON.parse(decoded);
        } catch (e) {
            return null;
        }
    };
    // Mock data to test without logging in
    const mockEmails = (): ReceivedEmail[] => [
        new ReceivedEmail(
            "Mock1",
            "Meeting Invite",
            "Hey, I hope you are doing well. I just wanted to let you know that we have a meeting scheduled for tomorrow at 5 PM. Please remember to be there, on time! \nRegards,\nAlice",
            new Date(),
            "alice@email.com"
        ),
        new ReceivedEmail(
            "Mock2",
            "Project Update",
            "Hi! It's me Tina! I was working on the System Hardware Project and ran into some difficulties. I am not really sure how long it would take for me to get it up and running, I'd say roughly 2 weeks. I hope you understand. \nRegards,\nTina",
            new Date(Date.now() - 86400000),
            "Tina_to@mail.com"
        ),
        new ReceivedEmail(
            "Mock3",
            "Weekly Report",
            "Good Evening! Just wanted to let you know that I am expecting you to have the weekly report completed by the day after tomorrow, 12 PM. Thanks!",
            new Date(Date.now() - 2 * 86400000),
            "boss@gmail.com"
        ),
        new ReceivedEmail(
            "Mock4",
            "Payment Issues",
            "Hi, I was working on the stripe payment integration and I am not able to receive payments due to an error. Please let me know how to fix it when you have time.",
            new Date(Date.now() - 3 * 86400000),
            "jonny@gmail.com"
        ),
        new ReceivedEmail(
            "Mock5",
            "Promotion",
            "Hey Mate, I got some great news for you! You are getting promoted at the end of the month! We have noticed your hard work and dedication and are grateful for your contributions. Looking forward to your continued success!",
            new Date(Date.now() - 3.5 * 86400000),
            "hr@gmail.com"
        ),
    ];
    // load emails when user signs in
    useEffect(() => {
        if (accessToken && !useMockData) {
            fetchEmails();
        }
    }, [accessToken, useMockData]);

    useEffect(() => {
        if (useMockData) {
            setLoading(true);
            setError(null);
            setEmails(mockEmails());
            setLoading(false);
        }
    }, [useMockData]);
    const fetchEmails = async () => {
        if (!accessToken) return;
        setLoading(true);
        setError(null);
        try {
            const microsoftGraphServices = new MicrosoftGraphServices(accessToken);
            const receivedEmails = await microsoftGraphServices.getReceivedEmails();
            setEmails(receivedEmails);

            // save emails to db
            const account = await getActiveAccount();
            const userEmail = account ? account.username : "";

            const decodedToken = decodeJwt(accessToken);
            const tokenEmail =
                decodedToken?.upn || decodedToken?.email || decodedToken?.preferred_username || "";

            const finalEmail = userEmail || tokenEmail;

            if (finalEmail) {
                for (const email of receivedEmails) {
                    try {
                        await fetch(
                            (
                                import.meta.env.VITE_API_BASE_URL ||
                                (import.meta.env.PROD ? "" : "http://localhost:3001")
                            ).replace(/\/$/, "") + "/api/email",
                            {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    emailId: email.getId(),
                                    userEmail: finalEmail,
                                    subject: email.getSubject(),
                                    sender: email.getSender(),
                                    receivedDatetime: email.getDate().toISOString(),
                                }),
                            }
                        );
                    } catch (err) {
                        console.error("Error saving email:", err);
                    }
                }
            }
        } catch (e) {
            console.error("Error fetching emails:", e);
            setError("Error fetching");
        } finally {
            setLoading(false);
        }
    };
    return (
        <>
            <Routes>
                <Route
                    path="/sent"
                    element={
                        <Sent emails={[]} accessToken={accessToken} useMockData={useMockData} />
                    }
                />
                <Route
                    path="/Tasks"
                    element={<Tasks accessToken={accessToken} useMockData={useMockData} />}
                />
                <Route
                    path="/backup"
                    element={<Backup accessToken={accessToken} useMockData={useMockData} />}
                />
                <Route
                    path="/"
                    element={
                        !accessToken && !useMockData ? (
                            <div
                                style={{
                                    display: "flex",
                                    gap: "16px",
                                    alignItems: "flex-start",
                                    padding: "20px",
                                }}
                            >
                                <Auth
                                    onSignIn={(token) => setAccessToken(token)}
                                    onUseMockData={() => setUseMockData(true)}
                                />
                            </div>
                        ) : (
                            // Otherwise operation
                            <Navigate to="/inbox" replace />
                        )
                    }
                />
                <Route
                    path="/inbox"
                    element={
                        !accessToken && !useMockData ? (
                            <Navigate to="/" replace />
                        ) : (
                            <div style={{ display: "flex", height: "200vh" }}>
                                <div
                                    style={{
                                        width: "250px",
                                        backgroundColor: "#f5f5f5",
                                        padding: "20px",
                                        borderRight: "1px solid #ddd",
                                    }}
                                >
                                    <h2>Mail Dashboard</h2>

                                    {/* sidebar links */}
                                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                                        <li style={{ marginBottom: "10px" }}>
                                            <Link
                                                to="/inbox"
                                                style={{ textDecoration: "none", color: "#1a73e8" }}
                                            >
                                                Inbox ({emails.length})
                                            </Link>
                                        </li>
                                        <li style={{ marginBottom: "10px" }}>
                                            <Link
                                                to="/sent"
                                                style={{ textDecoration: "none", color: "#555" }}
                                            >
                                                Sent Emails
                                            </Link>
                                        </li>
                                        <li style={{ marginBottom: "10px" }}>
                                            <Link
                                                to="/Tasks"
                                                style={{ textDecoration: "none", color: "#555" }}
                                            >
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
                                    <h2>Inbox</h2>
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: "10px",
                                            marginBottom: "10px",
                                        }}
                                    >
                                        {/* search by subject */}
                                        <input
                                            type="text"
                                            placeholder="Search by subject..."
                                            value={searchSubject}
                                            onChange={(e) => setSearchSubject(e.target.value)}
                                            style={{
                                                padding: "8px",
                                                flex: 1,
                                                boxSizing: "border-box",
                                            }}
                                        />
                                        <button
                                            style={{
                                                padding: "8px 16px",
                                                backgroundColor: "#1a73e8",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "4px",
                                                cursor: "pointer",
                                            }}
                                            onClick={() => {
                                                if (!searchSubject.trim()) {
                                                    alert("Please enter a subject to search");
                                                    return;
                                                }
                                                // filter by subject
                                                const sortedBySubject = mergeSortEmailsBySubject([
                                                    ...emails,
                                                ]);
                                                const target = searchSubject.toLowerCase().trim();
                                                const results = sortedBySubject.filter((email) =>
                                                    email
                                                        .getSubject()
                                                        .toLowerCase()
                                                        .includes(target)
                                                );
                                                setSearchResults(results);
                                                setShowSearchResult(true);
                                                if (results.length === 0) {
                                                    alert(
                                                        `No email found with subject containing: "${searchSubject}"`
                                                    );
                                                }
                                            }}
                                        >
                                            Search Subject
                                        </button>
                                    </div>
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: "10px",
                                            marginBottom: "10px",
                                        }}
                                    >
                                        {/* search by date picker */}

                                        <DatePicker
                                            selected={startDate}
                                            onChange={(date: Date | null) => setStartDate(date)}
                                            placeholderText="Select date to search"
                                        />
                                        <button
                                            style={{
                                                padding: "8px 16px",
                                                backgroundColor: "#1a73e8",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "4px",
                                                cursor: "pointer",
                                            }}
                                            onClick={() => {
                                                if (!startDate) {
                                                    alert("Please select a date to search");
                                                    return;
                                                }
                                                // filter emails by date
                                                const sortedByDate = [...emails].sort(
                                                    (a, b) =>
                                                        a.getDate().getTime() -
                                                        b.getDate().getTime()
                                                );
                                                const targetTime = new Date(
                                                    startDate.getFullYear(),
                                                    startDate.getMonth(),
                                                    startDate.getDate()
                                                ).getTime();

                                                const results = sortedByDate.filter((email) => {
                                                    const emailDate = email.getDate();
                                                    const emailTime = new Date(
                                                        emailDate.getFullYear(),
                                                        emailDate.getMonth(),
                                                        emailDate.getDate()
                                                    ).getTime();
                                                    return emailTime === targetTime;
                                                });

                                                setSearchResults(results);
                                                setShowSearchResult(true);
                                                if (results.length === 0) {
                                                    alert(
                                                        `No email found on: ${startDate.toLocaleDateString()}`
                                                    );
                                                }
                                            }}
                                        >
                                            Search Date
                                        </button>
                                        {/* clear search button */}
                                        <button
                                            style={{
                                                padding: "8px 16px",
                                                backgroundColor: "#666",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "4px",
                                                cursor: "pointer",
                                            }}
                                            onClick={() => {
                                                setShowSearchResult(false);
                                                setSearchResults([]);
                                                setSearchSubject("");
                                                setStartDate(null);
                                            }}
                                        >
                                            Clear Search
                                        </button>
                                    </div>
                                    <br />
                                    <br />
                                    <br />
                                    {/* button to analyze writing style from sent emails */}
                                    <button
                                        style={{ backgroundColor: "LightGreen" }}
                                        onClick={async () => {
                                            if (!accessToken) {
                                                alert("No access token available");
                                                return;
                                            }
                                            try {
                                                const svc = new MicrosoftGraphServices(accessToken);
                                                const sent = await svc.getSentEmails();
                                                // log samples for debugging
                                                console.log("Sent emails:", sent);
                                                const emailSamples = sent.map((e) => e.getBody());
                                                const newUser = new User();
                                                await MistralServices.understandWritingStyle(
                                                    newUser,
                                                    emailSamples
                                                );
                                                alert("Understanding Writing Style Complete");
                                                console.log(
                                                    "Detected writing style:",
                                                    newUser.getWritingStyle()
                                                );
                                                setCurrentUser(newUser);
                                            } catch (err) {
                                                console.error(err);
                                                alert("Error running writing style analysis");
                                            }
                                        }}
                                    >
                                        Understand Writing Style
                                    </button>
                                    {/* sort emails by subject */}
                                    <button
                                        style={{
                                            backgroundColor: "LightBlue",
                                            marginLeft: "155vh",
                                        }}
                                        onClick={() =>
                                            setEmails((current) =>
                                                mergeSortEmailsBySubject([...current])
                                            )
                                        }
                                    >
                                        Sort by Subject
                                    </button>
                                    {useMockData && (
                                        <div style={{ marginBottom: "10px", color: "555" }}>
                                            <em>Using Mock Data. </em>
                                        </div>
                                    )}
                                    {loading && (
                                        <div style={{ textAlign: "center", padding: "40px" }}>
                                            <p>Loading emails...</p>
                                        </div>
                                    )}
                                    {error && (
                                        <div
                                            style={{
                                                backgroundColor: "#fee",
                                                border: "1px solid #fcc",
                                                padding: "15px",
                                                borderRadius: "4px",
                                                marginBottom: "20px",
                                            }}
                                        >
                                            <p style={{ color: "#c00", margin: 0 }}>{error}</p>
                                            {/* // Error Checking */}
                                            {error.includes("401") &&
                                                accessToken &&
                                                (() => {
                                                    const claims = decodeJwt(accessToken);
                                                    if (!claims) return null;
                                                    return (
                                                        <div
                                                            style={{
                                                                marginTop: "10px",
                                                                fontSize: "12px",
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    marginTop: "10px",
                                                                    fontSize: "12px",
                                                                }}
                                                            >
                                                                <p>
                                                                    Token expired or invalid. Please
                                                                    sign in again.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            {/* retry button */}
                                            <button
                                                onClick={fetchEmails}
                                                style={{
                                                    marginTop: "10px",
                                                    padding: "8px 10px",
                                                    backgroundColor: "#1a73e8",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: "4px",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Retry
                                            </button>
                                        </div>
                                    )}
                                    {!loading && !error && emails.length === 0 && (
                                        <div style={{ textAlign: "center", padding: "40px" }}>
                                            <p>No emails found.</p>
                                        </div>
                                    )}
                                    {/* search results */}
                                    {showSearchResult && searchResults.length > 0 && (
                                        <div
                                            style={{
                                                backgroundColor: "#c0daed",
                                                padding: "15px",
                                                marginBottom: "20px",
                                            }}
                                        >
                                            <h3 style={{ marginTop: 0, color: "Light Blue" }}>
                                                Search Results ({searchResults.length}):
                                            </h3>
                                            {searchResults.map((email) => (
                                                <Link
                                                    key={email.getId()}
                                                    to="/inbox/email"
                                                    state={{ emailId: email.getId() }}
                                                    style={{
                                                        textDecoration: "none",
                                                        color: "inherit",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            padding: "15px",
                                                            backgroundColor: "white",
                                                            cursor: "pointer",
                                                            marginBottom: "8px",
                                                        }}
                                                    >
                                                        {/* display search result */}

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
                                                            <span
                                                                style={{
                                                                    fontSize: "12px",
                                                                    color: "#666",
                                                                }}
                                                            >
                                                                {new Date(
                                                                    email.getDate()
                                                                ).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize: "14px",
                                                                marginBottom: "5px",
                                                            }}
                                                        >
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
                                                            {email.getBody().substring(0, 100)}...
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                    {/* show all emails */}
                                    {!loading && emails.length > 0 && (
                                        <div>
                                            <h3>All Emails:</h3>
                                            {emails.map((email) => (
                                                <Link
                                                    key={email.getId()}
                                                    to="/inbox/email"
                                                    state={{ emailId: email.getId() }}
                                                    style={{
                                                        textDecoration: "none",
                                                        color: "inherit",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            padding: "15px",
                                                            borderBottom: "1px solid #ddd",
                                                            backgroundColor: "white",
                                                            cursor: "pointer",
                                                            transition: "background-color 0.2s",
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.backgroundColor =
                                                                "#d6d6e3";
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.backgroundColor =
                                                                "white";
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
                                                            <span
                                                                style={{
                                                                    fontSize: "12px",
                                                                    color: "#666",
                                                                }}
                                                            >
                                                                {new Date(
                                                                    email.getDate()
                                                                ).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize: "14px",
                                                                marginBottom: "5px",
                                                            }}
                                                        >
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
                                                            {/* preview only 100 chars */}
                                                            {email.getBody().substring(0, 100)}...
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    }
                />
                <Route
                    // open email in full view
                    path="/inbox/email"
                    element={
                        <EmailFullView
                            emails={emails}
                            accessToken={accessToken}
                            user={currentUser}
                        />
                    }
                />
                <Route
                    path="/sent/email"
                    element={
                        <EmailFullView
                            emails={emails}
                            accessToken={accessToken}
                            user={currentUser}
                        />
                    }
                />
            </Routes>
        </>
    );
}

export default App;
