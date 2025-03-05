import "dotenv/config";
import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import youtubedl from "youtube-dl-exec";
import * as fs from "fs";
import Groq from "groq-sdk";
import axios from "axios";
import * as cheerio from "cheerio";

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(cors());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

interface Metadata {
  title: string;
  description: string;
}

interface Result {
  transcription: string;
  metadata: Metadata;
  summary: string;
}

interface TranscribeRequestBody {
  url: string;
  promptStyle?: "technical" | "formal" | "casual" | "bullet-points"; // Optional prompt style
  summaryLength?: "short" | "medium" | "detailed"; // Optional summary length
}

// Helper to create a File-like object from Buffer
function bufferToFileLike(buffer: Buffer, filename: string): File {
  return new File([buffer], filename, { type: "audio/mp3" });
}

// Audio extraction
async function extractAudio(url: string): Promise<string> {
  await youtubedl(url, {
    extractAudio: true,
    audioFormat: "mp3",
    output: "audio.mp3",
  });
  return "audio.mp3";
}

// Transcription with Groq Whisper
async function transcribeAudio(filePath: string): Promise<string> {
  const audioBuffer: Buffer = fs.readFileSync(filePath);
  const audioFile: File = bufferToFileLike(audioBuffer, "audio.mp3");
  const transcription = await groq.audio.transcriptions.create({
    file: audioFile,
    model: "whisper-large-v3",
  });
  return transcription.text;
}

// Metadata scraping
async function getVideoMetadata(url: string): Promise<Metadata> {
  const response = await axios.get<string>(url);
  const $ = cheerio.load(response.data);
  const title: string = $("title").text().replace(" - YouTube", "").trim();
  const description: string =
    $('meta[name="description"]').attr("content") || "No description available";
  return { title, description };
}

// Summarization with Groq
async function summarizeContent(
  transcription: string,
  metadata: Metadata,
  promptStyle: TranscribeRequestBody["promptStyle"] = "formal",
  summaryLength: TranscribeRequestBody["summaryLength"] = "medium"
): Promise<string> {
  // Define max tokens based on summary length
  const maxTokensMap = {
    short: 100, // ~50-100 words
    medium: 250, // ~150-250 words
    detailed: 500, // ~300-500 words
  };
  const maxTokens = maxTokensMap[summaryLength];

  // Define prompt based on style
  let prompt: string;
  switch (promptStyle) {
    case "technical":
      prompt = `
        Summarize the following YouTube video transcription with a focus on technical accuracy and key concepts. Extract and clarify the main ideas, methodologies, frameworks, formulas, or processes discussed. Maintain precision and avoid unnecessary simplifications while keeping the summary concise and structured. If applicable, include relevant terminology, definitions, or key takeaways. Keep the summary within ${maxTokens} words.
        Title: ${metadata.title}
        Description: ${metadata.description}
        Transcription: ${transcription}
      `;
      break;
    case "formal":
      prompt = `
        Summarize the following YouTube video transcription in a professional and structured manner. Highlight the key arguments, main ideas, and conclusions while maintaining clarity and conciseness. Ensure the summary remains objective, avoiding unnecessary details or filler words. Keep the summary within ${maxTokens} words and maintain a formal tone.
        Title: ${metadata.title}
        Description: ${metadata.description}
        Transcription: ${transcription}
      `;
      break;
    case "casual":
      prompt = `
        Give me a quick and easy-to-understand summary of this YouTube video transcription. Keep it conversational and to the point, like you're explaining it to a friend. Focus on the main ideas and takeaways, but feel free to simplify complex points. Try to keep it within ${maxTokens} words.
        Title: ${metadata.title}
        Description: ${metadata.description}
        Transcription: ${transcription}
      `;
      break;
    case "bullet-points":
      prompt = `
        Summarize this YouTube video transcription using bullet points. Focus on the key ideas, main arguments, and any important conclusions. Keep each point concise and clear, avoiding unnecessary details. The goal is to provide a structured, easy-to-skim summary.
        Title: ${metadata.title}
        Description: ${metadata.description}
        Transcription: ${transcription}
      `;
      break;
    default:
      prompt = `
        Summarize the content below in a clear and neutral manner.
        Title: ${metadata.title}
        Description: ${metadata.description}
        Transcription: ${transcription}
      `;
  }

  const chatCompletion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "mixtral-8x7b-32768",
    max_completion_tokens: maxTokens,
  });
  return chatCompletion.choices[0]?.message?.content || "No summary generated";
}

// Controller function
async function handleTranscribe(req: Request, res: Response): Promise<void> {
  const { url, promptStyle, summaryLength } = req.body as TranscribeRequestBody;

  if (!url || !url.includes("youtube.com/watch?v=")) {
    res.status(400).json({ error: "Invalid YouTube URL" });
    return;
  }

  try {
    const audioFile = await extractAudio(url);
    const transcription = await transcribeAudio(audioFile);
    const metadata = await getVideoMetadata(url);
    const summary = await summarizeContent(
      transcription,
      metadata,
      promptStyle,
      summaryLength
    );

    fs.unlinkSync(audioFile); // Clean up

    const result: Result = { transcription, metadata, summary };
    res.json(result);
  } catch (error) {
    console.error("Processing error:", error);
    res.status(500).json({ error: "Failed to process video" });
  }
}

// Routes
const router = express.Router();
router.post("/transcribe", handleTranscribe);

// Add router to app
app.use(router);

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
