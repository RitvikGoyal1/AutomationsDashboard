import Email from "./Email";
import MistralServices from "./MistralServices";
import MicrosoftGraphServices from "./MicrosoftGraphServices";
import User from "./User";
//Inherit from Email and add sender variable, also add a method to generate summary and reply using MistralServices and send the reply using MicrosoftGraphServices
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
        return await MistralServices.genSummary(this.body);
    }
    public async genReply(user: User): Promise<string> {
        return await MistralServices.genReply(user.getWritingStyle(), this.body);
    }
    public sendReply(reply: string, microsoftGraphService: MicrosoftGraphServices): void {
        microsoftGraphService.sendReply(this.id, reply);
    }
}
export default ReceivedEmail;
