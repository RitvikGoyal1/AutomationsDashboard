import { useState } from "react";
import ReceivedEmail from "./classes/ReceivedEmail";
import User from "./classes/User";
import GmailServices from "./classes/GmailServices";

function EmailFullView() {
  const user = new User();
  user.setWritingStyle("Professional");
  const body = "Hey there! I am planning an event and would like your help, please let me know when you are available. I would love to hear you out and discuss this further. By the way this event is really important and you can not miss it, we have to plan it the best so lets work together on this.";
  const email = new ReceivedEmail("1", "Upcoming Event", body, new Date(), "email@gmail.com");
  const gmailService = new GmailServices(".");
  const [summary, setSummary] = useState("");
  const [reply, setReply] = useState("");

  const getSummary = () => {
    setSummary("Generating summary...");
    email.genSummary().then((text) => {
      setSummary(text);
    });
  };
  const getReply = () => {
    setReply("Generating reply...");
    email.genReply(user).then((text) => {
      setReply(text);
    });
  };
  
  const handleSendReply = () => {
    email.sendReply(reply, gmailService);
  };

  return (
    <div>
      <div>
        <div>
          <h3>Subject: {email.getSubject()}</h3>
          <p style={{ color: "cyan" }}>{email.getDate().toLocaleString()}</p>
          <p>From: {email.getSender()}</p>
          <p>{email.getBody()}</p>
        </div>
      </div>
      <div>
        <button onClick={getSummary}>Summarize</button>
        <button onClick={getReply}>Reply</button>
      </div>
      {summary && (
        <div>
          <h2>Summary</h2>
          <p>{summary}</p>
        </div>
      )}
      {reply && (
        <div>
          <h2>Reply</h2>
          <p>{reply}</p>
          <button onClick={handleSendReply}>Send Reply (Mock)</button>
        </div>
      )}
    </div>
  );
}

export default EmailFullView;
