import * as fs from "fs";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

export async function transcribeAudio(filePath: string): Promise<string> {
  const audioBuffer: Buffer = fs.readFileSync(filePath);
  const audioFile: File = new File([audioBuffer], "audio.mp3", {
    type: "audio/mp3",
  });
  const transcription = await groq.audio.transcriptions.create({
    file: audioFile,
    model: "whisper-large-v3",
  });
  return transcription.text;
}
