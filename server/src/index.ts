import "dotenv/config";
import express, { text } from "express";
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
  const response = await axios.get<string>(url); // Use generic type here
  const $ = cheerio.load(response.data);
  const title: string = $("title").text().replace(" - YouTube", "").trim();
  const description: string =
    $('meta[name="description"]').attr("content") || "No description available";
  return { title, description };
}

// Summarization with Groq
async function summarizeContent(
  transcription: string,
  metadata: Metadata
): Promise<string> {
  const prompt: string = `
    Summarize the main points and their comprehensive explanations from below text, presenting them under appropriate headings. Use various Emoji to symbolize different sections, and format the content as a cohesive paragraph under each heading. Ensure the summary is clear, detailed, and informative, reflecting the executive summary style found in news articles. Avoid using phrases that directly reference 'the script provides' to maintain a direct and objective tone.
    Title: ${metadata.title}
    Description: ${metadata.description}
    Transcription: ${transcription}
  `;
  const chatCompletion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "mixtral-8x7b-32768",
    max_completion_tokens: 300,
  });
  return chatCompletion.choices[0]?.message?.content || "No summary generated";
}

// Controller function
async function handleTranscribe(req: Request, res: Response): Promise<void> {
  const { url } = req.body as TranscribeRequestBody;

  if (!url || !url.includes("youtube.com/watch?v=")) {
    res.status(400).json({ error: "Invalid YouTube URL" });
    return;
  }

  try {
    const audioFile = await extractAudio(url);
    const transcription = await transcribeAudio(audioFile);
    const metadata = await getVideoMetadata(url);
    const summary = await summarizeContent(transcription, metadata);

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
