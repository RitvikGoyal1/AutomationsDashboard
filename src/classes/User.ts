class User{
    private writingStyle: string;
    constructor(){
        this.writingStyle = "";
    }
    public setWritingStyle(style: string): void {
        this.writingStyle = style;
    }
    public getWritingStyle(): string {
        return this.writingStyle;
    }
}
export default User; 