import axios from "axios";
import * as cheerio from "cheerio";

interface Metadata {
  title: string;
  description: string;
}

export async function getVideoMetadata(url: string): Promise<Metadata> {
  console.log("Fetching video metadata for URL:", url);
  const response = await axios.get<string>(url);
  const $ = cheerio.load(response.data);
  const title: string = $("title").text().replace(" - YouTube", "").trim();
  const description: string =
    $('meta[name="description"]').attr("content") || "No description available";
  console.log("Metadata fetched:", { title, description });
  return { title, description };
}
