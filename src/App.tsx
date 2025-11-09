import { Link, Route, Routes } from "react-router-dom";
import EmailFullView from "./EmailFullView";
import "./App.css";

function Home() {
  return (
    
    <div>
      <h1>Inbox</h1>
      <Link style={{ textDecoration: "none", color: "inherit", border: "1px solid black ", borderRadius: "4px", padding: "8px", display: "block", marginBottom: "8px" }} to="/EmailFullView">
        <span>Subject: Upcoming Event</span>
        <div style={{ fontStyle: "italic", fontSize: "small" }}>email@gmail.com</div>
      </Link>
    </div>
  );
}

function App() {
  return (
    
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/EmailFullView" element={<EmailFullView />} />
    </Routes>
  );
}

export default App;
