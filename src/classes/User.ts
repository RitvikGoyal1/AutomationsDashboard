// User class to store user information like writing style and tasks
class User {
    private writingStyle: string;
    private tasks = "";
    constructor() {
        this.writingStyle = "";
    }
    public setWritingStyle(style: string): void {
        this.writingStyle = style;
    }
    public setTasks(tasks: string): void {
        this.tasks = tasks;
    }
    public getTasks(): string {
        return this.tasks;
    }
    public getWritingStyle(): string {
        return this.writingStyle;
    }
}
export default User;
