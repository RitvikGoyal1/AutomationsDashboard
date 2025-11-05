import { GoogleGenerativeAI } from "@google/generative-ai";
import User from "./User";
class GeminiServices {
    private modelName = "gemini-2.5-flash";
    genAI = new GoogleGenerativeAI("AIzaSyBbzP4UdPk-TmaNAEe6IWDBZHKRH3_04cg");
    private model: any;
    constructor() {
        this.model = this.genAI.getGenerativeModel({ model: this.modelName });

    }
    public genSummary(body: string): string {
        const prompt = "Summarize the following email in 5-6 concise bullet points:\n\n" + body;
        const response = this.model.generateContent({
            model: this.modelName,
            prompt: prompt,
        });
        return response;
    }
    public genReply(body: string, writingStyle: string): string {
        const prompt = `Reply to the following email using this writing style and tone ${writingStyle}:\n\n` + body;
        const response = this.model.generateContent({model: this.modelName, prompt: prompt});
        return response;
    }
    public understandWritingStyle(samples: string[]): void {
        const combinedSamples = samples.join("\n\n");
        const prompt = `Analyze the following email samples and describe the writing style and tone in a few words:\n\n` + combinedSamples;
        const response = this.model.generateContent({model: this.modelName, prompt: prompt});
        User.setWritingStyle(response);
    }
}
export default GeminiServices;