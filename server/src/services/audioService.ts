import youtubedl from "youtube-dl-exec";

export async function extractAudio(url: string): Promise<string> {
  await youtubedl(url, {
    extractAudio: true,
    audioFormat: "mp3",
    output: "audio.mp3",
  });
  return "audio.mp3";
}
