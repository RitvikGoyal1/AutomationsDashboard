import SentEmail from "./SentEmail";
import ReceivedEmail from "./ReceivedEmail";
// interact with Microsoft Graph API to get emails and send replies
class MicrosoftGraphServices {
    private token: string;
    constructor(token: string) {
        this.token = token;
    }

    public async getSentEmails(): Promise<SentEmail[]> {
        // get 10 most recent sent emails
        const result = await fetch(
            `https://graph.microsoft.com/v1.0/me/mailFolders/sentItems/messages?$top=10&$orderby=sentDateTime desc`,
            { headers: { Authorization: `Bearer ${this.token}` } }
        );
        if (!result.ok) {
            const errorText = await result.text();
            throw new Error(`API Error: ${result.status} ${errorText}`);
        }
        const data = await result.json();
        if (!data.value) {
            return [];
        }
        // convert each message to SentEmail object
        const sentEmails = data.value.map((message: any) => this.parseSentEmail(message));
        return sentEmails;
    }
    // parse json response into SentEmail object
    private parseSentEmail(message: any): SentEmail {
        const id = message.id;
        const subject = message.subject || "";
        const body = this.decodeBody(message.body);
        const date = new Date(message.sentDateTime);
        const recipient = message.toRecipients?.[0]?.emailAddress?.address || "";
        return new SentEmail(id, subject, body, date, recipient);
    }
    // same as getSentEmails but for inbox
    public async getReceivedEmails(): Promise<ReceivedEmail[]> {
        const result = await fetch(
            `https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$top=10&$orderby=receivedDateTime desc`,
            { headers: { Authorization: `Bearer ${this.token}` } }
        );
        if (!result.ok) {
            const errorText = await result.text();
            throw new Error(`API Error: ${result.status} ${errorText}`);
        }
        const data = await result.json();
        if (!data.value) {
            return [];
        }
        const receivedEmails = data.value.map((message: any) => this.parseReceivedEmail(message));
        return receivedEmails;
    }
    private parseReceivedEmail(message: any): ReceivedEmail {
        const id = message.id;
        const subject = message.subject || "";
        const body = this.decodeBody(message.body);
        const date = new Date(message.receivedDateTime);
        const sender = message.from?.emailAddress?.address || "";
        return new ReceivedEmail(id, subject, body, date, sender);
    }
    // decode body - strip html tags if needed
    private decodeBody(body: any): string {
        if (!body || !body.content) return "";
        const content = body.content;
        const isHtml = body.contentType?.toLowerCase().includes("html");
        // strip out html tags
        return isHtml ? content.replace(/<[^>]*>/g, "").trim() : content;
    }
    // send reply to an email
    public async sendReply(emailId: string, replyBody: string): Promise<void> {
        try {
            const payload = {
                comment: replyBody,
            };
            const result = await fetch(
                `https://graph.microsoft.com/v1.0/me/messages/${emailId}/reply`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${this.token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                }
            );
            if (result.ok) {
                alert("Sent!");
            } else {
                alert("Failed to send reply");
            }
        } catch (e) {
            alert("Failed");
        }
    }
}
export default MicrosoftGraphServices;
