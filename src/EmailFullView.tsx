import { useMemo, useState } from "react";
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
// Allows users to open a single email as a whole and be able to get a summary and send a reply
function EmailFullView({ emails, accessToken, user }: EmailFullViewProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const { emailId, email } =
        (location.state as { emailId?: string; email?: ViewableEmail }) || {};
    const selectedEmail = useMemo<ViewableEmail | undefined>(() => {
        if (email) return email;
        return emails.find((item) => item.getId() === emailId);
    }, [emails, emailId, email]);

    const userForReply = useMemo(() => {
        if (user) return user;
        const nextUser = new User();
        nextUser.setWritingStyle("Professional");
        return nextUser;
    }, [user]);

    const [summary, setSummary] = useState("");
    const [reply, setReply] = useState("");

    const isReceivedEmail = (item: ViewableEmail): item is ReceivedEmail =>
        item instanceof ReceivedEmail || "getSender" in item || "sender" in item;

    const isSentEmail = (item: ViewableEmail): item is SentEmail =>
        item instanceof SentEmail || "getRecipient" in item || "recipient" in item;

    const isValidEmail = (item: unknown): item is ViewableEmail =>
        item !== null &&
        typeof item === "object" &&
        ("getSender" in item ||
            "getRecipient" in item ||
            "sender" in item ||
            "recipient" in item) &&
        ("getDate" in item || "date" in item) &&
        ("getSubject" in item || "subject" in item) &&
        ("getBody" in item || "body" in item) &&
        ("getId" in item || "id" in item);
    // TODO
    const getEmailProperty = <T,>(
        obj: unknown,
        methodName: string,
        propertyName: string,
        fallback: T
    ): T => {
        if (!obj || typeof obj !== "object") return fallback;
        const obj_ = obj as Record<string, unknown>;
        if (typeof obj_[methodName] === "function") {
            try {
                return (obj_[methodName] as () => T)();
            } catch {
                return fallback;
            }
        }
        return (obj_[propertyName] as T) ?? fallback;
    };

    if (!selectedEmail || !isValidEmail(selectedEmail)) {
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
        const text = getEmailProperty(selectedEmail, "getBody", "body", "");
        if (text.length <= 220) {
            setSummary(text);
            return;
        }
        setSummary(`${text.slice(0, 220)}...`);
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

    const senderOrRecipient = isReceivedEmail(selectedEmail)
        ? getEmailProperty(selectedEmail, "getSender", "sender", "Unknown")
        : isSentEmail(selectedEmail)
          ? getEmailProperty(selectedEmail, "getRecipient", "recipient", "Unknown")
          : "Unknown";

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
                    <p className="email-date">
                        {getEmailProperty(
                            selectedEmail,
                            "getDate",
                            "date",
                            new Date()
                        ).toLocaleString?.() || "Unknown Date"}
                    </p>
                </div>

                <h1 className="email-subject">
                    {getEmailProperty(selectedEmail, "getSubject", "subject", "No Subject")}
                </h1>
                <div className="email-body">
                    {getEmailProperty(selectedEmail, "getBody", "body", "")}
                </div>

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
