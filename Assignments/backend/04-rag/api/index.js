import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import OpenAI from "openai";
// import serverless from "serverless-http";
import { RecursiveUrlLoader } from "@langchain/community/document_loaders/web/recursive_url";
import { compile } from "html-to-text";

// Express app
const app = express();
app.use(cors());
app.use(express.json());

// Multer in-memory storage (serverless-friendly)
const upload = multer({ storage: multer.memoryStorage() });

const compiledConvert = compile({ wordwrap: 130 });
const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- Create document from user text ---
function createDocumentFromText(text, metadata = {}) {
  return { pageContent: text, metadata };
}

// --- Load documents from sources ---
async function loadDocuments({ pdfBuffer, csvBuffer, textContent, url }) {
  let docs = [];

  if (url) {
    const loader = new RecursiveUrlLoader(url, {
      extractor: compiledConvert,
      maxDepth: 1,
      excludeDirs: ["/docs/api/"],
    });
    const urlDocs = await loader.load();
    docs = docs.concat(urlDocs);
  }

  if (pdfBuffer) {
    const pdfLoader = new PDFLoader(pdfBuffer);
    const pdfDocs = await pdfLoader.load();
    const pdfSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 3000,
      chunkOverlap: 300,
    });
    const splitPdf = await pdfSplitter.splitDocuments(
      pdfDocs.map((doc) => ({
        ...doc,
        metadata: { ...doc.metadata, source: "PDF" },
      }))
    );
    docs = docs.concat(splitPdf);
  }

  if (csvBuffer) {
    const csvLoader = new CSVLoader(csvBuffer);
    const csvDocs = await csvLoader.load();
    const csvSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 2000,
      chunkOverlap: 100,
    });
    const splitCsv = await csvSplitter.splitDocuments(
      csvDocs.map((doc) => ({
        ...doc,
        metadata: { ...doc.metadata, source: "CSV" },
      }))
    );
    docs = docs.concat(splitCsv);
  }

  if (textContent) {
    docs.push(createDocumentFromText(textContent, { source: "User-text" }));
  }

  return docs;
}

// --- Indexing endpoint ---
app.post(
  "/api/index",
  upload.fields([{ name: "pdf" }, { name: "csv" }]),
  async (req, res) => {
    try {
      const pdfBuffer = req.files?.pdf?.[0]?.buffer || null;
      const csvBuffer = req.files?.csv?.[0]?.buffer || null;
      const textContent = req.body?.textContent || null;
      const url = req.body?.websiteUrl;

      const docs = await loadDocuments({
        pdfBuffer,
        csvBuffer,
        textContent,
        url,
      });
      if (!docs.length)
        return res.status(400).json({ message: "No documents provided!" });

      const embeddings = new OpenAIEmbeddings({
        model: "text-embedding-3-large",
        apiKey: process.env.OPENAI_API_KEY,
      });

      await QdrantVectorStore.fromDocuments(docs, embeddings, {
        url: process.env.QDRANT_URL, // Cloud Qdrant URL
        apiKey: process.env.QDRANT_API_KEY, // Qdrant API key
        collectionName: "user-uploaded-docs",
      });

      res.json({ message: "Indexing completed!" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
);

// --- Chat endpoint ---
app.post("/api/chat", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ message: "Query is required!" });

    const embeddings = new OpenAIEmbeddings({
      model: "text-embedding-3-large",
      apiKey: process.env.OPENAI_API_KEY,
    });

    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        url: process.env.QDRANT_URL,
        apiKey: process.env.QDRANT_API_KEY,
        collectionName: "user-uploaded-docs",
      }
    );

    const retriever = vectorStore.asRetriever({ k: 5 });
    const relevantChunks = await retriever.getRelevantDocuments(query);

    const SYSTEM_PROMPT = `
You are an expert AI assistant. Answer user queries based ONLY on the following context:

${relevantChunks
  .map(
    (c) =>
      `Source: ${c.metadata.source || "unknown"}${
        c.metadata.page ? ", Page: " + c.metadata.page : ""
      }${c.metadata.url ? ", URL: " + c.metadata.url : ""}\nContent: ${
        c.pageContent
      }\n`
  )
  .join("\n---\n")}`;

    const response = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: query },
      ],
    });

    res.json({ answer: response.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Root test
app.get("/", (req, res) => res.send("RAG backend is running!"));

// Local run (only if not in serverless env)
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
}

// Export handler for Vercel
// export const handler = serverless(app);
