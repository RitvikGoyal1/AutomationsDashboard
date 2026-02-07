import { useState, useEffect } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import EmailFullView from "./EmailFullView";
import Auth from "./Auth.tsx";
//import {getAccessToken} from "./Auth.ts";
import "./App.css";
import MicrosoftGraphServices from "./classes/MicrosoftGraphServices.ts";
import ReceivedEmail from "./classes/ReceivedEmail";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function App() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(false);
  const [emails, setEmails] = useState<ReceivedEmail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);

  const decodeJwt = (token: string) => {
    try {
      const payload = token.split(".")[1];
      const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
      const decoded = atob(normalized);
      const json = decodeURIComponent(
        decoded
          .split("")
          .map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
          .join(""),
      );
      return JSON.parse(json) as {
        aud?: string;
        scp?: string;
        tid?: string;
        iss?: string;
      };
    } catch {
      return null;
    }
  };

  const mockEmails = (): ReceivedEmail[] => [
    new ReceivedEmail(
      "Mock1",
      "Meeting Invite",
      "Hey, I hope you are doing well. I just wanted to let you know that we have a meeting scheduled for tomorrow at 5 PM. Please remember to be there, on time! \nRegards,\nAlice",
      new Date(),
      "alice@email.com",
    ),
    new ReceivedEmail(
      "Mock2",
      "Project Update",
      "Hi! It's me Tina! I was working on the System Hardware Project and ran into some difficulties. I am not really sure how long it would take for me to get it up and running, I'd say roughly 2 weeks. I hope you understand. \nRegards,\nTina",
      new Date(Date.now() - 86400000),
      "Tina_to@mail.com",
    ),
    new ReceivedEmail(
      "Mock3",
      "Weekly Report",
      "Good Evening! Just wanted to let you know that I am expecting you to have the weekly report completed by the day after tomorrow, 12 PM. Thanks!",
      new Date(Date.now() - 2 * 86400000),
      "boss@gmail.com",
    ),
    new ReceivedEmail(
      "Mock4",
      "Payment Issues",
      "Hi, I was working on the stripe payment integration and I am not able to receive payments due to an error. Please let me know how to fix it when you have time.",
      new Date(Date.now() - 3 * 86400000),
      "jonny@gmail.com",
    ),
    new ReceivedEmail(
      "Mock5",
      "Promotion",
      "Hey Mate, I got some great news for you! You are getting promoted at the end of the month! We have noticed your hard work and dedication and are grateful for your contributions. Looking forward to your continued success!",
      new Date(Date.now() - 3.5 * 86400000),
      "hr@gmail.com",
    ),
  ];
  // useEffect(()=>{
  //   const fetchToken = async () => {
  //     const token = await getAccessToken();
  //     setAccessToken(token);
  //   };
  //   fetchToken();
  // },[]);

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
    } catch (e) {
      console.error("Error fetching", e);
      setError(e instanceof Error ? e.message : "Error fetching");
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <Routes>
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
                  <ul style={{ listStyle: "none", padding: 0 }}>
                    <li style={{ marginBottom: "10px" }}>
                      <Link
                        to="/inbox"
                        style={{ textDecoration: "none", color: "#1a73e8" }}
                      >
                        Inbox ({emails.length})
                      </Link>
                    </li>
                    <li>
                      <a
                        href="#"
                        style={{ textDecoration: "none", color: "#555" }}
                      >
                        Sent Emails
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        style={{ textDecoration: "none", color: "#555" }}
                      >
                        Tasks
                      </a>
                    </li>
                  </ul>
                </div>

                <div style={{ flex: 1, padding: "20px", overflowY: "auto" }}>
                  <h2>Inbox</h2>
                  <input
                    type="text"
                    placeholder="Search emails..."
                    style={{
                      marginBottom: "10px",
                      padding: "8px",
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                  />

                  <DatePicker
                    selected={startDate}
                    onChange={(date: Date | null) => setStartDate(date)}
                    placeholderText="Filter Date"
                  />
                  <br></br>
                  <br></br>
                  <br></br>
                  <button
                    style={{ backgroundColor: "LightGreen" }}
                    onClick={() => alert("gg")}
                  >
                    Understand Writing Style
                  </button>
                  <button
                    style={{
                      backgroundColor: "LightGreen",
                      marginLeft: "155vh",
                    }}
                    onClick={() => alert("gg")}
                  >
                    Sort by Date
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
                      {error.includes("401") &&
                        accessToken &&
                        (() => {
                          const claims = decodeJwt(accessToken);
                          if (!claims) return null;
                          return (
                            <div
                              style={{ marginTop: "10px", fontSize: "12px" }}
                            >
                              <div>
                                <strong>aud:</strong> {claims.aud || "n/a"}
                              </div>
                              <div>
                                <strong>scp:</strong> {claims.scp || "n/a"}
                              </div>
                              <div>
                                <strong>tid:</strong> {claims.tid || "n/a"}
                              </div>
                              <div>
                                <strong>iss:</strong> {claims.iss || "n/a"}
                              </div>
                            </div>
                          );
                        })()}
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

                  {!loading && emails.length > 0 && (
                    <div>
                      {emails.map((email) => (
                        <Link
                          key={email.getId()}
                          to="/inbox/email"
                          state={{ emailId: email.getId() }}
                          style={{ textDecoration: "none", color: "inherit" }}
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
                                {email.getSender()}
                              </strong>
                              <span style={{ fontSize: "12px", color: "#666" }}>
                                {new Date(email.getDate()).toLocaleDateString()}
                              </span>
                            </div>
                            <div
                              style={{ fontSize: "14px", marginBottom: "5px" }}
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
                </div>
              </div>
            )
          }
        />
        <Route
          path="/inbox/email"
          element={<EmailFullView emails={emails} accessToken={accessToken} />}
        />
      </Routes>
    </>
  );
}

export default App;
