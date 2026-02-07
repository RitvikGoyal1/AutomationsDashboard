import User from "./User";

const mistralApiKey = import.meta.env.VITE_MISTRAL;

type MistralMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

type MistralResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

class GeminiServices {
  private static modelName = "mistral-small-latest";
  private static endpoint = "https://api.mistral.ai/v1/chat/completions";

  private static async request(messages: MistralMessage[]): Promise<string> {
    if (!mistralApiKey) {
      throw new Error("VITE_MISTRAL is not set");
    }
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mistralApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.modelName,
        messages,
        temperature: 0.7,
      }),
    });
    if (!res.ok) {
      throw new Error(`Mistral API error: ${res.status}`);
    }
    const data = (await res.json()) as MistralResponse;
    return data.choices?.[0]?.message?.content?.trim() || "";
  }

  public static async genSummary(body: string): Promise<string> {
    const prompt =
      "Summarize the following email in bullet points. Use no special characters other than colon. Only include whats necessary to know about what the sender is saying, don't include filler words just the main points that reader needs to know about the event:\n\n" +
      body;
    return await this.request([{ role: "user", content: prompt }]);
  }

  public static async genReply(
    writingStyle: string,
    body: string,
  ): Promise<string> {
    const prompt =
      `Write a ready to send reply to the sender of the email below using this writing style and tone ${writingStyle}. Reply only with the email body. Use no special characters other than colon:\n\n` +
      body;
    return await this.request([{ role: "user", content: prompt }]);
  }

  public static async understandWritingStyle(
    user: User,
    samples: string[],
  ): Promise<void> {
    const combinedSamples = samples.join("\n\n");
    const prompt =
      "Analyze the following email samples and describe the writing style and tone in a few words. Use no special characters other than colon:\n\n" +
      combinedSamples;
    const result = await this.request([{ role: "user", content: prompt }]);
    user.setWritingStyle(result);
  }
}

export default GeminiServices;
