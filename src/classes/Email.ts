class Email { 
    protected id: string;
    protected subject: string;
    protected body: string;
    protected date: Date;
    constructor(id: string, subject: string, body: string, date: Date) {
        this.id = id;
        this.subject = subject;
        this.body = body;
        this.date = date;
    }
    public getId(): string {
        return this.id;
    }
    public getBody(): string {
        return this.body;
    }
    public getSubject(): string {
        return this.subject;
    }
    public getDate(): Date {
        return this.date;
    }

}
export default Email;