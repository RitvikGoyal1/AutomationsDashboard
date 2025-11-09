import { GoogleGenerativeAI } from "@google/generative-ai";
import User from "./User";

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

class GeminiServices {
  private static modelName = "gemini-2.5-flash";
  private static genAI = new GoogleGenerativeAI(geminiApiKey);
  private static model = GeminiServices.genAI.getGenerativeModel({model: GeminiServices.modelName});

  public static async genSummary(body: string): Promise<string> {
    const prompt ="Summarize the following email in 5-6 concise bullet points, straight to the point:\n\n" + body;
    const response = await this.model.generateContent(prompt);
    return response.response.text();
  }
  public static async genReply(writingStyle: string, body: string): Promise<string> {
    const prompt = `Reply to the following email using this writing style and tone ${writingStyle}:\n\n` + body;
    const response = await this.model.generateContent(prompt);
    return response.response.text();
  }
  public static async understandWritingStyle(user: User, samples: string[]): Promise<void> {
    const combinedSamples = samples.join("\n\n");
    const prompt = `Analyze the following email samples and describe the writing style and tone in a few words:\n\n` + combinedSamples;
    const response = await this.model.generateContent(prompt);
    user.setWritingStyle(response.response.text());
  }
}
export default GeminiServices;
