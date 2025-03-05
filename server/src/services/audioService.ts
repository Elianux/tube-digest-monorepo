import youtubedl from "youtube-dl-exec";
import fs from "fs";
import path from "path";

// Create a temp directory if it doesn't exist
const tempDir = path.join(__dirname, "../temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

export async function extractAudio(url: string): Promise<string> {
  console.log("Starting audio extraction for URL:", url);

  // Use the temp directory for the output path
  const outputPath = path.join(tempDir, "temp_audio.mp3");

  try {
    await youtubedl(url, {
      extractAudio: true,
      audioFormat: "mp3",
      output: outputPath,
    });
    console.log("Audio extraction completed. File saved to:", outputPath);
    return outputPath; // Return the path to the temporary file
  } catch (error) {
    console.error("Error during audio extraction:", error);
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath); // Clean up the temporary file if it exists
    }
    throw error; // Rethrow the error to handle it in the controller
  }
}
