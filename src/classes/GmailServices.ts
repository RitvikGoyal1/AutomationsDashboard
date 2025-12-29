import SentEmail from "./SentEmail";
import ReceivedEmail from "./ReceivedEmail";
class GmailServices {
    
    private token: string;
    constructor(token: string) {
        this.token = token;
    }

    public async getSentEmails(): Promise<SentEmail[]> {
        const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&labelIds=SENT`,
            { headers: { Authorization: `Bearer ${this.token}` } }
        );
        const data = await res.json();
        if (!data.messages) {
            return [];
        }
        const sentEmails = await Promise.all(data.messages.map((message: any) => this.getSentEmailDetails(message.id)));
        return sentEmails;
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
        if (!data.messages) {
            return [];
        }
        const receivedEmails = await Promise.all ( data.messages.map((message: any) => this.getReceivedEmailDetails(message.id)));
        return receivedEmails;
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

        const payload = data.payload;
        const dataField = payload?.body?.data ?? payload?.parts?.[0]?.body?.data ?? "";

        const body = dataField ? this.decodeBody(dataField) : "";
        const dateString = this.getHeaderInfo(headers, "Date");
        const date = dateString ? new Date(dateString) : new Date();
        return {id: data.id,subject: finalSubject,body: body,date: date,headers: headers,threadId: data.threadId};
    }
    private decodeBody(base64Url: string): string {
        const base64 = base64Url.replace(/-/g,'+').replace(/_/g,'/');
        const binary = atob(base64);
        const bytes = Uint8Array.from(binary, c=>c.charCodeAt(0));
        return new TextDecoder('utf-8').decode(bytes);
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
    public async sendReply(emailId: string, body: string): Promise<void> {
        try {
            const original = await this.getEmailDetails(emailId);
            const toHeader = this.getHeaderInfo(original.headers, "From") ||"";
            const subjectHeader = original.subject ||"";
            const inReplyTo = this.getHeaderInfo(original.headers, "From") ||"";
            const references = this.getHeaderInfo(original.headers,"References")||inReplyTo;

            const raw = `To: ${toHeader} \r\n`+ `Subject: Re: ${subjectHeader} \r\n`+ (inReplyTo?`In-Reply-To: ${inReplyTo}\r\n`:"") + (references?`References:${references}\r\n`:"")+`\r\n${body}`;

            const encoded = btoa(unescape(encodeURIComponent(raw))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
            const res = await fetch(
                `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`,
                {
                    method:"POST",
                    headers:{
                        Authorization: `Bearer ${this.token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({raw:encoded, threadId: original.threadId})
                }
            );
            
            if (res.ok){
                console.log("Reply sent");
                alert("Reply Sent!");
            }
            else{
                throw new Error("Failed to send reply");
            }
        } 
        catch(e){
            console.error(e);
            alert("Error");
        }
    }

    private getRecipientEmail(emailId: string): string{
        return"";
    }
}

export default GmailServices;
