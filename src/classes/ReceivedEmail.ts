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
    public async genSummary(): Promise<string> {
        return await this.gemini.genSummary(this.body);
    }
    public async genReply(User: User): Promise<string> {
        return await this.gemini.genReply(User.getWritingStyle(), this.body);
    }
    public sendReply(reply: string): void {
        GmailServices.sendReply(reply);

    }
}
export default ReceivedEmail;