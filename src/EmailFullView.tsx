import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ReceivedEmail from "./classes/ReceivedEmail";
import User from "./classes/User";
import MicrosoftGraphServices from "./classes/MicrosoftGraphServices";
import "./class-styles/EmailFullView.css";

type EmailFullViewProps = {
  emails: ReceivedEmail[];
  accessToken: string | null;
};

function EmailFullView({ emails, accessToken }: EmailFullViewProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { emailId } = (location.state as { emailId?: string }) || {};
  const selectedEmail = useMemo(
    () => emails.find((item) => item.getId() === emailId),
    [emails, emailId],
  );

  const user = useMemo(() => {
    const nextUser = new User();
    nextUser.setWritingStyle("Professional");
    return nextUser;
  }, []);

  const [summary, setSummary] = useState("");
  const [reply, setReply] = useState("");

  if (!selectedEmail) {
    return (
      <div className="email-full-view">
        <div className="email-container">
          <p>Unable to find that email.</p>
          <button
            className="action-button primary"
            onClick={() => navigate("/inbox")}
          >
            Back to inbox
          </button>
        </div>
      </div>
    );
  }

  const microsoftGraphService = accessToken ? new MicrosoftGraphServices(accessToken) : null;

  const getSummary = () => {
    setSummary("Generating summary...");
    selectedEmail.genSummary().then((text) => {
      setSummary(text);
    });
  };

  const getReply = () => {
    setReply("Generating reply...");
    selectedEmail.genReply(user).then((text) => {
      setReply(text);
    });
  };

  const handleSendReply = () => {
    if (!microsoftGraphService) {
      setReply("Access token required to send a reply.");
      return;
    }
    selectedEmail.sendReply(reply, microsoftGraphService);
  };

  const getInitials = (senderEmail: string) =>
    senderEmail.charAt(0).toUpperCase();

  return (
    <div className="email-full-view">
      <div className="email-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ←
        </button>
      </div>
      <div className="email-container">
        <div className="email-meta">
          <div className="sender-info">
            <div className="sender-avatar">
              {getInitials(selectedEmail.getSender())}
            </div>
            <div className="sender-details">
              <p className="sender-name">{selectedEmail.getSender()}</p>
              <p className="sender-email">{selectedEmail.getSender()}</p>
            </div>
          </div>
          <p className="email-date">
            {selectedEmail.getDate().toLocaleString()}
          </p>
        </div>

        <h1 className="email-subject">{selectedEmail.getSubject()}</h1>
        <div className="email-body">{selectedEmail.getBody()}</div>

        <div className="email-actions">
          <button className="action-button primary" onClick={getReply}>
            Reply
          </button>
          <button className="action-button" onClick={getSummary}>
            Summarize
          </button>
        </div>

        {summary && (
          <div className="section">
            <h2>Email Summary</h2>
            <div className="summary-content">{summary}</div>
          </div>
        )}

        {reply && (
          <div className="section reply-section">
            <h2>Reply</h2>
            <textarea
              className="reply-textarea"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Write your reply..."
            />
            <div className="reply-actions">
              <button
                className="action-button primary"
                onClick={handleSendReply}
              >
                Send Reply
              </button>
              <button className="action-button" onClick={() => setReply("")}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmailFullView;
