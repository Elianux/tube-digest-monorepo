import axios from "axios";
import * as cheerio from "cheerio";

interface Metadata {
  title: string;
  description: string;
}

export async function getVideoMetadata(url: string): Promise<Metadata> {
  const response = await axios.get<string>(url);
  const $ = cheerio.load(response.data);
  const title: string = $("title").text().replace(" - YouTube", "").trim();
  const description: string =
    $('meta[name="description"]').attr("content") || "No description available";
  return { title, description };
}
