import Email from './Email';
import GeminiServices from './GeminiServices';
import GmailServices from './GmailServices';
import User from './User';
class ReceivedEmail extends Email {
    public sender: string;
    private gemini: GeminiServices;

    constructor(id: string, subject: string, body: string, date: Date, sender: string) {
        super(id, subject, body, date);
        this.sender = sender;
        this.gemini = new GeminiServices();
    }

    public getSender(): string {
        return this.sender;
    }
    public genSummary(): string {
        return this.gemini.genSummary(this.body);
    }
    public genReply(): string {
        return this.gemini.genReply(User.getWritingStyle(), this.body);
    }
    public sendReply(reply: string): void {
        GmailServices.sendReply(reply);

    }
}
export default ReceivedEmail;