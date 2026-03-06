import User from "./User";

const mistralApiKey = import.meta.env.VITE_MISTRAL;

type MistralMessage = {
    role: "user";
    content: string;
};

type MistralResponse = {
    choices?: Array<{ message?: { content?: string } }>;
};

class MistralServices {
    private static modelName = "mistral-small-latest";
    private static endpoint = "https://api.mistral.ai/v1/chat/completions";
    // send request to mistral API
    private static async request(messages: MistralMessage[]): Promise<string> {
        if (!mistralApiKey) {
            throw new Error("API key is not set");
        }
        const result = await fetch(this.endpoint, {
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
        if (!result.ok) {
            throw new Error(`Mistral API error: ${result.status}`);
        }
        const data = (await result.json()) as MistralResponse;
        return data.choices?.[0]?.message?.content?.trim() || "";
    }
    // generate summary of email body
    public static async genSummary(body: string): Promise<string> {
        const prompt =
            "Summarize the following email in bullet points. Use no special characters other than colon. Only include whats necessary to know about what the sender is saying, don't include filler words just the main points that reader needs to know about the email:\n\n" +
            body;
        return await this.request([{ role: "user", content: prompt }]);
    }
    // generate reply to an email using user's writing style
    public static async genReply(writingStyle: string, body: string): Promise<string> {
        const prompt =
            `Write a ready to send reply to the sender of the email below using this writing style and tone ${writingStyle}. Reply only with the email body. Use no special characters other than colon:\n\n` +
            body;
        return await this.request([{ role: "user", content: prompt }]);
    }

    // analyze sent emails to figure out user writing style
    public static async understandWritingStyle(user: User, samples: string[]): Promise<void> {
        const combinedSamples = samples.join("\n\n");
        const prompt =
            "Analyze the following email samples and describe the writing style and tone in a few words. Use no special characters other than colon:\n\n" +
            combinedSamples;
        const result = await this.request([{ role: "user", content: prompt }]);
        user.setWritingStyle(result);
    }
    // create task list from users emails
    public static async getTasks(user: User, samples: string[]): Promise<void> {
        const combinedSamples = samples.join("\n\n");
        // prompt to analyze emails and extract tasks
        const prompt =
            "Analyze the following email samples and create a prioritized task list. Output must be plain text only. Use exactly this structure for each main task: top-level task at column 0, then at least one real child subtask with exactly 2 leading spaces, then metadata lines with exactly 2 leading spaces. Every main task must include: one child action line, one Deadline: line, and one Priority: line. Do not output a main task without a non-metadata child subtask. Do not use markdown, code fences, numbering, or extra commentary. Allowed punctuation: colon, hyphen, period. Example format: Main task line; two-space Action: child action; two-space Deadline: date; two-space Priority: High Medium Low.\n\n" +
            combinedSamples;
        const result = await this.request([{ role: "user", content: prompt }]);
        user.setTasks(result);
    }
}

export default MistralServices;
