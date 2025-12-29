
import {useState, useEffect} from "react";
import { Link, Route, Routes } from "react-router-dom";
import EmailFullView from "./EmailFullView";
import Auth from "./Auth.tsx";
import {getAccessToken} from "./Auth.ts";
import "./App.css";
import GmailServices from "./classes/GmailServices";
import ReceivedEmail from "./classes/ReceivedEmail";


function App() {
  const [accessToken, setAccessToken] = useState<string| null>(null);
  const [useMockData, setUseMockData]= useState(false);
  const [emails, setEmails] = useState<ReceivedEmail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mockEmails = (): ReceivedEmail[] => [
    new ReceivedEmail("Mock1","Meeting Invite", "Hey, I hope you are doing well. I just wanted to let you know that we have a meeting scheduled for tomorrow at 5 PM. Please remember to be there, on time! \nRegards,\nAlice", new Date(), "alice@email.com"),
    new ReceivedEmail("Mock2","Project Update", "Hi! It's me Tina! I was working on the System Hardware Project and ran into some difficulties. I am not really sure how long it would for me to get it up and running, I'd say roughly 2 weeks. I hope you understand. \nRegards,\nTina", new Date(Date.now() - 86400000), "Tina_to@mail.com"),
    new ReceivedEmail("Mock3", "Weekly Report", "Good Evening! Just wanted to let you know that I am expecting you to have the weekly report completed by the day after tomorrow, 12 PM. Thanks!", new Date(Date.now() - 2 * 86400000), "boss@gmail.com"),
  ];
  // useEffect(()=>{
  //   const fetchToken = async () => {
  //     const token = await getAccessToken();
  //     setAccessToken(token);
  //   };
  //   fetchToken();
  // },[]);

  useEffect(()=>{
    if (accessToken && !useMockData){
      fetchEmails();
    }
  }, [accessToken, useMockData]);

  useEffect(()=>{
    if (useMockData){
      setLoading(true);
      setError(null);
      setEmails(mockEmails());
      setLoading(false);
    }
  },[useMockData]);
  const fetchEmails = async()=>{
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try{
      const gmailServices = new GmailServices(accessToken);
      const receivedEmails = await gmailServices.getReceivedEmails();
      setEmails(receivedEmails);
      
    } catch (e){
      console.error("Error fetching", e);
      setError("Error fetching");
    } finally{
      setLoading(false);
    }
  };
  if (!accessToken && !useMockData) {
    return (
      <div style={{display:"flex", gap:"16px", alignItems:"flex-start", padding:"20px"}}>
        <Auth
          onSignIn={(token)=> setAccessToken(token)}
          onUseMockData={()=> setUseMockData(true)}
        />
          {/* <button
          onClick={()=> setUseMockData(true)}
            style={{
              padding:"10px 14px",
              backgroundColor:"green",
              color:"white",
              border:"none",
              borderRadius:"4px",
              cursor:"pointer"
            }}>
            Use Mock Data
            </button> */}
          
      </div>
    );
  }


  return (
    <>
      <Routes>
        <Route path="/"
        element={
          <div style={{display:"flex", height:"100vh"}}>
            <div style={{width:"250px", backgroundColor: "#f5f5f5", padding: "20px", borderRight:"1px solid #ddd"}}>
              <h2>Mail Dashboard</h2>
              <ul style={{listStyle:"none", padding:0}}>
                <li style={{marginBottom: "10px"}}>
                  <Link to="/" style={{textDecoration:"none", color:"#1a73e8"}}>
                  Inbox ({emails.length})
                  </Link>
                </li>
                <li>
                  <a href="#" style={{textDecoration:"none", color:"#555"}}>
                  Tasks
                  </a>
                </li>
              </ul>
            </div>


            <div style={{flex:1, padding:"20px", overflowY:"auto"}}>
              <h2>Inbox</h2>
              {useMockData && (
                <div style={{marginBottom:"10px", color:"555"}}>
                  <em>Using Mock Data. </em>
                  </div>
              )}
              {loading && (
                <div style={{textAlign:"center",padding:"40px"}}>
                  <p>Loading emails...</p>
                  </div>
              )}
              {error && (
                <div style={{
                  backgroundColor:"#fee",
                  border: "1px solid #fcc",
                  padding:"15px",
                  borderRadius:"4px",
                  marginBottom:"20px"
                }}>
                <p style={{color:"#c00", margin:0}}>{error}</p>
                <button onClick={fetchEmails}
                style={{marginTop:"10px", padding:"8px 10px", backgroundColor:"#1a73e8", color:"white", border:"none", borderRadius:"4px", cursor:"pointer"}}
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
                      to="/email"
                      state={{ emailId: email.getId() }}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <div
                        style={{
                          padding: "15px",
                          borderBottom: "1px solid #ddd",
                          cursor: "pointer",
                          transition: "background-color 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#f9f9f9";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "white";
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                          <strong style={{ fontSize: "14px" }}>{email.getSender()}</strong>
                          <span style={{ fontSize: "12px", color: "#666" }}>
                            {new Date(email.getDate()).toLocaleDateString()}
                          </span>
                        </div>
                        <div style={{ fontSize: "14px", marginBottom: "5px" }}>
                          {email.getSubject()}
                        </div>
                        <div style={{ fontSize: "13px", color: "#666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {email.getBody().substring(0, 100)}...
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        }
        />
        <Route path="/email" element={<EmailFullView emails={emails} accessToken={accessToken} />} />
      </Routes>
    </>
  );
}

export default App;