import Email from "./Email";

// Inherit from Email and add recipient variable
class SentEmail extends Email {
    private recipient: string;
    constructor(id: string, subject: string, body: string, date: Date, recipient: string) {
        super(id, subject, body, date);
        this.recipient = recipient;
    }
    public getRecipient(): string {
        return this.recipient;
    }
}

export default SentEmail;
