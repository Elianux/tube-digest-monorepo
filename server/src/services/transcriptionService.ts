import * as fs from "fs";
import Groq from "groq-sdk";
import path from "path";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

export async function transcribeAudio(filePath: string): Promise<string> {
  console.log("Starting transcription for audio file:", filePath);

  try {
    const audioBuffer: Buffer = fs.readFileSync(filePath);
    const audioFile: File = new File([audioBuffer], "audio.mp3", {
      type: "audio/mp3",
    });

    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-large-v3",
    });

    console.log("Transcription completed.");

    // Remove the temporary file after successful transcription
    fs.unlinkSync(filePath);
    console.log("Temporary audio file removed:", filePath);

    return transcription.text;
  } catch (error) {
    console.error("Error during transcription:", error);
    throw error; // Rethrow the error to handle it in the controller
  }
}
