import youtubedl from "youtube-dl-exec";

export async function extractAudio(url: string): Promise<string> {
  console.log("Starting audio extraction for URL:", url);
  await youtubedl(url, {
    extractAudio: true,
    audioFormat: "mp3",
    output: "audio.mp3",
  });
  console.log("Audio extraction completed.");
  return "audio.mp3";
}
