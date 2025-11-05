import Email from "./Email";
import SentEmail from './SentEmail';
import GeminiServices from './GeminiServices';
import ReceivedEmail from './ReceivedEmail';

class GmailServices {
    private token: string;
    private gemini: GeminiServices;
    constructor(token: string) {
        this.token = token;
        this.gemini = new GeminiServices();
    }

    async getSentEmails(): Promise<SentEmail[]> {
        const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&labelIds=SENT`,
            { headers: { Authorization: `Bearer ${this.token}` } }
        );
        const data = await res.json();
        return data.messages || [];
    }

    async getSentEmailDetails(messageId: string): Promise<SentEmail> {

        const res = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
            { headers: { Authorization: `Bearer ${this.token}` } }
        );
        const data = await res.json();
        const subject = this.getHeader(data.payload?.headers, "Subject") || "(No Subject)";
        const to = this.getHeader(data.payload?.headers, "To") || "";
        const body = data.payload?.parts?.[0]?.body?.data || "";
        const dateHeader = this.getHeader(data.payload?.headers, "Date");
        const date = dateHeader ? new Date(dateHeader) : new Date();
        return new SentEmail(data.id, subject, body, date, to);

    }
    async getReceivedEmails(): Promise<ReceivedEmail[]> {
        const res = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&labelIds=INBOX`,
            { headers: { Authorization: `Bearer ${this.token}` } }
        );
        const data = await res.json();
        return data.messages || [];
    }
    async getReceivedEmailDetails(messageId: string): Promise<ReceivedEmail> {
        const res = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
            { headers: { Authorization: `Bearer ${this.token}` } }
        );
        const data = await res.json();
        const subject = this.getHeader(data.payload?.headers, "Subject") || "(No Subject)";
        const from = this.getHeader(data.payload?.headers, "From") || "";
        const body = data.payload?.parts?.[0]?.body?.data || "";
        const dateHeader = this.getHeader(data.payload?.headers, "Date");
        const date = dateHeader ? new Date(dateHeader) : new Date();
        return new ReceivedEmail(data.id, subject, body, date, from);
    }

    private getHeader(headers: any[], name: string): string | null {
        const header = headers.find((h) => h.name.toLowerCase() === name.toLowerCase());
        return header ? header.value : null;
    }
    public static sendReply(body: string): void {

        // Sending reply through Gmail OAuth2
    }

}

export default GmailServices;