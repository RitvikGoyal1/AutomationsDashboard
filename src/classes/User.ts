class User{
    private writingStyle: string;
    constructor(){
        this.writingStyle = "";
    }
    setWritingStyle(style: string): void {
        this.writingStyle = style;
    }
    getWritingStyle(): string {
        return this.writingStyle;
    }
}
export default User;