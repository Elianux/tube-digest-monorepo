"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

interface Result {
  transcription: string;
  metadata: { title: string; description: string };
  summary: string;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error);
      }

      const data: Result = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-100">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Tube Digest</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter YouTube URL"
          className="w-full p-2 mb-4 border rounded text-black bg-white"
          disabled={loading}
        />
        <button
          type="submit"
          className="w-full p-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
          disabled={loading}
        >
          {loading ? "Processing..." : "Transcribe"}
        </button>
      </form>

      {error && <p className="mt-4 text-red-500">{error}</p>}

      {result && (
        <div className="mt-6 w-full max-w-md text-gray-800">
          <h2 className="text-xl font-semibold">Results</h2>
          <div className="mt-2">
            <h3 className="font-medium">Title:</h3>
            <p>{result.metadata.title}</p>
          </div>
          <div className="mt-2">
            <h3 className="font-medium">Description:</h3>
            <p>{result.metadata.description}</p>
          </div>
          <div className="mt-2">
            <h3 className="font-medium">Summary:</h3>
            <ReactMarkdown>{result.summary}</ReactMarkdown>
          </div>
          <div className="mt-2">
            <h3 className="font-medium">Transcription:</h3>
            <p className="whitespace-pre-wrap">{result.transcription}</p>
          </div>
        </div>
      )}
    </main>
  );
}
