import SentEmail from "./SentEmail";
import ReceivedEmail from "./ReceivedEmail";
// Service class to interact with Microsoft Graph API, for getting sent and received emails and sending replies for outlook and hotmail emails
class MicrosoftGraphServices {
    private token: string;
    constructor(token: string) {
        this.token = token;
    }

    public async getSentEmails(): Promise<SentEmail[]> {
        // Retrieve the 10 most recent sent emails, sorted
        const result = await fetch(
            `https://graph.microsoft.com/v1.0/me/mailFolders/sentItems/messages?$top=10&$orderby=sentDateTime desc`,
            { headers: { Authorization: `Bearer ${this.token}` } }
        );
        // .ok checks the status code and returns true or false based on its range
        if (!result.ok) {
            const errorText = await result.text();
            throw new Error(`API Error: ${result.status} ${errorText}`);
        }
        // Convert the result to JSON and catch if its empty
        const data = await result.json();
        if (!data.value) {
            return [];
        }
        // Parse each email from JSON as a SentEmail Object and return an array
        const sentEmails = data.value.map((message: any) => this.parseSentEmail(message));
        return sentEmails;
    }
    // Interperet/Parse the JSON response from the Graph API call to a SentEmail Object
    private parseSentEmail(message: any): SentEmail {
        const id = message.id;
        const subject = message.subject || "";
        // Decode the body to readable string using a method below
        const body = this.decodeBody(message.body);
        const date = new Date(message.sentDateTime);
        const recipient = message.toRecipients?.[0]?.emailAddress?.address || "";
        return new SentEmail(id, subject, body, date, recipient);
    }
    // Similar to getSentEmails but for received emails
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
    // Decode body by checking if its HTML or text and returning based on that
    private decodeBody(body: any): string {
        if (!body?.content) return "";
        const content = body.content;
        const isHtml = body.contentType?.toLowerCase().includes("html");
        // Remove html tags if content is HTML
        return isHtml ? content.replace(/<[^>]*>/g, "").trim() : content;
    }
    //Send a reply through the same Microsoft Graph API
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
