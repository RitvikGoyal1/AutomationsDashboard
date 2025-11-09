import Email from './Email';
import GeminiServices from './GeminiServices';
import GmailServices from './GmailServices';
import User from './User';
class ReceivedEmail extends Email {
    private sender: string;

    constructor(id: string, subject: string, body: string, date: Date, sender: string) {
        super(id, subject, body, date);
        this.sender = sender;
    }

    public getSender(): string {
        return this.sender;
    }
    public async genSummary(): Promise<string> {
        return await GeminiServices.genSummary(this.body);
    }
    public async genReply(user: User): Promise<string> {
        return await GeminiServices.genReply(user.getWritingStyle(), this.body);
    }
    public sendReply(reply: string, gmailService: GmailServices): void {
        gmailService.sendReply(this.id, reply);
    }
}
export default ReceivedEmail;
 