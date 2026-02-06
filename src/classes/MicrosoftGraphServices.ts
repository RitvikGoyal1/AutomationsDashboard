import SentEmail from "./SentEmail";
import ReceivedEmail from "./ReceivedEmail";
class MicrosoftGraphServices {
  private token: string;
  constructor(token: string) {
    this.token = token;
  }

  public async getSentEmails(): Promise<SentEmail[]> {
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/me/messages?$filter=isDraft eq false and (from/emailAddress/address eq me)&$top=10&$orderby=sentDateTime desc`,
      { headers: { Authorization: `Bearer ${this.token}` } },
    );
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Graph API error: ${res.status} ${errorText}`);
    }
    const data = await res.json();
    if (!data.value) {
      return [];
    }
    const sentEmails = data.value.map((message: any) =>
      this.parseSentEmail(message),
    );
    return sentEmails;
  }
  private parseSentEmail(message: any): SentEmail {
    const id = message.id;
    const subject = message.subject || "";
    const body = this.decodeBody(message.body);
    const date = new Date(message.sentDateTime);
    const recipient = message.toRecipients?.[0]?.emailAddress?.address || "";
    return new SentEmail(id, subject, body, date, recipient);
  }

  public async getReceivedEmails(): Promise<ReceivedEmail[]> {
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/me/messages?$filter=isDraft eq false&$top=10&$orderby=receivedDateTime desc`,
      { headers: { Authorization: `Bearer ${this.token}` } },
    );
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Graph API error: ${res.status} ${errorText}`);
    }
    const data = await res.json();
    if (!data.value) {
      return [];
    }
    const receivedEmails = data.value.map((message: any) =>
      this.parseReceivedEmail(message),
    );
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
  private decodeBody(body: any): string {
    if (!body) return "";
    const content = body.content || "";
    const contentType = body.contentType || "text";
    if (contentType.toLowerCase().includes("html")) {
      return content.replace(/<[^>]*>/g, "").trim();
    }
    return content;
  }
  public async sendReply(emailId: string, replyBody: string): Promise<void> {
    try {
      const payload = {
        comment: replyBody,
      };
      const res = await fetch(
        `https://graph.microsoft.com/v1.0/me/messages/${emailId}/reply`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );
      if (res.ok) {
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
