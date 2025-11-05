import { GoogleGenerativeAI } from "@google/generative-ai";
import User from "./User";
const geminiApiKey = import.meta.env.GEMINI_API_KEY;
class GeminiServices {
    private modelName = "gemini-2.5-flash";
<<<<<<< HEAD
    genAI = new GoogleGenerativeAI(geminiApiKey);
=======
    genAI = new GoogleGenerativeAI("");
>>>>>>> 943b424d00363d35576df0ba049a7e1aff9a6e97
    private model: any;
    constructor() {
        this.model = this.genAI.getGenerativeModel({ model: this.modelName });

    }
    public async genSummary(body: string): Promise<string> {
        const prompt = "Summarize the following email in 5-6 concise bullet points:\n\n" + body;
        const response = await this.model.generateContent({
            model: this.modelName,
            prompt: prompt,
        });
        return response;
    }
    public async genReply(body: string, writingStyle: string): Promise<string> {
        const prompt = `Reply to the following email using this writing style and tone ${writingStyle}:\n\n` + body;
        const response = await this.model.generateContent({model: this.modelName, prompt: prompt});
        return response;
    }
    public async understandWritingStyle(User: User,samples: string[]): Promise<void> {
        const combinedSamples = samples.join("\n\n");
        const prompt = `Analyze the following email samples and describe the writing style and tone in a few words:\n\n` + combinedSamples;
        const response = await this.model.generateContent({model: this.modelName, prompt: prompt});
        User.setWritingStyle(response);
    }
}
export default GeminiServices;
