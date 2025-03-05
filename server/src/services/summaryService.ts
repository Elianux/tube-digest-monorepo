import Groq from "groq-sdk";
import { createSummaryPrompt } from "../utils/promptManager";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

interface Metadata {
  title: string;
  description: string;
}

export async function summarizeContent(
  transcription: string,
  metadata: Metadata,
  promptStyle: "technical" | "formal" | "casual" | "bullet-points",
  summaryLength: "short" | "medium" | "detailed"
): Promise<string> {
  console.log("Starting content summarization...");
  const maxTokensMap = {
    short: 100,
    medium: 250,
    detailed: 500,
  };
  const maxTokens = maxTokensMap[summaryLength];

  const prompt = createSummaryPrompt(
    transcription,
    metadata,
    promptStyle,
    maxTokens
  );

  console.log("Sending prompt to Groq for summarization...");
  const chatCompletion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "mixtral-8x7b-32768",
    max_completion_tokens: maxTokens,
  });

  console.log("Summarization completed.");
  return chatCompletion.choices[0]?.message?.content || "No summary generated";
}
