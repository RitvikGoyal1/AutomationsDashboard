import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ReceivedEmail from "./classes/ReceivedEmail";
import SentEmail from "./classes/SentEmail";
import User from "./classes/User";
import MicrosoftGraphServices from "./classes/MicrosoftGraphServices";
import "./class-styles/EmailFullView.css";

type EmailFullViewProps = {
    emails: ReceivedEmail[];
    accessToken: string | null;
    user: User | null;
};

type ViewableEmail = ReceivedEmail | SentEmail;
// let users open single email and get summary/send reply
function EmailFullView({ emails, accessToken, user }: EmailFullViewProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const { emailId, email } =
        (location.state as { emailId?: string; email?: ViewableEmail }) || {};

    // find the email
    let selectedEmail: ViewableEmail | undefined;
    if (email) {
        selectedEmail = email;
    } else {
        selectedEmail = emails.find((item) => item.getId() === emailId);
    }

    // setup user for replying
    let userForReply = user;
    if (!userForReply) {
        userForReply = new User();
        userForReply.setWritingStyle("Professional");
    }

    const [summary, setSummary] = useState("");
    const [reply, setReply] = useState("");

    const isReceivedEmail = (item: ViewableEmail): item is ReceivedEmail =>
        item instanceof ReceivedEmail;

    const isSentEmail = (item: ViewableEmail): item is SentEmail => item instanceof SentEmail;

    if (!selectedEmail) {
        return (
            <div className="email-full-view">
                <div className="email-container">
                    <p>Unable to find that email.</p>
                    <button className="action-button primary" onClick={() => navigate("/inbox")}>
                        Back to inbox
                    </button>
                </div>
            </div>
        );
    }

    const microsoftGraphService = accessToken ? new MicrosoftGraphServices(accessToken) : null;

    const getSummary = () => {
        setSummary("Generating summary...");
        if (isReceivedEmail(selectedEmail)) {
            selectedEmail.genSummary().then((text) => {
                setSummary(text);
            });
            return;
        }
        // for sent emails just truncate
        const text = selectedEmail.getBody();
        if (text.length <= 220) {
            setSummary(text);
        } else {
            setSummary(text.substring(0, 220) + "...");
        }
    };

    const getReply = () => {
        if (!isReceivedEmail(selectedEmail)) {
            return;
        }
        setReply("Generating reply...");
        selectedEmail.genReply(userForReply).then((text) => {
            setReply(text);
        });
    };

    const handleSendReply = () => {
        if (!isReceivedEmail(selectedEmail)) {
            return;
        }
        if (!microsoftGraphService) {
            setReply(
                "Access token required to send a reply. If you are using mock data, please sign in to send from your account."
            );
            return;
        }
        selectedEmail.sendReply(reply, microsoftGraphService);
    };

    const getInitials = (senderEmail: string) => senderEmail.charAt(0).toUpperCase();

    // figure out who to display
    let senderOrRecipient = "Unknown";
    if (isReceivedEmail(selectedEmail)) {
        senderOrRecipient = selectedEmail.getSender();
    } else if (isSentEmail(selectedEmail)) {
        senderOrRecipient = selectedEmail.getRecipient();
    }

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
                        <div className="sender-avatar">{getInitials(senderOrRecipient)}</div>
                        <div className="sender-details">
                            <p className="sender-name">{senderOrRecipient}</p>
                            <p className="sender-email">{senderOrRecipient}</p>
                        </div>
                    </div>
                    <p className="email-date">{selectedEmail.getDate().toLocaleString()}</p>
                </div>

                <h1 className="email-subject">{selectedEmail.getSubject()}</h1>
                <div className="email-body">{selectedEmail.getBody()}</div>

                <div className="email-actions">
                    {isReceivedEmail(selectedEmail) && (
                        <>
                            <button className="action-button primary" onClick={getReply}>
                                Reply
                            </button>

                            <button className="action-button" onClick={getSummary}>
                                Summarize
                            </button>
                        </>
                    )}
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
                            <button className="action-button primary" onClick={handleSendReply}>
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
