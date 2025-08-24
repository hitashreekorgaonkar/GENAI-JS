import "dotenv/config";
import http from "http";
import fs from "fs";
import path from "path";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import OpenAI from "openai";

const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const PORT = 3000;

const server = http.createServer(async (req, res) => {
  // --- CORS headers ---
  res.setHeader("Access-Control-Allow-Origin", "*"); // or "http://localhost:4200"
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // --- Handle preflight requests ---
  if (req.method === "OPTIONS") {
    res.writeHead(204); // No Content
    return res.end();
  }

  console.log("req.url", req.url);

  if (req.method === "POST" && req.url === "/api/index") {
    let data = [];

    req.on("data", (chunk) => data.push(chunk));
    req.on("end", async () => {
      const buffer = Buffer.concat(data);

      // Save uploaded file
      const uploadPath = path.join("./uploads", "uploaded.pdf");
      fs.writeFileSync(uploadPath, buffer);

      try {
        // Load PDF and create embeddings
        const loader = new PDFLoader(uploadPath);
        const docs = await loader.load();

        const embeddings = new OpenAIEmbeddings({
          model: "text-embedding-3-large",
        });
        await QdrantVectorStore.fromDocuments(docs, embeddings, {
          url: "http://localhost:6333",
          collectionName: "file-collections",
        });

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "File indexed successfully" }));
      } catch (err) {
        console.error(err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Failed to index PDF" }));
      }
    });
  } else if (req.method === "POST" && req.url === "/api/chat") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const { query } = JSON.parse(body);

        const embeddings = new OpenAIEmbeddings({
          model: "text-embedding-3-large",
          // openAIApiKey: process.env.OPENAI_API_KEY,
        });

        const vectorStore = await QdrantVectorStore.fromExistingCollection(
          embeddings,
          {
            url: "http://localhost:6333",
            collectionName: "file-collections",
          }
        );

        const retriever = vectorStore.asRetriever({ k: 3 });
        const relevantChunk = await retriever.invoke(query);

        const SYSTEM_PROMPT = `
          You are an AI assistant who helps resolving user query based on the
          context available to you from a PDF file with the content and page number.

          Only ans based on the available context from file only.

          Context:
            ${JSON.stringify(relevantChunk)}
          `;

        const response = await openaiClient.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: query },
          ],
        });

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({ answer: response.choices[0].message.content })
        );
      } catch (err) {
        console.error(err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Chat failed" }));
      }
    });
  } else if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Server is working!");
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

server.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
