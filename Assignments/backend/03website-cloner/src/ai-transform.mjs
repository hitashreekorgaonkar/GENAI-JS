import fs from "fs"; // File System module. Used to read and write files on your computer.
import path from "path"; // Helps work with file paths safely across different operating systems.
import OpenAI from "openai"; // The official OpenAI API client to interact with GPT models.
import dotenv from "dotenv"; // Loads environment variables from a .env file. This is useful for keeping your API keys secret.
import fetch from "node-fetch"; // Used to make HTTP requests to fetch HTML from URLs.

dotenv.config(); // Reads your .env file and loads variables into process.env.

const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Stores your API key so you can use OpenAI safely.

if (!OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY is missing!");
  process.exit(1);
} else {
  console.log(
    "✅ OPENAI_API_KEY is loaded:",
    OPENAI_API_KEY.slice(0, 5) + "*****"
  );
}

const client = new OpenAI({ apiKey: OPENAI_API_KEY }); // Creates a client object (client) you will use to talk to GPT models. You don’t have to pass the API key every time; it’s stored in this client.

// This function handles getting the HTML content from a URL
async function loadHTML(input) {
  if (input.startsWith("http://") || input.startsWith("https://")) {
    console.log(`🌍 Fetching from URL: ${input}`);
    const res = await fetch(input); // Uses fetch to download the webpage.
    if (!res.ok) {
      throw new Error(`Failed to fetch URL: ${res.statusText}`);
    }
    const html = await res.text(); // Reads the HTML content as a string.

    // Save to raw folder
    const rawDir = path.join("out", "raw"); // Creates a folder out/raw to store the downloaded HTML.
    fs.mkdirSync(rawDir, { recursive: true }); // recursive: true ensures it creates all folders if they don’t exist.

    const fileName = input.replace(/[^a-z0-9]/gi, "_") + ".html"; // Converts the URL into a safe file name (replaces symbols with _).
    const rawPath = path.join(rawDir, fileName); // Saves the HTML into out/raw.
    fs.writeFileSync(rawPath, html, "utf-8"); // writeFileSync → Writes a file synchronously, meaning Node will wait until the file is fully written before continuing. rawPath → “Here’s the raw material we got from the website.”
    console.log(`✅ Saved raw HTML to: ${rawPath}`);
    return { html, sourcePath: rawPath }; // Returns both the HTML content and the path where it was saved.
  } else {
    console.log(`📂 Reading local file: ${input}`);
    const html = fs.readFileSync(input, "utf-8");
    return { html, sourcePath: input }; // Simply reads a local HTML file and returns its content.
  }
}

async function runAITransform(input) {
  const { html, sourcePath } = await loadHTML(input); // Loads HTML URL

  console.log(`⚡ Running AI transform on: ${sourcePath}`);

  // Sends a request to GPT
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are an assistant that only fixes broken asset links and converts absolute URLs to relative. Do not change the formatting, indentation, or structure of the HTML, CSS, or JS.",
      },
      { role: "user", content: html }, // user → passes the HTML code you want GPT to transform.
    ],
  });

  const processed = response.choices[0].message.content; // Takes GPT’s response.

  const outDir = path.join("out", "clean"); // Saves it into a clean folder out/clean.
  fs.mkdirSync(outDir, { recursive: true });

  const outFile = path.join(outDir, path.basename(sourcePath)); // The new file has the same name as the original file.
  fs.writeFileSync(outFile, processed); // Again, it writes a file synchronously. Here, the content is processed, which is the HTML rewritten by GPT. outFile → “Here’s the finished product after AI cleaned it.”

  console.log(`✅ AI transform finished. Output written to: ${outFile}`);
}

const inputArg = process.argv[2]; // process.argv[2] → url you passed

if (!inputArg) {
  console.error("Usage: node src/ai-transform.mjs <url>");
  process.exit(1);
}

runAITransform(inputArg); // This is the main function that uses GPT to clean up your HTML.
