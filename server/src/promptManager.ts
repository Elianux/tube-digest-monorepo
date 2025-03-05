// import { Metadata } from "./index"; // Adjust the import based on your structure

interface Metadata {
  title: string;
  description: string;
}

export function createSummaryPrompt(
  transcription: string,
  metadata: Metadata,
  promptStyle: "technical" | "formal" | "casual" | "bullet-points",
  maxTokens: number
): string {
  const data = `
    Title: ${metadata.title}
    Description: ${metadata.description}
    Transcription: ${transcription}
    Keep the summary within ${maxTokens} words.
  `;

  switch (promptStyle) {
    case "technical":
      return `
        Summarize the following YouTube video transcription with a focus on technical accuracy and key concepts. Extract and clarify the main ideas, methodologies, frameworks, formulas, or processes discussed. Maintain precision and avoid unnecessary simplifications while keeping the summary concise and structured. If applicable, include relevant terminology, definitions, or key takeaways.
        ${data}
      `;
    case "formal":
      return `
        Summarize the following YouTube video transcription in a professional and structured manner. Highlight the key arguments, main ideas, and conclusions while maintaining clarity and conciseness. Ensure the summary remains objective, avoiding unnecessary details or filler words.
        ${data}
      `;
    case "casual":
      return `
        Give me a quick and easy-to-understand summary of this YouTube video transcription. Keep it conversational and to the point, like you're explaining it to a friend. Focus on the main ideas and takeaways, but feel free to simplify complex points.
        ${data}
      `;
    case "bullet-points":
      return `
        Summarize this YouTube video transcription using bullet points. Focus on the key ideas, main arguments, and any important conclusions. Keep each point concise and clear, avoiding unnecessary details. The goal is to provide a structured, easy-to-skim summary.
        ${data}
      `;
    default:
      return `
        Summarize and explain the content based on:
        ${data}
        Provide a concise summary in 2-3 sentences, followed by a brief explanation.
      `;
  }
}
