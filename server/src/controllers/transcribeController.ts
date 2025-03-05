import { Request, Response } from "express";
import { extractAudio } from "../services/audioService";
import { transcribeAudio } from "../services/transcriptionService";
import { getVideoMetadata } from "../services/metadataService";
import { summarizeContent } from "../services/summaryService";

interface Metadata {
  title: string;
  description: string;
}

interface TranscribeRequestBody {
  url: string;
  promptStyle?: "technical" | "formal" | "casual" | "bullet-points";
  summaryLength?: "short" | "medium" | "detailed";
}

export async function handleTranscribe(
  req: Request,
  res: Response
): Promise<void> {
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
      promptStyle || "formal",
      summaryLength || "medium"
    );

    res.json({ transcription, metadata, summary });
  } catch (error) {
    console.error("Processing error:", error);
    res.status(500).json({ error: "Failed to process video" });
  }
}
