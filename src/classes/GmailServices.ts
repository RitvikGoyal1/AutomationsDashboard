import SentEmail from "./SentEmail";
import ReceivedEmail from "./ReceivedEmail";
 
class GmailServices {
    private readonly token: string;
    constructor(token: string) {
        this.token = token;
    }

    public async getSentEmails(): Promise<SentEmail[]> {
        const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&labelIds=SENT`,
            { headers: { Authorization: `Bearer ${this.token}` } }
        );
        const data = await res.json();
        return data.messages || [];
    }

    public async getSentEmailDetails(messageId: string): Promise<SentEmail> {
        const emailData = await this.getEmailDetails(messageId);
        const to = this.getHeaderInfo(emailData.headers, "To") || "";
        return new SentEmail(emailData.id, emailData.subject, emailData.body, emailData.date, to);
    }

    public async getReceivedEmails(): Promise<ReceivedEmail[]> {
        const res = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&labelIds=INBOX`,
            { headers: { Authorization: `Bearer ${this.token}` } }
        );
        const data = await res.json();
        return data.messages || [];
    }

    public async getReceivedEmailDetails(messageId: string): Promise<ReceivedEmail> {
        const emailData = await this.getEmailDetails(messageId);
        const from = this.getHeaderInfo(emailData.headers, "From") || "";
        return new ReceivedEmail(emailData.id, emailData.subject, emailData.body, emailData.date, from);
    }

    private async getEmailDetails(messageId: string) {
        const res = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
            { headers: { Authorization: `Bearer ${this.token}` } }
        );
        const data = await res.json();
        const headers = data.payload.headers;
        const subject = this.getHeaderInfo(headers, "Subject");
        const finalSubject = subject ? subject : "(No Subject)";
        const body = data.payload.parts[0].body.data;
        const dateString = this.getHeaderInfo(headers, "Date");
        const date = dateString ? new Date(dateString) : new Date();
        return {id: data.id,subject: finalSubject,body: body,date: date,headers: headers};
    }

    private getHeaderInfo(headers: any[], name: string): string | null {
        for (let i = 0; i < headers.length; i++) {
            const header = headers[i];
            if (header.name.toLowerCase() === name.toLowerCase()) {
                return header.value;
            }
        }
        return null;
    }
    public sendReply(emailId: string, body: string): void {
        console.log(`Sending reply to email ${emailId}:`, body);
        alert("Reply sent!");
    }

}

export default GmailServices;